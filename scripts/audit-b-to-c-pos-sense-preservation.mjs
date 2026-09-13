import fs from 'node:fs';

const fold=(s='')=>String(s).trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'");
const exactNorm=(s='')=>String(s).trim().toLocaleLowerCase('fr').normalize('NFC').replace(/[’]/g,"'");
const posFamily=(s='')=>String(s||'').trim().toUpperCase().split(':')[0];
const pronunciation=JSON.parse(fs.readFileSync('data/rebus-pronunciation-lexicon.json','utf8'));
const sample=fs.readFileSync('data/b-to-c-industrial-sample-2000.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse);

function add(map,key,value){const arr=map.get(key)||[];arr.push(value);map.set(key,arr);}
const foldedGroups=new Map();
const exactGroups=new Map();
for(const row of pronunciation.rows||[]){
  const [form,ipa,lemma,frequency,pos]=row;
  const e={form,ipa,lemma,pos:posFamily(pos),rawPos:pos,frequency:Number(frequency)||0};
  add(foldedGroups,`${fold(form)}|${ipa}`,e);
  add(exactGroups,`${exactNorm(form)}|${ipa}`,e);
}
function summarize(entries){
  const unique=[...new Map(entries.map(e=>[`${exactNorm(e.lemma)}|${e.pos}`,e])).values()];
  const pos=[...new Set(unique.map(e=>e.pos))];
  const lemmas=[...new Set(unique.map(e=>exactNorm(e.lemma)))];
  const perPos=new Map();for(const e of unique){const s=perPos.get(e.pos)||new Set();s.add(exactNorm(e.lemma));perPos.set(e.pos,s);}
  return {entries,unique,pos,lemmas,hasMultiplePos:pos.length>1,hasSamePosMultipleLemma:[...perPos.values()].some(s=>s.size>1),technicalDuplicateCount:Math.max(0,entries.length-unique.length)};
}

const explicitReviewedSenses={
  'bas|basse':[{senseId:'objet.instrument_basse',conceptLabel:'basse',conceptCategory:'instrument',conceptDescription:'Une guitare basse isolée, avec quatre cordes visibles et silhouette d’instrument électrique.',relationToBaseline:'additional_visual_sense',reviewStatus:'concept_reviewed'}],
  'ɑ̃sɛ̃t|enceinte':[{senseId:'objet.haut_parleur',conceptLabel:'enceinte',conceptCategory:'objet',conceptDescription:'Une enceinte audio autonome, grille de haut-parleur nettement visible.',relationToBaseline:'additional_visual_sense',reviewStatus:'concept_reviewed'}],
  'pɔʁtabl|portable':[{senseId:'objet.telephone_portable',conceptLabel:'portable',conceptCategory:'objet',conceptDescription:'Un téléphone portable seul, cadré comme appareil.',relationToBaseline:'additional_visual_sense',reviewStatus:'concept_reviewed'}],
  'ʁatyʁ|rature':[{senseId:'objet.marque_barree',conceptLabel:'rature',conceptCategory:'objet_visuel',conceptDescription:'Une trace ou inscription barrée constituant une rature.',relationToBaseline:'same_visual_sense_reviewed',reviewStatus:'concept_reviewed'}]
};

const rows=[];
for(const s of sample){
  const folded=summarize(foldedGroups.get(`${fold(s.exactWord)}|${s.ipa}`)||[]);
  const exact=summarize(exactGroups.get(`${exactNorm(s.exactWord)}|${s.ipa}`)||[]);
  const reviewed=explicitReviewedSenses[`${s.ipa}|${fold(s.exactWord)}`]||[];
  rows.push({sampleId:s.sampleId,ipa:s.ipa,exactWord:s.exactWord,currentLemma:s.lemma,currentPos:s.pos,currentClass:s.provisionalClass,
    oldFolded:{lexiqueRowCount:folded.entries.length,uniqueLexicalEntryCount:folded.unique.length,distinctPos:folded.pos,distinctLemmas:folded.lemmas,hasMultiplePos:folded.hasMultiplePos,hasSamePosMultipleLemma:folded.hasSamePosMultipleLemma,technicalDuplicateCount:folded.technicalDuplicateCount,lexicalEntries:folded.unique},
    exactOrthography:{lexiqueRowCount:exact.entries.length,uniqueLexicalEntryCount:exact.unique.length,distinctPos:exact.pos,distinctLemmas:exact.lemmas,hasMultiplePos:exact.hasMultiplePos,hasSamePosMultipleLemma:exact.hasSamePosMultipleLemma,technicalDuplicateCount:exact.technicalDuplicateCount,lexicalEntries:exact.unique},
    accentFoldCollision:folded.unique.length>exact.unique.length,
    inflectionLikely:s.inflectionLikely,orthographicVariantLikely:s.orthographicVariantLikely,reviewedSenseCandidates:reviewed});
}

const oldTouched=rows.filter(r=>r.oldFolded.uniqueLexicalEntryCount>1);
const exactTouched=rows.filter(r=>r.exactOrthography.uniqueLexicalEntryCount>1);
const exactMultiplePos=rows.filter(r=>r.exactOrthography.hasMultiplePos);
const exactSamePosMultiLemma=rows.filter(r=>r.exactOrthography.hasSamePosMultipleLemma);
const accentFoldCollisions=rows.filter(r=>r.accentFoldCollision);
const technicalDup=rows.filter(r=>r.exactOrthography.technicalDuplicateCount>0);
const byClass={A:0,B:0,C:0,D:0};for(const r of exactTouched)byClass[r.currentClass]++;
const additionalVisualSenses=rows.flatMap(r=>r.reviewedSenseCandidates.filter(x=>x.relationToBaseline==='additional_visual_sense').map(x=>({sampleId:r.sampleId,ipa:r.ipa,exactWord:r.exactWord,...x})));
const sameSenseCorrections=rows.flatMap(r=>r.reviewedSenseCandidates.filter(x=>x.relationToBaseline==='same_visual_sense_reviewed').map(x=>({sampleId:r.sampleId,ipa:r.ipa,exactWord:r.exactWord,...x})));
const targets=rows.filter(r=>['basse','enceinte','rature','portable'].includes(fold(r.exactWord)));
const result={schemaVersion:'1.1',status:'analysis_only',sampleSize:sample.length,
  cause:{overwrite:'Builder used Map.set(key, singleEntry), so later Lexique rows replace earlier rows.',identityCollision:'The key used accent-folded norm(form), merging distinct exact spellings such as mur/mûr before lookup.',sourceGap:'Some ordinary noun senses (basse instrument, enceinte speaker, portable phone) are absent from the current pronunciation mirror for those exact graphies, so preserving Lexique rows alone cannot recover them.'},
  oldFoldedPotentiallyTouchedCount:oldTouched.length,exactOrthographyPotentiallyTouchedCount:exactTouched.length,exactMultiplePosCount:exactMultiplePos.length,exactSamePosMultipleLemmaCount:exactSamePosMultiLemma.length,accentFoldCollisionCount:accentFoldCollisions.length,technicalDuplicateRelationCount:technicalDup.length,technicalDuplicateLexiqueRows:technicalDup.reduce((n,r)=>n+r.exactOrthography.technicalDuplicateCount,0),touchedByCurrentClass:byClass,
  additionalVisualSenseCount:additionalVisualSenses.length,sameSenseEditorialCorrectionCount:sameSenseCorrections.length,additionalVisualSenses,sameSenseCorrections,targets,examples:exactTouched.slice(0,100),accentFoldCollisionExamples:accentFoldCollisions.slice(0,50)};
fs.writeFileSync('data/b-to-c-industrial-sample-2000-pos-sense-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({sampleSize:result.sampleSize,oldFoldedPotentiallyTouchedCount:result.oldFoldedPotentiallyTouchedCount,exactOrthographyPotentiallyTouchedCount:result.exactOrthographyPotentiallyTouchedCount,exactMultiplePosCount:result.exactMultiplePosCount,exactSamePosMultipleLemmaCount:result.exactSamePosMultipleLemmaCount,accentFoldCollisionCount:result.accentFoldCollisionCount,technicalDuplicateRelationCount:result.technicalDuplicateRelationCount,additionalVisualSenseCount:result.additionalVisualSenseCount,sameSenseEditorialCorrectionCount:result.sameSenseEditorialCorrectionCount,targets:targets.map(t=>({word:t.exactWord,exactEntries:t.exactOrthography.lexicalEntries.map(e=>`${e.pos}:${e.lemma}`),class:t.currentClass}))},null,2));
