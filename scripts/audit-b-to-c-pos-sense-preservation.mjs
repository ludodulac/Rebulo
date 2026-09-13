import fs from 'node:fs';

const norm=(s='')=>String(s).trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'");
const posFamily=(s='')=>String(s||'').trim().toUpperCase().split(':')[0];
const pronunciation=JSON.parse(fs.readFileSync('data/rebus-pronunciation-lexicon.json','utf8'));
const sample=fs.readFileSync('data/b-to-c-industrial-sample-2000.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse);

const groups=new Map();
for(const row of pronunciation.rows||[]){
  const [form,ipa,lemma,frequency,pos]=row;
  const key=`${norm(form)}|${ipa}`;
  const arr=groups.get(key)||[];
  arr.push({form,ipa,lemma,pos:posFamily(pos),rawPos:pos,frequency:Number(frequency)||0});
  groups.set(key,arr);
}

const explicitReviewedSenses={
  'bas|basse':[{senseId:'noun.instrument_basse',conceptLabel:'basse',conceptCategory:'instrument',conceptDescription:'Instrument de musique grave de la famille des basses.',reviewStatus:'editorial_reviewed'}],
  'ɑ̃sɛ̃t|enceinte':[{senseId:'noun.speaker',conceptLabel:'enceinte',conceptCategory:'objet',conceptDescription:'Enceinte acoustique / haut-parleur.',reviewStatus:'editorial_reviewed'}],
  'pɔʁtabl|portable':[{senseId:'noun.phone',conceptLabel:'portable',conceptCategory:'objet',conceptDescription:'Téléphone portable.',reviewStatus:'editorial_reviewed'}],
  'ʁatyʁ|rature':[{senseId:'noun.crossed_out_mark',conceptLabel:'rature',conceptCategory:'objet_visuel',conceptDescription:'Trace ou mot barré constituant une rature.',reviewStatus:'editorial_reviewed'}]
};

const rows=[];
for(const s of sample){
  const key=`${norm(s.exactWord)}|${s.ipa}`;
  const entries=groups.get(key)||[];
  const uniqueLex=[...new Map(entries.map(e=>[`${norm(e.lemma)}|${e.pos}`,e])).values()];
  const posSet=[...new Set(uniqueLex.map(e=>e.pos))];
  const lemmaSet=[...new Set(uniqueLex.map(e=>norm(e.lemma)))];
  const samePosLemmaVariants=new Map();
  for(const e of uniqueLex){const a=samePosLemmaVariants.get(e.pos)||new Set();a.add(norm(e.lemma));samePosLemmaVariants.set(e.pos,a);}
  const samePosMultipleLemma=[...samePosLemmaVariants.values()].some(set=>set.size>1);
  const technicalDuplicateCount=Math.max(0,entries.length-uniqueLex.length);
  const reviewed=explicitReviewedSenses[`${s.ipa}|${norm(s.exactWord)}`]||[];
  rows.push({sampleId:s.sampleId,ipa:s.ipa,exactWord:s.exactWord,currentLemma:s.lemma,currentPos:s.pos,currentClass:s.provisionalClass,lexiqueRowCount:entries.length,uniqueLexicalEntryCount:uniqueLex.length,distinctPos:posSet,distinctLemmas:lemmaSet,hasMultiplePos:posSet.length>1,hasSamePosMultipleLemma:samePosMultipleLemma,technicalDuplicateCount,inflectionLikely:s.inflectionLikely,orthographicVariantLikely:s.orthographicVariantLikely,lexicalEntries:uniqueLex,reviewedSenseCandidates:reviewed});
}

const potentiallyTouched=rows.filter(r=>r.uniqueLexicalEntryCount>1);
const multiplePos=rows.filter(r=>r.hasMultiplePos);
const samePosPolyLemma=rows.filter(r=>r.hasSamePosMultipleLemma);
const technicalDup=rows.filter(r=>r.technicalDuplicateCount>0);
const reviewedAdditional=rows.filter(r=>r.reviewedSenseCandidates.length>0);
const byClass={A:0,B:0,C:0,D:0};for(const r of potentiallyTouched)byClass[r.currentClass]++;
const examples=potentiallyTouched.slice(0,100);
const targets=rows.filter(r=>['basse','enceinte','rature','portable'].includes(norm(r.exactWord)));
const result={schemaVersion:'1.0',status:'analysis_only',sampleSize:sample.length,cause:'Builder used Map.set(normalizedForm|ipa, singleEntry), so later Lexique rows overwrite earlier rows for the same graphie+IPA.',potentiallyTouchedCount:potentiallyTouched.length,multiplePosCount:multiplePos.length,samePosMultipleLemmaCount:samePosPolyLemma.length,technicalDuplicateRelationCount:technicalDup.length,technicalDuplicateLexiqueRows:technicalDup.reduce((n,r)=>n+r.technicalDuplicateCount,0),touchedByCurrentClass:byClass,reviewedSenseCandidateRelationCount:reviewedAdditional.length,reviewedAdditionalConceptCount:reviewedAdditional.reduce((n,r)=>n+r.reviewedSenseCandidates.length,0),targets,examples};
fs.writeFileSync('data/b-to-c-industrial-sample-2000-pos-sense-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({sampleSize:result.sampleSize,potentiallyTouchedCount:result.potentiallyTouchedCount,multiplePosCount:result.multiplePosCount,samePosMultipleLemmaCount:result.samePosMultipleLemmaCount,technicalDuplicateRelationCount:result.technicalDuplicateRelationCount,reviewedAdditionalConceptCount:result.reviewedAdditionalConceptCount,targets:targets.map(t=>({word:t.exactWord,entries:t.lexicalEntries.map(e=>`${e.pos}:${e.lemma}`),class:t.currentClass}))},null,2));
