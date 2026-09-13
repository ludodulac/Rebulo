import fs from 'node:fs';
import crypto from 'node:crypto';

const BASE_SHA='b41f086f997e75fafc077a60057700137402af85';
const TARGET=400;
const SEED='rebulo-sense-candidates-prototype-2026-09-13';
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const readJsonl=p=>fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const hash=s=>crypto.createHash('sha256').update(`${SEED}|${s}`).digest('hex');
const key=r=>`${r.ipa}|${r.exactWord}`;

const s2AB=readJson('data/b-to-c-industrial-sample-2-ab-audit-candidates.json').rows;
const s2Audit=readJson('data/b-to-c-industrial-sample-2-ab-editorial-audit.json');
const s2Rescue=readJson('data/b-to-c-industrial-sample-2-rescue-editorial-review.json');
const s1Rescue=readJson('data/b-to-c-industrial-sample-2000-rescue-editorial-review.json');
const pilot=readJson('data/b-to-c-editorial-pilot-90.json');
const s1=readJsonl('data/b-to-c-industrial-sample-2000.jsonl');
const s2=readJsonl('data/b-to-c-industrial-sample-2-2000.jsonl');

const falsePositiveMap=new Map(s2Audit.falsePositives.map(x=>[x.exactWord,x.cause]));
const nearMisses=[...(s1Rescue.nearMissesKeptC||[]).map(x=>({exactWord:x.exactWord,reason:x.reason,source:'#291'})),...(s2Rescue.reviewedNearMisses||[]).map(x=>({exactWord:x.exactWord,reason:x.reason,source:'#292'}))];
const recovered=[...(s1Rescue.recovered||[]).map(x=>({...x,source:'#291'})),...(s2Rescue.recovered||[]).map(x=>({...x,source:'#292'}))];

const SAFE={
  animal:'chien chat cheval loup coq renne oie pie vache veau mouton chèvre porc cochon lapin souris rat lion tigre ours singe poisson requin baleine dauphin poule canard aigle hibou chouette pigeon abeille fourmi mouche araignée serpent grenouille escargot âne'.split(' '),
  aliment:'pomme poire banane orange citron raisin fraise cerise noix noisette pois riz pain lait café thé soupe fromage oeuf œuf gâteau sucre sel miel radis chou tomate carotte salade viande mûre mûres'.split(' '),
  corps:'oeil œil nez pied main doigt bras jambe tête face visage front cerveau coeur cœur os dent bouche langue oreille dos ventre peau sang crâne gueule'.split(' '),
  nature:'soleil lune étoile ciel mer océan rivière lac montagne vallée forêt arbre fleur feuille sable pierre roche pluie neige nuage vent feu eau planète'.split(' '),
  lieu:'route rue chemin ville village prison bureau école gare port pont maison chambre cuisine jardin parc plage île camp champ entrée marché ferme'.split(' '),
  véhicule:'train voiture vélo bus camion bateau navire avion fusée vaisseau moto tracteur tram métro'.split(' '),
  outil:'scie vis pelle marteau tournevis clé pince hache couteau fourche aiguille clou perceuse louche'.split(' '),
  vêtement:'manteau robe chaussure gant chapeau pantalon chemise jupe pull chaussette botte ceinture veste'.split(' '),
  objet:'porte livre lit nid table bâton tasse verre pot seau sac balle ballon papier dossier anneau toit mur phare puits four croix lyre lance tronc grain haie photo téléphone chaise lampe boîte panier corde brosse savon montre horloge bouteille assiette cuillère disque coffre masque piège poche bombe règle coupe'.split(' '),
  personne:'bébé maman mère père maire roi reine marchand vendeur docteur médecin pompier policier professeur enfant garçon fille homme femme prince prêtre juge'.split(' ')
};
const safeMap=new Map(); for(const [cat,words] of Object.entries(SAFE)) for(const w of words) safeMap.set(w.toLocaleLowerCase('fr'),cat);
const NON_AUTONOMOUS=new Set('force honte risque rôle nombre code genre doute preuve calme job soin offre gauche ex zone acte peuple crime style ouest gloire matin souffle titre blague'.split(' '));
const SYMBOL_RE=/^[a-zA-Z0-9]$/;
const ABSTRACT_SUFFIX=/(?:tion|sion|isme|itude|ité|ance|ence|esse|ement|ment)$/i;

function lexicalEntriesOf(r){return Array.isArray(r.lexicalEntries)?r.lexicalEntries:[];}
function stableSenseId(r,label,status){return `sense.${crypto.createHash('sha1').update(`${r.ipa}|${r.exactWord}|${label}|${status}`).digest('hex').slice(0,12)}`;}
function candidate(r,{label,description,pos,provenance,provenanceStatus,confidence,concreteCategory=null,visualConceptCandidate=false,evidence=[],rationale='',ambiguityNotes=[]}){
  return {senseId:stableSenseId(r,label,provenanceStatus),label,description,pos:pos||r.pos||null,provenance,provenanceStatus,confidence,concreteCategory,visualConceptCandidate,evidence,rationale,ambiguityNotes};
}
function inferredCandidate(r){
  const w=String(r.exactWord||'').toLocaleLowerCase('fr'); const lemma=String(r.lemma||w).toLocaleLowerCase('fr'); const cat=safeMap.get(w)||safeMap.get(lemma)||null;
  const nonAut=NON_AUTONOMOUS.has(w)||SYMBOL_RE.test(w)||(r.pos==='NOM'&&ABSTRACT_SUFFIX.test(w)&&!cat);
  const visual=Boolean(cat)&&!nonAut;
  return candidate(r,{label:r.exactWord,description:visual?`Sens concret candidat « ${r.exactWord} » (${cat}), à confirmer au niveau concept.`:`Sens lexical « ${r.exactWord} » non résolu comme concept visuel autonome.`,pos:r.pos,provenance:'sense-prototype/automatic-semantic-guard-v1',provenanceStatus:'inferred_candidate',confidence:visual?0.82:(r.pos==='NOM'?0.38:0.22),concreteCategory:cat,visualConceptCandidate:visual,evidence:[`exact_graphy_ipa:${r.exactWord}|${r.ipa}`,cat?`safe_concrete_lexicon:${cat}`:'no_positive_concrete_sense_evidence',nonAut?'non_autonomous_guard':''],rationale:visual?'Catégorie concrète explicite et autonome dans le lexique de garde.':'Un POS nominal ou une fréquence élevée ne suffit pas à établir un concept visuel.',ambiguityNotes:nonAut?['nominal form is abstract, relational, textual, generic, or context-dependent']:[]});
}
function observedCandidates(r){
  const out=[]; for(const e of r.legacyEvidence||[]){
    if(!e?.source) continue; const rejected=String(e.decision||'').includes('reject');
    out.push(candidate(r,{label:r.conceptLabel||r.exactWord,description:r.conceptDescription||`Concept structuré historique pour ${r.exactWord}.`,pos:r.pos,provenance:`rebulo_structured:${e.source}`,provenanceStatus:'observed',confidence:rejected?0.25:0.82,concreteCategory:r.conceptCategory||null,visualConceptCandidate:!rejected&&['low','medium','unknown'].includes(e.namingRisk||'unknown'),evidence:[`structured_record:${e.source}`,`decision:${e.decision||'mentioned'}`],rationale:'Information de sens/concept déjà présente dans une source structurée Rebulo; elle est observée comme donnée source, sans devenir preuve de nommage humain.',ambiguityNotes:e.mainConfusions||[]}));
  } return out;
}
function editorialCandidate(r,rec){return candidate(r,{label:rec.conceptLabel||rec.exactWord,description:rec.conceptDescription||`Sens éditorial revu pour ${rec.exactWord}.`,pos:(rec.senseId||'').startsWith('noun.')?'NOM':(r.pos||null),provenance:`editorial_rescue:${rec.source}`,provenanceStatus:'editorial_added',confidence:0.9,concreteCategory:rec.conceptCategory||null,visualConceptCandidate:true,evidence:[`editorialReview:${rec.editorialReview||'concept_reviewed'}`,`class:${rec.provisionalClass}`],rationale:rec.falseNegativeCause||'Sens visuel ajouté après revue éditoriale explicite.',ambiguityNotes:rec.anticipatedAlternativeNames||[]});}

const byAll=new Map([...s1,...s2].map(r=>[key(r),r]));
function findWord(word,preferred){const pools=preferred==='s1'?[s1,s2]:[s2,s1]; for(const p of pools){const x=p.find(r=>r.exactWord===word); if(x)return x;} return null;}

const corpus=[]; const seen=new Set();
function add(r,group,gold=null,goldSource=null){if(!r||seen.has(key(r))||corpus.length>=TARGET)return; seen.add(key(r)); corpus.push({...r,calibrationGroup:group,goldSerious:gold,goldSource});}
for(const r of s2AB){add(r,'sample2_automatic_ab',!falsePositiveMap.has(r.exactWord),'#292 complete editorial audit');}
for(const rec of recovered){const r=byAll.get(`${rec.ipa}|${rec.exactWord}`)||findWord(rec.exactWord,rec.source==='#291'?'s1':'s2'); add(r,'rescue_recovered',true,`${rec.source} rescue editorial review`);}
for(const n of nearMisses){add(findWord(n.exactWord,n.source==='#291'?'s1':'s2'),'rescue_near_miss',false,`${n.source} rescue near-miss review`);}
const pilotRows=Array.isArray(pilot)?pilot:(pilot.rows||pilot.cases||[]); for(const r of pilotRows.sort((a,b)=>hash(key(a)).localeCompare(hash(key(b))))) add(r,'pilot90_proxy',null,'#290 calibration proxy');
const s1AB=s1.filter(r=>['A','B'].includes(r.provisionalClass)&&!seen.has(key(r))).sort((a,b)=>(b.legacyEvidence?.length||0)-(a.legacyEvidence?.length||0)||hash(key(a)).localeCompare(hash(key(b)))); for(const r of s1AB.slice(0,110)) add(r,'sample1_solid_proxy',null,'#291 automatic proxy');
const risk=s2.filter(r=>['pos_sense_risk','multi_concept_ipa','negative_control'].includes(r.selectionStratum)&&!seen.has(key(r))).sort((a,b)=>hash(key(a)).localeCompare(hash(key(b)))); for(const r of risk) add(r,'semantic_risk_stress',null,'#292 stress sample');
const controls=s1.filter(r=>['C','D'].includes(r.provisionalClass)&&!seen.has(key(r))).sort((a,b)=>hash(key(a)).localeCompare(hash(key(b)))); for(const r of controls) add(r,'sample1_negative_proxy',null,'#291 C/D proxy');
if(corpus.length<TARGET) for(const r of [...s2,...s1].sort((a,b)=>hash(key(a)).localeCompare(hash(key(b))))) add(r,'deterministic_fill',null,'deterministic fill');
if(corpus.length!==TARGET) throw new Error(`Expected ${TARGET}, got ${corpus.length}`);

const recMap=new Map(recovered.map(r=>[`${r.ipa}|${r.exactWord}`,r]));
const enriched=corpus.map(r=>{
  const senseCandidates=[inferredCandidate(r),...observedCandidates(r)]; const rec=recMap.get(key(r)); if(rec)senseCandidates.push(editorialCandidate(r,rec));
  const automaticSerious=senseCandidates.some(s=>s.provenanceStatus==='inferred_candidate'&&s.visualConceptCandidate&&s.confidence>=0.8);
  const evidenceBackedSerious=senseCandidates.some(s=>['observed','editorial_added'].includes(s.provenanceStatus)&&s.visualConceptCandidate&&s.confidence>=0.8);
  const afterSerious=automaticSerious||evidenceBackedSerious;
  const green=evidenceBackedSerious;
  return {calibrationId:`SC-${String(corpus.indexOf(r)+1).padStart(4,'0')}`,ipa:r.ipa,exactWord:r.exactWord,lexicalEntries:lexicalEntriesOf(r),baseline:{provisionalClass:r.provisionalClass||r.baselineClass||null,aggregateScore:r.aggregateScore??r.baselineAggregate??null,serious:['A','B'].includes(r.provisionalClass||r.baselineClass)},calibrationGroup:r.calibrationGroup,goldSerious:r.goldSerious,goldSource:r.goldSource,senseCandidates,automaticSenseGateSerious:automaticSerious,evidenceBackedSerious,afterSenseResolutionSerious:afterSerious,greenRouteEligible:green,humanNamingEvidence:'none'};
});

const labeled=enriched.filter(r=>typeof r.goldSerious==='boolean');
function metrics(pred){let tp=0,fp=0,tn=0,fn=0;for(const r of labeled){const p=pred(r),g=r.goldSerious;if(p&&g)tp++;else if(p&&!g)fp++;else if(!p&&g)fn++;else tn++;}return {n:labeled.length,tp,fp,tn,fn,precision:tp+fp?+(100*tp/(tp+fp)).toFixed(1):100,recall:tp+fn?+(100*tp/(tp+fn)).toFixed(1):100,falsePositiveRate:fp+tn?+(100*fp/(fp+tn)).toFixed(1):0,falseNegativeRate:fn+tp?+(100*fn/(fn+tp)).toFixed(1):0};}
const counts={observed:0,editorial_added:0,inferred_candidate:0};for(const r of enriched)for(const s of r.senseCandidates)counts[s.provenanceStatus]++;
const unresolved=enriched.filter(r=>!r.afterSenseResolutionSerious).length;
const green=enriched.filter(r=>r.greenRouteEligible).length;
const result={schemaVersion:'1.0',status:'analysis_only',baseSha:BASE_SHA,corpusSize:enriched.length,labeledEvaluationSize:labeled.length,formula290:'unchanged',humanNamingEvidence:'none',senseCandidateSchema:['senseId','label','description','pos','provenance','provenanceStatus','confidence','concreteCategory','visualConceptCandidate','evidence','rationale','ambiguityNotes'],provenanceStatusDefinitions:{observed:'information réellement présente dans une source structurée',editorial_added:'sens ajouté après revue éditoriale explicite',inferred_candidate:'proposition automatique; jamais assimilée à une vérité observée'},counts,unresolvedCases:unresolved,greenRouteEligible:green,before:metrics(r=>r.baseline.serious),automaticSenseGate:metrics(r=>r.automaticSenseGateSerious),afterSenseResolution:metrics(r=>r.afterSenseResolutionSerious),greenRouteOnLabeled:metrics(r=>r.greenRouteEligible),examples:{knownFalsePositives:s2Audit.falsePositives.map(x=>x.exactWord),rescuedConcepts:recovered.map(x=>x.exactWord)},notes:['Primary precision/recall are computed only on independently labeled cases from complete #292 A/B audit plus #291/#292 rescue reviews and near-miss reviews.','Pilot #290 and other sample rows are stress/calibration proxies and are excluded from primary gold metrics.','No inferred_candidate is converted to observed; green route requires evidence-backed observed/editorial_added sense evidence.']};
fs.writeFileSync('data/sense-candidates-calibration-400.jsonl',enriched.map(x=>JSON.stringify(x)).join('\n')+'\n');
fs.writeFileSync('data/sense-candidates-calibration-400-metrics.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
