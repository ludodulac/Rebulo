import fs from 'node:fs';
import assert from 'node:assert/strict';

const rows=fs.readFileSync('data/b-to-c-industrial-sample-2000.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const metrics=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2000-metrics.json','utf8'));
const rescueReview=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2000-rescue-editorial-review.json','utf8'));
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
  assert.ok(r.aggregateScore>=65&&r.aggregateScore<80,`${r.sampleId} rescue B threshold`);
  assert.ok(r.scores.expectedNameability>=2,`${r.sampleId} rescue naming`);
  assert.ok(r.scores.drawability>=2,`${r.sampleId} rescue drawability`);
}
console.log(JSON.stringify({ok:true,rows:rows.length,distribution:dist,rescueAutomatic:metrics.rescue,rescueEditorial:{reviewed:rescueReview.reviewedRelations,recovered:rescueReview.editorialSeriousRecovered},distinctIpaCount:metrics.distinctIpaCount},null,2));
