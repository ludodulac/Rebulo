import fs from 'node:fs';
import crypto from 'node:crypto';

const BASE_SHA='a604f9f7fe74c2868babfac4d098abc8fd026eb8';
const readJsonl=p=>fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const samples=[...readJsonl('data/b-to-c-industrial-sample-2000.jsonl'),...readJsonl('data/b-to-c-industrial-sample-2-2000.jsonl')];
const calibration=readJsonl('data/sense-candidates-calibration-400.jsonl');
const used=new Set(calibration.map(r=>`${r.ipa}|${r.exactWord}`));
const historicalFN=new Set(['club','oeuvre','star','drogue','mu','course','perte','chasse','pub','rêve','lettre','chose','droite','vote','geste']);
const key=r=>`${r.ipa}|${r.exactWord}`;
const hash=s=>crypto.createHash('sha256').update(`rebulo-independent-gold-v1|${s}`).digest('hex');
const pool=samples.filter(r=>!used.has(key(r))&&!historicalFN.has(String(r.exactWord).toLowerCase()));
const seen=new Set(); const selected=[];
const groups=[
 ['obvious_concrete',25,r=>['animal','aliment','corps','nature','objet','outil','vêtement','véhicule'].includes(r.conceptCategory)&&['A','B'].includes(r.provisionalClass)],
 ['abstract',20,r=>['abstrait','fonction_ou_qualité'].includes(r.conceptCategory)],
 ['roles_people',15,r=>['personne','personne_rôle_candidat'].includes(r.conceptCategory)],
 ['places',15,r=>r.conceptCategory==='lieu'],
 ['events_actions',20,r=>r.conceptCategory==='action'],
 ['polysemy_homographs',20,r=>(r.exactHomophoneCount||0)>=2||['pos_sense_risk','multi_concept_ipa','ambiguous_control'].includes(r.selectionStratum)],
 ['low_frequency',15,r=>(Number(r.frequency)||0)<2],
 ['deceptive_concrete',20,r=>r.conceptCategory==='nom_concret_à_vérifier'||(['C','D'].includes(r.provisionalClass)&&['animal','aliment','corps','nature','objet','outil','vêtement','véhicule','lieu','personne'].includes(r.conceptCategory))]
];
for(const [stratum,quota,pred] of groups){
 const rows=pool.filter(pred).sort((a,b)=>hash(key(a)).localeCompare(hash(key(b))));
 let n=0;
 for(const r of rows){if(seen.has(key(r)))continue;seen.add(key(r));selected.push({goldId:`ISG-${String(selected.length+1).padStart(3,'0')}`,ipa:r.ipa,exactWord:r.exactWord,lemma:r.lemma??null,pos:r.pos??null,frequency:r.frequency??null,sourceSampleId:r.sampleId??null,sourceStratum:r.selectionStratum??null,selectionStratum:stratum,baseline:{provisionalClass:r.provisionalClass,aggregateScore:r.aggregateScore},proxyContext:{conceptLabel:r.conceptLabel??null,conceptCategory:r.conceptCategory??null,conceptDescription:r.conceptDescription??null,anticipatedAlternativeNames:r.anticipatedAlternativeNames??[],anticipatedNamingRisk:r.anticipatedNamingRisk??null},goldReview:{status:'pending',seriousVisualConcept:null,expectedConcept:null,risk:null,rationale:null},humanNamingEvidence:'none'});if(++n>=quota)break;}
}
if(selected.length<150){
 const fill=pool.filter(r=>!seen.has(key(r))).sort((a,b)=>hash(`fill|${key(a)}`).localeCompare(hash(`fill|${key(b)}`)));
 for(const r of fill){if(selected.length>=150)break;seen.add(key(r));selected.push({goldId:`ISG-${String(selected.length+1).padStart(3,'0')}`,ipa:r.ipa,exactWord:r.exactWord,lemma:r.lemma??null,pos:r.pos??null,frequency:r.frequency??null,sourceSampleId:r.sampleId??null,sourceStratum:r.selectionStratum??null,selectionStratum:'deterministic_fill',baseline:{provisionalClass:r.provisionalClass,aggregateScore:r.aggregateScore},proxyContext:{conceptLabel:r.conceptLabel??null,conceptCategory:r.conceptCategory??null,conceptDescription:r.conceptDescription??null,anticipatedAlternativeNames:r.anticipatedAlternativeNames??[],anticipatedNamingRisk:r.anticipatedNamingRisk??null},goldReview:{status:'pending',seriousVisualConcept:null,expectedConcept:null,risk:null,rationale:null},humanNamingEvidence:'none'});}
}
if(selected.length!==150)throw new Error(`Expected 150, got ${selected.length}`);
if(selected.some(r=>used.has(`${r.ipa}|${r.exactWord}`)))throw new Error('Calibration overlap');
if(selected.some(r=>historicalFN.has(String(r.exactWord).toLowerCase())))throw new Error('Historical FN overlap');
const counts=Object.fromEntries([...new Set(selected.map(r=>r.selectionStratum))].map(s=>[s,selected.filter(r=>r.selectionStratum===s).length]));
const out={schemaVersion:'1.0',status:'frozen_before_source_ingestion',baseSha:BASE_SHA,selectionSeed:'rebulo-independent-gold-v1',selectedCount:selected.length,excludedCalibrationCount:calibration.length,historicalFNExcluded:[...historicalFN],stratumCounts:counts,sourceLookedAt:false,rows:selected};
fs.writeFileSync('data/independent-sense-gold-150.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({selectedCount:selected.length,stratumCounts:counts},null,2));