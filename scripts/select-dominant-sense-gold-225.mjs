import fs from 'node:fs';
import crypto from 'node:crypto';

const BASE_SHA='b45854e82f85d8028075d7809d99c30212225ea9';
const SEED='rebulo-dominant-sense-gold-v1';
const readJsonl=p=>fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const key=r=>`${r.ipa}|${r.exactWord}`;
const hash=s=>crypto.createHash('sha256').update(`${SEED}|${s}`).digest('hex');

const samples=[...readJsonl('data/b-to-c-industrial-sample-2000.jsonl'),...readJsonl('data/b-to-c-industrial-sample-2-2000.jsonl')];
const calibration400=readJsonl('data/sense-candidates-calibration-400.jsonl');
const recall650=readJsonl('data/sense-coverage-recall-650.jsonl');
const dev295=readJson('data/independent-sense-gold-150.json').rows;
const holdout295=readJson('data/structured-sense-holdout-75.json').rows;
const historical15=readJson('data/structured-sense-historical-fn-15.json');
const historicalRows=Array.isArray(historical15)?historical15:(historical15.rows||historical15.historicalFN15||[]);
const used=new Set([...calibration400,...recall650,...dev295,...holdout295,...historicalRows].filter(r=>r?.ipa&&r?.exactWord).map(key));
const historicalWords=new Set(['club','oeuvre','star','drogue','mu','course','perte','chasse','pub','rêve','lettre','chose','droite','vote','geste']);
const pool=samples.filter(r=>!used.has(key(r))&&!historicalWords.has(String(r.exactWord).toLowerCase()));

const groups=[
 ['obvious_concrete',35,22,13,r=>['animal','aliment','corps','nature','objet','outil','vêtement','véhicule'].includes(r.conceptCategory)&&['A','B'].includes(r.provisionalClass)],
 ['abstract_relation',30,18,12,r=>['abstrait','fonction_ou_qualité'].includes(r.conceptCategory)],
 ['roles_people',25,15,10,r=>['personne','personne_rôle_candidat'].includes(r.conceptCategory)],
 ['places',20,12,8,r=>r.conceptCategory==='lieu'],
 ['events_actions',30,18,12,r=>r.conceptCategory==='action'],
 ['polysemy_homographs',35,20,15,r=>(r.exactHomophoneCount||0)>=2||['pos_sense_risk','multi_concept_ipa','ambiguous_control'].includes(r.selectionStratum)],
 ['low_frequency',20,12,8,r=>(Number(r.frequency)||0)<2],
 ['deceptive_concrete',30,18,12,r=>r.conceptCategory==='nom_concret_à_vérifier'||(['C','D'].includes(r.provisionalClass)&&['animal','aliment','corps','nature','objet','outil','vêtement','véhicule','lieu','personne'].includes(r.conceptCategory))]
];

const picked=[]; const seen=new Set();
for(const [stratum,total] of groups){
 const pred=groups.find(g=>g[0]===stratum)[4];
 const rows=pool.filter(pred).sort((a,b)=>hash(`${stratum}|${key(a)}`).localeCompare(hash(`${stratum}|${key(b)}`)));
 let n=0; for(const r of rows){if(seen.has(key(r)))continue;seen.add(key(r));picked.push({r,stratum});if(++n>=total)break;}
}
if(picked.length<225){
 const fill=pool.filter(r=>!seen.has(key(r))).sort((a,b)=>hash(`fill|${key(a)}`).localeCompare(hash(`fill|${key(b)}`)));
 for(const r of fill){if(picked.length>=225)break;seen.add(key(r));picked.push({r,stratum:'deterministic_fill'});}
}
if(picked.length!==225)throw new Error(`Expected 225, got ${picked.length}`);

const byStratum=new Map(); for(const p of picked){if(!byStratum.has(p.stratum))byStratum.set(p.stratum,[]);byStratum.get(p.stratum).push(p);}
const dev=[]; const holdout=[];
for(const [stratum,total,devQuota,holdQuota] of groups){
 const rows=(byStratum.get(stratum)||[]).sort((a,b)=>hash(`split|${key(a.r)}`).localeCompare(hash(`split|${key(b.r)}`)));
 dev.push(...rows.slice(0,Math.min(devQuota,rows.length)));
 holdout.push(...rows.slice(Math.min(devQuota,rows.length),Math.min(devQuota+holdQuota,rows.length)));
}
const assigned=new Set([...dev,...holdout].map(p=>key(p.r)));
const leftovers=picked.filter(p=>!assigned.has(key(p.r))).sort((a,b)=>hash(`left|${key(a.r)}`).localeCompare(hash(`left|${key(b.r)}`)));
for(const p of leftovers){(dev.length<135?dev:holdout).push(p);}
if(dev.length!==135||holdout.length!==90)throw new Error(`Bad split dev=${dev.length} holdout=${holdout.length}`);

function materialize(list,partition){return list.map((p,i)=>{const r=p.r;return {
 goldId:`DSG-${partition==='development'?'D':'H'}-${String(i+1).padStart(3,'0')}`,
 partition, ipa:r.ipa, exactWord:r.exactWord, lemma:r.lemma??null, pos:r.pos??null, frequency:r.frequency??null,
 sourceSampleId:r.sampleId??null, sourceStratum:r.selectionStratum??null, selectionStratum:p.stratum,
 baseline:{provisionalClass:r.provisionalClass,aggregateScore:r.aggregateScore},
 proxyContext:{conceptLabel:r.conceptLabel??null,conceptCategory:r.conceptCategory??null,conceptDescription:r.conceptDescription??null,anticipatedAlternativeNames:r.anticipatedAlternativeNames??[],anticipatedNamingRisk:r.anticipatedNamingRisk??null},
 goldReview:{status:'pending_pre_source',seriousVisualConcept:null,expectedVisualSenses:[],primarySemanticType:null,risk:null,rationale:null},
 humanNamingEvidence:'none'
};});}
const rows=[...materialize(dev,'development'),...materialize(holdout,'holdout')];
for(const r of rows){if(used.has(key(r)))throw new Error(`Prior corpus overlap ${key(r)}`);if(historicalWords.has(String(r.exactWord).toLowerCase()))throw new Error(`Historical diagnostic overlap ${r.exactWord}`);}
const out={schemaVersion:'1.0',status:'selected_and_partitioned_before_semantic_source_lookup',baseSha:BASE_SHA,selectionSeed:SEED,sourceLookedAt:false,developmentCount:135,holdoutCount:90,totalCount:225,excluded:{calibration400:calibration400.length,recall650:recall650.length,dev295:dev295.length,holdout295:holdout295.length,historicalDiagnostic15:15},rows};
fs.writeFileSync('data/dominant-sense-gold-225.json',JSON.stringify(out,null,2)+'\n');
const header='goldId\tpartition\texactWord\tipa\tstratum\tcategory\tbaseline\triskProxy\talternatives';
const lines=[header,...rows.map(r=>[r.goldId,r.partition,r.exactWord,r.ipa,r.selectionStratum,r.proxyContext.conceptCategory??'',r.baseline.provisionalClass,r.proxyContext.anticipatedNamingRisk??'',(r.proxyContext.anticipatedAlternativeNames||[]).join('|')].join('\t'))];
fs.writeFileSync('data/dominant-sense-gold-225-review.tsv',lines.join('\n')+'\n');
console.log(JSON.stringify({total:225,development:135,holdout:90,excluded:out.excluded},null,2));