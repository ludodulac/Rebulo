import fs from 'node:fs';
import assert from 'node:assert/strict';

const rows=fs.readFileSync('data/b-to-c-industrial-sample-2000.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const metrics=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2000-metrics.json','utf8'));
const rescueReview=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2000-rescue-editorial-review.json','utf8'));
const audit=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2000-pos-sense-audit.json','utf8'));
const impact=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2000-pos-sense-impact.json','utf8'));
const changes=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2000-pos-sense-class-changes.json','utf8'));
const preserved=fs.readFileSync('data/b-to-c-industrial-sample-2000-pos-sense-preserved.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const weights={concreteness:10,drawability:13,expectedNameability:25,alternativeNameResistance:10,visualAmbiguityResistance:10,visualSimplicity:8,lexicalFamiliarity:10,phoneticReuse:7,compactness:4,multiRepresentationValue:3};
assert.equal(rows.length,2000,'sample size');
assert.equal(metrics.selectedRelations,2000);
assert.equal(metrics.examinedRelations,2000);
const ids=new Set(),relations=new Set();
for(const r of rows){
  assert.ok(!ids.has(r.sampleId),`duplicate id ${r.sampleId}`);ids.add(r.sampleId);
  const rel=`${r.ipa}|${r.exactWord}`;assert.ok(!relations.has(rel),`duplicate relation ${rel}`);relations.add(rel);
  for(const field of ['ipa','exactWord','lemma','pos','conceptLabel','senseId','conceptCategory','conceptDescription','selectionStratum','provisionalClass'])assert.ok(field in r,`${r.sampleId} missing ${field}`);
  for(const [k] of Object.entries(weights))assert.ok(Number.isInteger(r.scores[k])&&r.scores[k]>=0&&r.scores[k]<=4,`${r.sampleId} ${k}`);
  const total=Math.round(Object.entries(weights).reduce((s,[k,w])=>s+r.scores[k]*w/4,0)*10)/10;
  assert.equal(r.aggregateScore,total,`${r.sampleId} aggregate`);
  assert.equal(r.humanNamingEvidence,'none',`${r.sampleId} human evidence`);
  assert.equal(r.editorialReview,'unreviewed',`${r.sampleId} editorial review`);
  if(r.provisionalClass==='A'){
    assert.ok(r.aggregateScore>=80,`${r.sampleId} A score`);
    assert.ok(r.scores.expectedNameability>=3,`${r.sampleId} A naming`);
    assert.ok(r.scores.drawability>=3,`${r.sampleId} A drawability`);
    assert.ok(r.scores.visualSimplicity>=3,`${r.sampleId} A simplicity`);
  }
  if(r.scores.expectedNameability===0)assert.equal(r.provisionalClass,'D',`${r.sampleId} nameability zero guard`);
  if(r.scores.expectedNameability<=1)assert.ok(['C','D'].includes(r.provisionalClass),`${r.sampleId} naming guard`);
  if(r.scores.drawability<=1)assert.ok(['C','D'].includes(r.provisionalClass),`${r.sampleId} drawability guard`);
  if(r.conceptCategory==='abstrait')assert.ok(['C','D'].includes(r.provisionalClass),`${r.sampleId} abstract guard`);
}
const dist=rows.reduce((m,r)=>(m[r.provisionalClass]++,m),{A:0,B:0,C:0,D:0});
assert.deepEqual(dist,metrics.distribution);
const rescue=rows.filter(r=>r.selectionStratum==='low_score_rescue_random');
assert.equal(rescue.length,260,'rescue sample size');
assert.equal(metrics.rescue.selected,rescue.length);
assert.ok(Object.keys(metrics.byStratum).length>=7,'stratification required');
assert.equal(rows.filter(r=>r.humanNamingEvidence==='none').length,2000);

assert.equal(rescueReview.reviewedRelations,260,'editorial rescue review size');
assert.equal(rescueReview.humanNamingEvidence,'none','rescue review human evidence');
assert.equal(rescueReview.editorialSeriousRecovered,rescueReview.recovered.length,'rescue recovery count');
assert.equal(rescueReview.editorialSeriousRecovered,4,'calibrated rescue recoveries');
for(const r of rescueReview.recovered){
  assert.ok(ids.has(r.sampleId),`unknown rescue id ${r.sampleId}`);
  assert.equal(r.humanNamingEvidence,'none',`${r.sampleId} rescue human evidence`);
  for(const [k] of Object.entries(weights))assert.ok(Number.isInteger(r.scores[k])&&r.scores[k]>=0&&r.scores[k]<=4,`${r.sampleId} rescue ${k}`);
  const total=Math.round(Object.entries(weights).reduce((s,[k,w])=>s+r.scores[k]*w/4,0)*10)/10;
  assert.equal(r.aggregateScore,total,`${r.sampleId} rescue aggregate`);
  assert.equal(r.provisionalClass,'B',`${r.sampleId} rescue class`);
}

assert.equal(audit.sampleSize,2000,'POS/sense audit sample size');
assert.equal(audit.oldFoldedPotentiallyTouchedCount,67,'accent-fold exposure count');
assert.equal(audit.exactOrthographyPotentiallyTouchedCount,0,'exact graphie duplicate lexical entries');
assert.equal(audit.accentFoldCollisionCount,67,'accent-fold collision count');
assert.equal(audit.additionalVisualSenseCount,3,'additional reviewed visual senses');
assert.equal(audit.sameSenseEditorialCorrectionCount,1,'same-sense editorial correction');
assert.equal(preserved.length,2000,'preserved view row count');
assert.deepEqual(new Set(preserved.map(r=>r.sampleId)),ids,'preserved view keeps same 2,000 IDs');
for(const r of preserved){
  assert.equal(r.humanNamingEvidence,'none',`${r.sampleId} preserved human evidence`);
  assert.ok(Array.isArray(r.lexicalEntries),`${r.sampleId} lexicalEntries`);
  assert.ok(Array.isArray(r.conceptUnits)&&r.conceptUnits.length>=1,`${r.sampleId} conceptUnits`);
  const lexicalKeys=new Set(r.lexicalEntries.map(e=>`${String(e.lemma).normalize('NFC')}|${e.pos}`));
  assert.equal(lexicalKeys.size,r.lexicalEntries.length,`${r.sampleId} technical lexical duplicates collapsed`);
}
assert.deepEqual(impact.baselineDistribution,{A:7,B:675,C:818,D:500});
assert.deepEqual(impact.exactOrthographyDistribution,{A:7,B:677,C:822,D:494});
assert.equal(impact.relationsChangingClassAfterExactOrthographyFix,13);
assert.equal(impact.potentialFalsePositivesCorrected,2);
assert.equal(impact.potentialFalseNegativesCorrectedByExactOrthography,4);
assert.equal(impact.additionalVisualConceptsFromEditorialSenseReview,3);
assert.equal(impact.sameConceptEditorialReclassifications,1);
assert.equal(impact.totalConceptUnitsAfterReviewedSenseExpansion,2003);
assert.deepEqual(impact.editorialConceptDistribution,{A:7,B:681,C:821,D:494});
assert.equal(changes.count,13);
assert.equal(changes.potentialFalsePositives.length,2);
assert.equal(changes.potentialFalseNegatives.length,4);
for(const word of ['basse','enceinte','portable']){
  const r=preserved.find(x=>x.exactWord===word);assert.ok(r,`missing ${word}`);assert.equal(r.conceptUnits.length,2,`${word} extra sense unit`);assert.equal(r.conceptUnits[1].provisionalClass,'B',`${word} reviewed noun sense B`);
}
const rature=preserved.find(x=>x.exactWord==='rature');assert.ok(rature,'missing rature');assert.equal(rature.conceptUnits.length,1,'rature must not be duplicated');assert.equal(rature.conceptUnits[0].editorialReassessment.provisionalClass,'B','rature reassessed B');
console.log(JSON.stringify({ok:true,rows:rows.length,baseline:dist,posSense:{accentFoldExposed:audit.accentFoldCollisionCount,classChanges:changes.count,falseNegatives:changes.potentialFalseNegatives.length,falsePositives:changes.potentialFalsePositives.length,additionalConcepts:impact.additionalVisualConceptsFromEditorialSenseReview,conceptDistribution:impact.editorialConceptDistribution}},null,2));
