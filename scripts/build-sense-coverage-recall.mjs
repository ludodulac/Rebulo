import fs from 'node:fs';
import crypto from 'node:crypto';

const BASE_SHA='09ff8bf77f113b1db436c635cb8abf9522846b9f';
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const readJsonl=p=>fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const original=readJsonl('data/sense-candidates-calibration-400.jsonl');
const review=readJson('data/sense-coverage-fn-editorial-review.json');
const s1=readJsonl('data/b-to-c-industrial-sample-2000.jsonl');
const s2=readJsonl('data/b-to-c-industrial-sample-2-2000.jsonl');
const hash=s=>crypto.createHash('sha256').update(`rebulo-sense-coverage-v1|${s}`).digest('hex');
const key=r=>`${r.ipa}|${r.exactWord}`;
const editorialByKey=new Map(review.entries.filter(x=>x.decision==='recover_editorial').map(x=>[`${x.ipa}|${x.word}`,x]));
const orangeByKey=new Map(review.entries.filter(x=>x.decision==='keep_orange').map(x=>[`${x.ipa}|${x.word}`,x]));
const originalKeys=new Set(original.map(key));

function stableId(r,label,status){return `sense.${crypto.createHash('sha1').update(`${r.ipa}|${r.exactWord}|${label}|${status}|coverage-v1`).digest('hex').slice(0,12)}`;}
function editorialCandidate(r,rev){return {senseId:stableId(r,rev.expectedConcept,'editorial_added'),label:rev.word,description:rev.description,pos:'NOM',provenance:'sense-coverage/editorial-fn-review-2026-09-13',provenanceStatus:'editorial_added',confidence:rev.falsePositiveRisk==='low'?0.92:0.86,concreteCategory:rev.concreteCategory||null,visualConceptCandidate:true,evidence:['explicit_23_fn_editorial_review',`decision:${rev.decision}`],rationale:rev.reason,ambiguityNotes:[`falsePositiveRisk:${rev.falsePositiveRisk}`]};}
function inferredStress(r){
  const explicit=new Set(['animal','aliment','corps','nature','lieu','véhicule','outil','vêtement','objet','personne']);
  const cat=r.conceptCategory||null;
  const visual=explicit.has(cat);
  return {senseId:stableId(r,r.exactWord,'inferred_candidate'),label:r.exactWord,description:visual?`Sens concret candidat « ${r.exactWord} » (${cat}), non observé.`:`Sens « ${r.exactWord} » non résolu comme concept visuel autonome.`,pos:r.pos||null,provenance:'sense-coverage/stress-semantic-guard-v1',provenanceStatus:'inferred_candidate',confidence:visual?0.82:0.35,concreteCategory:visual?cat:null,visualConceptCandidate:visual,evidence:[`exact_graphy_ipa:${r.exactWord}|${r.ipa}`,visual?`explicit_source_category:${cat}`:'no_positive_concrete_sense_evidence'],rationale:visual?'Catégorie concrète explicite déjà portée par la ligne source; reste une inférence, pas un fait observé.':'Aucune preuve positive suffisante.',ambiguityNotes:r.mainConfusions||[]};
}
function observedStress(r){
  const out=[];
  for(const e of r.legacyEvidence||[]){
    const decision=String(e.decision||'mentioned');
    const rejected=/reject/i.test(decision);
    out.push({senseId:stableId(r,r.exactWord,`observed:${e.source}`),label:r.conceptLabel||r.exactWord,description:r.conceptDescription||`Concept structuré historique « ${r.exactWord} ».`,pos:r.pos||null,provenance:`rebulo_structured:${e.source}`,provenanceStatus:'observed',confidence:rejected?0.25:0.82,concreteCategory:r.conceptCategory||null,visualConceptCandidate:!rejected,evidence:[`structured_record:${e.source}`,`decision:${decision}`],rationale:'Donnée déjà présente dans une source structurée Rebulo; aucun inferred_candidate n’est converti en observed.',ambiguityNotes:e.mainConfusions||[]});
  }
  return out;
}
function makeStress(r,group){
  const senses=[inferredStress(r),...observedStress(r)];
  const evidenceBacked=senses.some(s=>s.provenanceStatus==='observed'&&s.visualConceptCandidate&&s.confidence>=0.8);
  const inferred=senses.some(s=>s.provenanceStatus==='inferred_candidate'&&s.visualConceptCandidate&&s.confidence>=0.8);
  return {stressId:`SCR-${String(stress.length+1).padStart(4,'0')}`,ipa:r.ipa,exactWord:r.exactWord,lexicalEntries:r.lexicalEntries||[],sourceSampleId:r.sampleId||null,sourceStratum:r.selectionStratum||null,stressGroup:group,baseline:{provisionalClass:r.provisionalClass,aggregateScore:r.aggregateScore,serious:['A','B'].includes(r.provisionalClass)},senseCandidates:senses,greenRouteEligible:evidenceBacked,afterSenseResolutionSerious:evidenceBacked||inferred,coverageRoute:evidenceBacked?'green':inferred?'orange':'red',humanNamingEvidence:'none'};
}

const enrichedOriginal=original.map(r=>{
  const rev=editorialByKey.get(key(r));
  const senses=[...(r.senseCandidates||[])];
  if(rev)senses.push(editorialCandidate(r,rev));
  const newGreen=Boolean(r.greenRouteEligible||rev);
  const newAfter=Boolean(r.afterSenseResolutionSerious||rev);
  const route=newGreen?'green':newAfter||orangeByKey.has(key(r))?'orange':'red';
  return {...r,senseCandidates:senses,coverageReviewDecision:rev?'recover_editorial':orangeByKey.has(key(r))?'keep_orange':null,afterCoverageResolutionSerious:newAfter,greenRouteEligibleAfterCoverage:newGreen,coverageRoute:route};
});

const pool=[...s1,...s2].filter(r=>!originalKeys.has(key(r)));
const seen=new Set(); const stress=[];
const groups=[
  ['obvious_concrete',60,r=>['animal','aliment','corps','nature','lieu','véhicule','outil','vêtement','objet','personne'].includes(r.conceptCategory)],
  ['abstract_contextual',50,r=>['abstrait','fonction_ou_qualité'].includes(r.conceptCategory)],
  ['role_action',50,r=>['action','personne_rôle_candidat'].includes(r.conceptCategory)],
  ['ambiguity_polysemy',50,r=>(r.exactHomophoneCount||0)>=2||['pos_sense_risk','multi_concept_ipa','ambiguous_control'].includes(r.selectionStratum)],
  ['low_frequency_other',40,r=>(Number(r.frequency)||0)<2]
];
const requestedQuotas={}; const actualQuotas={};
for(const [group,quota,pred] of groups){
  requestedQuotas[group]=quota;
  const candidates=pool.filter(pred).sort((a,b)=>hash(key(a)).localeCompare(hash(key(b))));
  let n=0;
  for(const r of candidates){if(seen.has(key(r)))continue;seen.add(key(r));stress.push(makeStress(r,group));if(++n>=quota)break;}
  actualQuotas[group]=n;
}
if(stress.length<250){
  const fill=pool.filter(r=>!seen.has(key(r))).sort((a,b)=>hash(`fill|${key(a)}`).localeCompare(hash(`fill|${key(b)}`)));
  for(const r of fill){if(stress.length>=250)break;seen.add(key(r));stress.push(makeStress(r,'deterministic_fill'));}
}
actualQuotas.deterministic_fill=stress.filter(r=>r.stressGroup==='deterministic_fill').length;
if(stress.length!==250)throw new Error(`Expected 250 new stress cases, got ${stress.length}`);
if(stress.some(r=>originalKeys.has(key(r))))throw new Error('Stress overlap with original corpus');

const labeled=enrichedOriginal.filter(r=>typeof r.goldSerious==='boolean');
function metric(pred){let tp=0,fp=0,tn=0,fn=0;for(const r of labeled){const p=pred(r),g=r.goldSerious;if(p&&g)tp++;else if(p&&!g)fp++;else if(!p&&g)fn++;else tn++;}const precision=tp+fp?tp/(tp+fp):1;const recall=tp+fn?tp/(tp+fn):1;const f1=precision+recall?2*precision*recall/(precision+recall):0;return {n:labeled.length,tp,fp,tn,fn,precision:+(precision*100).toFixed(1),recall:+(recall*100).toFixed(1),f1:+(f1*100).toFixed(1)};}
function routes(rows,mode='before'){const c={green:0,orange:0,red:0};for(const r of rows){let route;if(mode==='before')route=r.greenRouteEligible?'green':r.afterSenseResolutionSerious?'orange':'red';else route=r.coverageRoute;c[route]++;}return c;}
const provenance={observed:0,editorial_added:0,inferred_candidate:0};for(const r of [...enrichedOriginal,...stress])for(const s of r.senseCandidates||[])provenance[s.provenanceStatus]=(provenance[s.provenanceStatus]||0)+1;
const stressProv={observed:0,editorial_added:0,inferred_candidate:0};for(const r of stress)for(const s of r.senseCandidates||[])stressProv[s.provenanceStatus]=(stressProv[s.provenanceStatus]||0)+1;
const recovered=enrichedOriginal.filter(r=>r.coverageReviewDecision==='recover_editorial').map(r=>({word:r.exactWord,ipa:r.ipa,evidenceType:'editorial_added'}));
const unresolved=enrichedOriginal.filter(r=>r.coverageReviewDecision==='keep_orange').map(r=>({word:r.exactWord,ipa:r.ipa,route:'orange_review'}));
const before=metric(r=>r.afterSenseResolutionSerious);
const after=metric(r=>r.afterCoverageResolutionSerious);
const metrics={schemaVersion:'1.1',status:'analysis_only',baseSha:BASE_SHA,formula290:'unchanged',humanNamingEvidence:'none',originalCorpusSize:400,labeledEvaluationSize:99,newStressCases:250,extendedCorpusSize:650,stressOverlapWithOriginal:0,stressRequestedQuotas:requestedQuotas,stressActualQuotas:actualQuotas,before,after,falseNegativesRecovered:before.fn-after.fn,falsePositivesIntroduced:after.fp-before.fp,originalRoutesBefore:routes(original,'before'),originalRoutesAfter:routes(enrichedOriginal,'after'),labeledRoutesBefore:routes(labeled,'before'),labeledRoutesAfter:routes(labeled,'after'),extendedRoutes:routes([...enrichedOriginal,...stress],'after'),provenanceTotals:provenance,newStressProvenance:stressProv,newObservedFromStress:stressProv.observed,newEditorialAdded:review.recoverEditorial,newInferredCandidates:stressProv.inferred_candidate,recovered,unresolved,reviewCauseSummary:{missing_positive_sense_evidence:16,event_or_action_nominalization:2,person_or_character_visual_concept:1,collective_or_relational_concept:1,polysemy_or_context_dependence:1,abstract_with_visualizable_scene:1,polysemy_text_symbol_object:1},notes:['No #290 score, weight, threshold or hard guard is changed.','The eight recovered false negatives are editorial_added, never observed.','The 250 stress cases are exact IPA+graphy relations not present in the original 400 calibration corpus.','Green requires observed or editorial_added evidence; inferred candidates may be orange but never green.','The 250 stress cases are not independently gold-labeled; they measure bounded route behavior and provenance coverage, not an independent precision estimate.']};
fs.writeFileSync('data/sense-coverage-recall-650.jsonl',[...enrichedOriginal,...stress].map(x=>JSON.stringify(x)).join('\n')+'\n');
fs.writeFileSync('data/sense-coverage-recall-metrics.json',JSON.stringify(metrics,null,2)+'\n');
console.log(JSON.stringify(metrics,null,2));
