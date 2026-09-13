import fs from 'node:fs';
import crypto from 'node:crypto';

const BASE_SHA='09ff8bf77f113b1db436c635cb8abf9522846b9f';
const input=fs.readFileSync('data/sense-candidates-calibration-400.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const labeled=input.filter(r=>typeof r.goldSerious==='boolean');
const falseNegatives=labeled.filter(r=>r.goldSerious===true && !r.afterSenseResolutionSerious);
const falsePositives=labeled.filter(r=>r.goldSerious===false && r.afterSenseResolutionSerious);
const hash=s=>crypto.createHash('sha256').update(`rebulo-sense-coverage-stress-v1|${s}`).digest('hex');

function cause(row){
  const inferred=(row.senseCandidates||[]).find(s=>s.provenanceStatus==='inferred_candidate');
  const observed=(row.senseCandidates||[]).filter(s=>s.provenanceStatus==='observed');
  const editorial=(row.senseCandidates||[]).filter(s=>s.provenanceStatus==='editorial_added');
  const pos=(row.lexicalEntries||[]).map(x=>x.pos).filter(Boolean);
  const w=row.exactWord.toLocaleLowerCase('fr');
  if(editorial.length) return 'editorial_evidence_not_promoting';
  if(observed.length && !observed.some(x=>x.visualConceptCandidate)) return 'observed_source_not_specific_enough';
  if(['course','chasse'].includes(w)) return 'event_or_action_nominalization';
  if(['rêve'].includes(w)) return 'abstract_with_visualizable_scene';
  if(['couple'].includes(w)) return 'collective_or_relational_concept';
  if(['pub'].includes(w)) return 'polysemy_or_context_dependence';
  if(['lettre'].includes(w)) return 'polysemy_text_symbol_object';
  if(['diable'].includes(w)) return 'person_or_character_visual_concept';
  if(pos.includes('NOM') && inferred && !inferred.visualConceptCandidate) return 'missing_positive_sense_evidence';
  return 'other_missing_sense_evidence';
}

const fnAudit=falseNegatives.map(r=>({
  calibrationId:r.calibrationId,
  word:r.exactWord,
  ipa:r.ipa,
  baseline:r.baseline,
  calibrationGroup:r.calibrationGroup,
  goldSource:r.goldSource,
  lexicalEntries:r.lexicalEntries,
  currentSenseCandidates:r.senseCandidates,
  refusalReason:cause(r),
  currentProvenanceStatuses:[...new Set((r.senseCandidates||[]).map(s=>s.provenanceStatus))]
}));

const stressPool=input.filter(r=>typeof r.goldSerious!=='boolean');
const buckets={
  obvious_concrete:r=>['animal','aliment','corps','nature','lieu','véhicule','outil','vêtement','objet','personne'].includes((r.senseCandidates||[]).find(s=>s.provenanceStatus==='inferred_candidate')?.concreteCategory),
  abstract_or_contextual:r=>['C','D'].includes(r.baseline?.provisionalClass),
  semantic_risk:r=>['semantic_risk_stress','sample1_negative_proxy','pilot90_proxy'].includes(r.calibrationGroup),
  potential_serious:r=>['A','B'].includes(r.baseline?.provisionalClass)
};
const targetPer={obvious_concrete:60,abstract_or_contextual:70,semantic_risk:70,potential_serious:50};
const picked=[]; const seen=new Set();
for(const [name,pred] of Object.entries(buckets)){
  const rows=stressPool.filter(pred).sort((a,b)=>hash(`${a.ipa}|${a.exactWord}`).localeCompare(hash(`${b.ipa}|${b.exactWord}`)));
  let n=0; for(const r of rows){const k=`${r.ipa}|${r.exactWord}`; if(seen.has(k))continue; seen.add(k); picked.push({calibrationId:r.calibrationId,ipa:r.ipa,exactWord:r.exactWord,baseline:r.baseline,calibrationGroup:r.calibrationGroup,currentSenseCandidates:r.senseCandidates,stressGroup:name}); if(++n>=targetPer[name])break;}
}

const out={schemaVersion:'1.0',status:'analysis_only',baseSha:BASE_SHA,labeledCount:labeled.length,falseNegativeCount:falseNegatives.length,falsePositiveCount:falsePositives.length,falseNegatives:fnAudit,causeCounts:Object.fromEntries([...new Set(fnAudit.map(x=>x.refusalReason))].map(c=>[c,fnAudit.filter(x=>x.refusalReason===c).length])),stressCandidates:picked.slice(0,250),stressCount:Math.min(250,picked.length),notes:['No #290 score or threshold is changed.','This audit only materializes current evidence and deterministic stress candidates; it does not promote any sense.']};
fs.writeFileSync('data/sense-coverage-fn-audit.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({falseNegativeCount:out.falseNegativeCount,causeCounts:out.causeCounts,stressCount:out.stressCount},null,2));
