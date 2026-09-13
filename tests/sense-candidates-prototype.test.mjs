import fs from 'node:fs';
import assert from 'node:assert/strict';
const rows=fs.readFileSync('data/sense-candidates-calibration-400.jsonl','utf8').trim().split('\n').map(JSON.parse);
const m=JSON.parse(fs.readFileSync('data/sense-candidates-calibration-400-metrics.json','utf8'));
assert.equal(rows.length,400);
assert.equal(m.corpusSize,400);
assert.equal(m.formula290,'unchanged');
assert.equal(m.humanNamingEvidence,'none');
assert.equal(m.labeledEvaluationSize,99);
const required=['senseId','label','description','pos','provenance','provenanceStatus','confidence','concreteCategory','visualConceptCandidate','evidence','rationale','ambiguityNotes'];
const allowed=new Set(['observed','editorial_added','inferred_candidate']);
const ids=new Set();
for(const r of rows){
  assert.equal(r.humanNamingEvidence,'none');
  assert.ok(r.ipa&&r.exactWord);
  assert.ok(Array.isArray(r.lexicalEntries));
  assert.ok(Array.isArray(r.senseCandidates)&&r.senseCandidates.length>=1);
  for(const s of r.senseCandidates){
    for(const k of required) assert.ok(Object.hasOwn(s,k),`${r.calibrationId} missing ${k}`);
    assert.ok(allowed.has(s.provenanceStatus));
    assert.ok(s.confidence>=0&&s.confidence<=1);
    assert.ok(!ids.has(s.senseId),`duplicate senseId ${s.senseId}`); ids.add(s.senseId);
  }
  assert.ok(r.senseCandidates.some(s=>s.provenanceStatus==='inferred_candidate'));
  if(r.greenRouteEligible) assert.ok(r.senseCandidates.some(s=>['observed','editorial_added'].includes(s.provenanceStatus)&&s.visualConceptCandidate&&s.confidence>=0.8));
}
assert.equal(m.before.fp,32);
assert.equal(m.before.fn,8);
assert.equal(m.automaticSenseGate.fp,0);
assert.equal(m.afterSenseResolution.fp,0);
assert.equal(m.afterSenseResolution.fn,23);
assert.equal(m.counts.editorial_added,8);
const knownFP=new Set(m.examples.knownFalsePositives);
for(const r of rows.filter(x=>knownFP.has(x.exactWord)&&x.calibrationGroup==='sample2_automatic_ab')){
  assert.equal(r.baseline.serious,true);
  assert.equal(r.afterSenseResolutionSerious,false,`known FP survived: ${r.exactWord}`);
}
for(const word of m.examples.rescuedConcepts){
  const r=rows.find(x=>x.exactWord===word);
  assert.ok(r,`missing rescue ${word}`);
  assert.ok(r.senseCandidates.some(s=>s.provenanceStatus==='editorial_added'&&s.visualConceptCandidate));
  assert.equal(r.afterSenseResolutionSerious,true);
}
console.log('senseCandidates prototype calibration: PASS');
