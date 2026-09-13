import fs from 'node:fs';
import crypto from 'node:crypto';
const FILTER_FROZEN_SHA='81b2a12f89e59b186e62caa5a8a11ade9e20239d';
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const readJsonl=p=>fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const samples=[...readJsonl('data/b-to-c-industrial-sample-2000.jsonl'),...readJsonl('data/b-to-c-industrial-sample-2-2000.jsonl')];
const calibration=readJsonl('data/sense-candidates-calibration-400.jsonl');
const dev=readJson('data/independent-sense-gold-150.json');
const blocked=new Set([...calibration.map(r=>`${r.ipa}|${r.exactWord}`),...dev.rows.map(r=>`${r.ipa}|${r.exactWord}`)]);
const historical=new Set(['club','oeuvre','star','drogue','mu','course','perte','chasse','pub','rêve','lettre','chose','droite','vote','geste']);
const key=r=>`${r.ipa}|${r.exactWord}`;
const hash=s=>crypto.createHash('sha256').update(`rebulo-structured-sense-holdout-v1|${s}`).digest('hex');
const pool=samples.filter(r=>!blocked.has(key(r))&&!historical.has(String(r.exactWord).toLowerCase()));
const seen=new Set();const rows=[];
const groups=[
 ['obvious_concrete',12,r=>['animal','aliment','corps','nature','objet','outil','vêtement','véhicule'].includes(r.conceptCategory)&&['A','B'].includes(r.provisionalClass)],
 ['abstract',10,r=>['abstrait','fonction_ou_qualité'].includes(r.conceptCategory)],
 ['roles_people',8,r=>['personne','personne_rôle_candidat'].includes(r.conceptCategory)],
 ['places',5,r=>r.conceptCategory==='lieu'],
 ['events_actions',10,r=>r.conceptCategory==='action'],
 ['polysemy_homographs',10,r=>(r.exactHomophoneCount||0)>=2||['pos_sense_risk','multi_concept_ipa','ambiguous_control'].includes(r.selectionStratum)],
 ['low_frequency',8,r=>(Number(r.frequency)||0)<2],
 ['deceptive_concrete',12,r=>r.conceptCategory==='nom_concret_à_vérifier'||(['C','D'].includes(r.provisionalClass)&&['animal','aliment','corps','nature','objet','outil','vêtement','véhicule','lieu','personne'].includes(r.conceptCategory))]
];
function push(r,stratum){seen.add(key(r));rows.push({holdoutId:`ISH-${String(rows.length+1).padStart(3,'0')}`,ipa:r.ipa,exactWord:r.exactWord,lemma:r.lemma??null,pos:r.pos??null,frequency:r.frequency??null,sourceSampleId:r.sampleId??null,sourceStratum:r.selectionStratum??null,selectionStratum:stratum,baseline:{provisionalClass:r.provisionalClass,aggregateScore:r.aggregateScore},proxyContext:{conceptLabel:r.conceptLabel??null,conceptCategory:r.conceptCategory??null,conceptDescription:r.conceptDescription??null,anticipatedAlternativeNames:r.anticipatedAlternativeNames??[],anticipatedNamingRisk:r.anticipatedNamingRisk??null},goldReview:{status:'pending',seriousVisualConcept:null,expectedConcept:null,risk:null,rationale:null},humanNamingEvidence:'none'});}
for(const [stratum,quota,pred] of groups){let n=0;for(const r of pool.filter(pred).sort((a,b)=>hash(key(a)).localeCompare(hash(key(b))))){if(seen.has(key(r)))continue;push(r,stratum);if(++n>=quota)break;}}
for(const r of pool.filter(r=>!seen.has(key(r))).sort((a,b)=>hash(`fill|${key(a)}`).localeCompare(hash(`fill|${key(b)}`)))){if(rows.length>=75)break;push(r,'deterministic_fill');}
if(rows.length!==75)throw new Error(`Expected 75, got ${rows.length}`);
const out={schemaVersion:'1.0',status:'sealed_selection_before_source_lookup',filterFrozenSha:FILTER_FROZEN_SHA,filterVersion:'structured-visual-filter-v2.2',selectionSeed:'rebulo-structured-sense-holdout-v1',selectedCount:75,sourceLookedAt:false,excludedDevelopmentGold:150,excludedCalibration:400,historicalFNExcluded:[...historical],stratumCounts:Object.fromEntries([...new Set(rows.map(r=>r.selectionStratum))].map(s=>[s,rows.filter(r=>r.selectionStratum===s).length])),rows};
fs.writeFileSync('data/structured-sense-holdout-75.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({selectedCount:75,stratumCounts:out.stratumCounts},null,2));