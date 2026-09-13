import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const readJsonl=p=>fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const metrics=readJson('data/sense-coverage-recall-metrics.json');
const audit=readJson('data/sense-coverage-fn-audit.json');
const review=readJson('data/sense-coverage-fn-editorial-review.json');
const rows=readJsonl('data/sense-coverage-recall-650.jsonl');

assert.equal(metrics.formula290,'unchanged');
assert.equal(metrics.humanNamingEvidence,'none');
assert.equal(metrics.originalCorpusSize,400);
assert.equal(metrics.labeledEvaluationSize,99);
assert.equal(metrics.newStressCases,250);
assert.equal(metrics.extendedCorpusSize,650);
assert.equal(metrics.stressOverlapWithOriginal,0);
assert.equal(rows.length,650);
assert.equal(audit.falseNegativeCount,23);
assert.equal(audit.falsePositiveCount,0);
assert.equal(audit.historicalMatchCount,0);
assert.equal(review.reviewed,23);
assert.equal(review.recoverEditorial,8);
assert.equal(review.keepOrange,15);

assert.deepEqual(metrics.before,{n:99,tp:31,fp:0,tn:45,fn:23,precision:100,recall:57.4,f1:72.9});
assert.deepEqual(metrics.after,{n:99,tp:39,fp:0,tn:45,fn:15,precision:100,recall:72.2,f1:83.9});
assert.equal(metrics.falseNegativesRecovered,8);
assert.equal(metrics.falsePositivesIntroduced,0);
assert.deepEqual(metrics.originalRoutesBefore,{green:43,orange:89,red:268});
assert.deepEqual(metrics.originalRoutesAfter,{green:51,orange:104,red:245});
assert.deepEqual(metrics.labeledRoutesBefore,{green:8,orange:23,red:68});
assert.deepEqual(metrics.labeledRoutesAfter,{green:16,orange:38,red:45});

const expectedRecovered=['couple','diable','flingue','gorge','ligne','monstre','prof','siège'];
assert.deepEqual(metrics.recovered.map(x=>x.word).sort((a,b)=>a.localeCompare(b,'fr')),expectedRecovered.sort((a,b)=>a.localeCompare(b,'fr')));
assert(metrics.recovered.every(x=>x.evidenceType==='editorial_added'));

const statuses=new Set(['observed','editorial_added','inferred_candidate']);
let stress=0;
for(const row of rows){
  assert.equal(row.humanNamingEvidence,'none');
  for(const s of row.senseCandidates||[]){assert(statuses.has(s.provenanceStatus));}
  if(row.stressId){
    stress++;
    assert.notEqual(row.coverageRoute==='green' && !(row.senseCandidates||[]).some(s=>s.provenanceStatus==='observed'&&s.visualConceptCandidate&&s.confidence>=0.8),true,'stress green must be evidence-backed observed');
  } else if(row.greenRouteEligibleAfterCoverage){
    assert((row.senseCandidates||[]).some(s=>['observed','editorial_added'].includes(s.provenanceStatus)&&s.visualConceptCandidate&&s.confidence>=0.8),'original green must have observed/editorial evidence');
  }
}
assert.equal(stress,250);

for(const rec of expectedRecovered){
  const row=rows.find(r=>r.exactWord===rec && r.coverageReviewDecision==='recover_editorial');
  assert(row,`missing recovered ${rec}`);
  assert(row.senseCandidates.some(s=>s.provenanceStatus==='editorial_added'));
  assert(!row.senseCandidates.some(s=>s.provenanceStatus==='observed'&&s.provenance==='sense-coverage/editorial-fn-review-2026-09-13'));
}

const stressRows=rows.filter(r=>r.stressId);
const stressKeys=new Set(stressRows.map(r=>`${r.ipa}|${r.exactWord}`));
assert.equal(stressKeys.size,250);
assert.equal(metrics.newStressProvenance.inferred_candidate,250);
assert.equal(metrics.newEditorialAdded,8);
assert.equal(metrics.newInferredCandidates,250);

console.log('sense coverage recall calibration: PASS');
