import fs from 'node:fs';
import crypto from 'node:crypto';
import {assessObservedSenseVisuality,FILTER_VERSION} from './lib/structured-sense-visual-filter.mjs';

const BASE_SHA='a604f9f7fe74c2868babfac4d098abc8fd026eb8';
const SOURCE={sourceId:'frwiktionary-kaikki-2026-09-08',sourceName:'French Wiktionary via Wiktextract/Kaikki',sourceVersion:'frwiktionary dump 2026-09-01; Kaikki extraction 2026-09-08; wiktextract ccec6f1 + 4deed51',license:'Same licenses as Wiktionary: CC-BY-SA and GFDL',sourceRoot:'https://kaikki.org/frwiktionary/Fran%C3%A7ais/meaning/'};
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const readJsonl=p=>fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const gold=readJson('data/independent-sense-gold-150.json');
if(gold.status!=='gold_frozen_before_source_ingestion'||gold.sourceLookedAt!==false)throw new Error('Gold must be frozen before source ingestion');
const s1=readJsonl('data/b-to-c-industrial-sample-2000.jsonl');
const s2=readJsonl('data/b-to-c-industrial-sample-2-2000.jsonl');
const sampleById=new Map([...s1,...s2].filter(r=>r.sampleId).map(r=>[r.sampleId,r]));
const recall=readJson('data/sense-coverage-recall-metrics.json');
const historical=recall.unresolved.map((x,i)=>({historicalId:`HFN-${String(i+1).padStart(2,'0')}`,exactWord:x.word,ipa:x.ipa}));
const units=[...gold.rows.map(r=>({...r,unitKind:'independent_gold'})),...historical.map(r=>({...r,unitKind:'historical_fn'}))];
const key=r=>`${r.ipa}|${r.exactWord}`;
const hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
function graphChars(word){return [...String(word).toLocaleLowerCase('fr')];}
function sourceUrl(word){const c=graphChars(word);const one=encodeURIComponent(c[0]||'_');const two=encodeURIComponent(c.slice(0,2).join('')||'_');return `${SOURCE.sourceRoot}${one}/${two}/${encodeURIComponent(word)}.jsonl`;}
function sourceSenseId(entry,sense,index){return sense.id||`kaikki.${hash(`${entry.word}|${entry.pos}|${index}|${(sense.glosses||[]).join('|')}`)}`;}
async function fetchWord(word){
 const url=sourceUrl(word); let rr;
 try{rr=await fetch(url);}catch(e){return {word,url,status:'fetch_error',httpStatus:null,error:String(e),entries:[]};}
 if(rr.status===404)return {word,url,status:'not_found',httpStatus:404,entries:[]};
 if(!rr.ok)return {word,url,status:'http_error',httpStatus:rr.status,entries:[]};
 const text=await rr.text(); let rows=[];
 try{rows=text.trim().split('\n').filter(Boolean).map(JSON.parse);}catch(e){return {word,url,status:'parse_error',httpStatus:rr.status,error:String(e),entries:[]};}
 const entries=rows.filter(e=>e.word===word&&e.lang_code==='fr');
 return {word,url,status:entries.length?'matched':'exact_graphy_absent',httpStatus:rr.status,entries};
}
async function mapLimit(items,limit,fn){const out=new Array(items.length);let next=0;async function worker(){while(true){const i=next++;if(i>=items.length)return;out[i]=await fn(items[i],i);}}await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));return out;}
const words=[...new Set(units.map(r=>r.exactWord))];
const fetched=await mapLimit(words,12,fetchWord);
const fetchedByWord=new Map(fetched.map(x=>[x.word,x]));
function observedCandidates(unit){
 const f=fetchedByWord.get(unit.exactWord);const out=[];
 for(const entry of f?.entries||[]){
  for(const [i,s] of (entry.senses||[]).entries()){
   const glosses=(s.glosses||[]).filter(Boolean);if(!glosses.length)continue;
   const candidate={senseId:`sense.${hash(`${key(unit)}|${sourceSenseId(entry,s,i)}`)}`,label:unit.exactWord,description:'Sens lexical observé dans la source structurée; aucune conclusion visuelle implicite.',pos:entry.pos||null,provenance:`structured_source:${SOURCE.sourceId}`,provenanceStatus:'observed',confidence:0.98,concreteCategory:null,visualConceptCandidate:false,evidence:[`exact_graphy:${unit.exactWord}`,`phonetic_link_from_B:${unit.ipa}`,`source_url:${f.url}`],rationale:'La source atteste ce sens lexical. Elle ne prouve ni dessinabilité ni nommabilité visuelle.',ambiguityNotes:[],sourceId:SOURCE.sourceId,sourceName:SOURCE.sourceName,sourceSenseId:sourceSenseId(entry,s,i),sourceDefinition:glosses[0],sourceGlosses:glosses,sourcePOS:entry.pos||null,sourceTags:s.tags||[],sourceTopics:s.topics||[],sourceCategories:s.categories||[],sourceVersion:SOURCE.sourceVersion,sourceUrl:f.url,phoneticIdentity:{ipa:unit.ipa,ipaProvenance:'B exact relation; semantic source has no authoritative IPA link used here'}};
   candidate.visualAssessment=assessObservedSenseVisuality(candidate);
   out.push(candidate);
  }
 }
 return out;
}
function legacyGreen(unit){
 const src=sampleById.get(unit.sourceSampleId);if(!src||!['A','B'].includes(src.provisionalClass))return false;
 return (src.legacyEvidence||[]).some(e=>e?.source&&!String(e.decision||'').includes('reject')&&['low','medium','unknown'].includes(e.namingRisk||'unknown'));
}
function classAB(unit){const c=unit.baseline?.provisionalClass??sampleById.get(unit.sourceSampleId)?.provisionalClass;return ['A','B'].includes(c);}
const evaluated=units.map(unit=>{
 const source=fetchedByWord.get(unit.exactWord);const senseCandidates=observedCandidates(unit);const inferredVisual=senseCandidates.filter(s=>s.visualAssessment?.visualConceptCandidate&&s.visualAssessment.confidence>=0.84);
 const baselineGreen=legacyGreen(unit);
 const sourceOnlyGreen=baselineGreen; // observed lexical sense alone never proves a visual concept
 const filteredGreen=baselineGreen||(classAB(unit)&&inferredVisual.length>0);
 return {...unit,sourceMatchStatus:source?.status||'missing',sourceUrl:source?.url||sourceUrl(unit.exactWord),senseCandidates,states:{A_baselineGreen:baselineGreen,B_observedIngestedGreen:sourceOnlyGreen,C_deterministicFilteredGreen:filteredGreen},sourceAmbiguityCreated:senseCandidates.length>1,sourceVisualInferences:inferredVisual.map(s=>({sourceSenseId:s.sourceSenseId,ruleId:s.visualAssessment.ruleId,confidence:s.visualAssessment.confidence}))};
});
const goldRows=evaluated.filter(r=>r.unitKind==='independent_gold');
const histRows=evaluated.filter(r=>r.unitKind==='historical_fn');
function metric(field){let tp=0,fp=0,tn=0,fn=0;for(const r of goldRows){const p=Boolean(r.states[field]),g=Boolean(r.goldReview.seriousVisualConcept);if(p&&g)tp++;else if(p&&!g)fp++;else if(!p&&g)fn++;else tn++;}const precision=tp+fp?tp/(tp+fp):1,recall=tp+fn?tp/(tp+fn):1,f1=precision+recall?2*precision*recall/(precision+recall):0;return {n:goldRows.length,tp,fp,tn,fn,precision:+(precision*100).toFixed(1),recall:+(recall*100).toFixed(1),f1:+(f1*100).toFixed(1)};}
const observedRelations=goldRows.filter(r=>r.senseCandidates.length>0).length;
const observedSenses=goldRows.reduce((a,r)=>a+r.senseCandidates.length,0);
const serious=goldRows.filter(r=>r.goldReview.seriousVisualConcept);
const seriousObservedCompatible=serious.filter(r=>r.senseCandidates.some(s=>s.visualAssessment?.visualConceptCandidate)).length;
const negatives=goldRows.filter(r=>!r.goldReview.seriousVisualConcept);
const negativesObserved=negatives.filter(r=>r.senseCandidates.length>0);
const falsePositivesBlockedDespiteObserved=negativesObserved.filter(r=>!r.states.C_deterministicFilteredGreen).length;
const unmatched=goldRows.filter(r=>r.senseCandidates.length===0).length;
const sourceAmbiguities=goldRows.filter(r=>r.sourceAmbiguityCreated).length;
const allObservedSenses=evaluated.reduce((a,r)=>a+r.senseCandidates.length,0);
const historyReport=histRows.map(r=>({word:r.exactWord,ipa:r.ipa,sourceMatchStatus:r.sourceMatchStatus,observedSenseCount:r.senseCandidates.length,observedSenses:r.senseCandidates.slice(0,8).map(s=>({sourceSenseId:s.sourceSenseId,definition:s.sourceDefinition,pos:s.sourcePOS,tags:s.sourceTags,topics:s.sourceTopics,visualAssessment:s.visualAssessment})),filteredGreen:r.states.C_deterministicFilteredGreen,outcome:r.states.C_deterministicFilteredGreen?'source_observed_plus_general_filter_green':'remains_orange'}));
const metrics={schemaVersion:'1.0',status:'analysis_only',baseSha:BASE_SHA,formula290:'unchanged',humanNamingEvidence:'none',source:SOURCE,filterVersion:FILTER_VERSION,scope:{independentGold:goldRows.length,historicalFN:histRows.length,distinctWordsFetched:words.length,totalObservedSensesIngested:allObservedSenses},goldComposition:{positive:serious.length,negative:negatives.length},states:{A_baseline:metric('A_baselineGreen'),B_observed_ingested_no_visual_inference:metric('B_observedIngestedGreen'),C_observed_plus_deterministic_filter:metric('C_deterministicFilteredGreen')},coverage:{relationsWithAtLeastOneObservedSense:observedRelations,relationsWithAtLeastOneObservedSensePercent:+(100*observedRelations/goldRows.length).toFixed(1),averageObservedSensesPerRelation:+(observedSenses/goldRows.length).toFixed(2),seriousConceptsWithCompatibleObservedSenseProxy:seriousObservedCompatible,seriousConceptsWithCompatibleObservedSenseProxyPercent:+(100*seriousObservedCompatible/serious.length).toFixed(1),falsePositivesBlockedDespiteObservedSense:falsePositivesBlockedDespiteObserved,falsePositivesWithObservedSense:negativesObserved.length,sourceCreatedAmbiguityCases:sourceAmbiguities,unmatchedCleanly:unmatched},routes:{baselineGreen:goldRows.filter(r=>r.states.A_baselineGreen).length,filteredGreen:goldRows.filter(r=>r.states.C_deterministicFilteredGreen).length,newGreenFromObserved:goldRows.filter(r=>!r.states.A_baselineGreen&&r.states.C_deterministicFilteredGreen).length},notes:['State B intentionally has the same visual decision as A: lexical observed evidence alone never proves visual suitability.','State C uses only general POS/tag/topic/gloss rules; no gold word, old false-positive blacklist or historical-FN whitelist is part of the filter.','The compatible-observed metric is a deterministic proxy: an observed sense is counted compatible when the general visual filter finds semantic evidence consistent with a visual concept; it is not a post-source human relabel.']};
fs.writeFileSync('data/structured-sense-kaikki-bounded.jsonl',evaluated.map(r=>JSON.stringify(r)).join('\n')+'\n');
fs.writeFileSync('data/structured-sense-source-metrics.json',JSON.stringify(metrics,null,2)+'\n');
fs.writeFileSync('data/structured-sense-historical-fn-15.json',JSON.stringify({schemaVersion:'1.0',source:SOURCE,rows:historyReport},null,2)+'\n');
console.log(JSON.stringify(metrics,null,2));