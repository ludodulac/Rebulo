import fs from 'node:fs';
import assert from 'node:assert/strict';

const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const readJsonl=p=>fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const gold=readJson('data/dominant-sense-gold-225.json');
const dev=readJson('data/dominant-sense-development-evaluation.json');
const hold=readJson('data/dominant-sense-holdout-evaluation.json');
const holdRows=readJsonl('data/dominant-sense-holdout-source.jsonl');
const model=fs.readFileSync('scripts/lib/dominant-sense-semantic-model.mjs','utf8');
const holdoutBuilder=fs.readFileSync('scripts/build-dominant-sense-holdout.mjs','utf8');
const prior400=readJsonl('data/sense-candidates-calibration-400.jsonl');
const prior650=readJsonl('data/sense-coverage-recall-650.jsonl');
const prior150=readJson('data/independent-sense-gold-150.json').rows;
const prior75=readJson('data/structured-sense-holdout-75.json').rows;
const key=r=>`${r.ipa}|${r.exactWord}`;

assert.equal(gold.status,'editorially_reviewed_and_sealed_before_semantic_source_lookup');
assert.equal(gold.sourceLookedAt,false);
assert.equal(gold.totalCount,225);assert.equal(gold.developmentCount,135);assert.equal(gold.holdoutCount,90);
assert.equal(gold.rows.filter(r=>r.partition==='development').length,135);
assert.equal(gold.rows.filter(r=>r.partition==='holdout').length,90);
assert.ok(gold.rows.every(r=>r.goldReview?.status==='editorial_reviewed_and_sealed_pre_source'));
assert.ok(gold.rows.every(r=>typeof r.goldReview.seriousVisualConcept==='boolean'));
assert.ok(gold.rows.every(r=>Array.isArray(r.goldReview.expectedVisualSenses)));
assert.ok(gold.rows.every(r=>['low','medium','high'].includes(r.goldReview.risk)));
assert.ok(gold.rows.every(r=>r.goldReview.primarySemanticType));
assert.ok(gold.rows.every(r=>r.humanNamingEvidence==='none'));

const used=new Set([...prior400,...prior650,...prior150,...prior75].map(key));
assert.ok(gold.rows.every(r=>!used.has(key(r))),'new gold overlaps a prior calibration/development/holdout corpus');
const historical=new Set(['club','oeuvre','star','drogue','mu','course','perte','chasse','pub','rêve','lettre','chose','droite','vote','geste']);
assert.ok(gold.rows.every(r=>!historical.has(String(r.exactWord).toLowerCase())),'new gold overlaps historical diagnostic 15');

assert.equal(dev.n,135);assert.equal(dev.modelVersion,'dominant-sense-semantic-v4');
assert.equal(dev.metrics.fp,0);assert.equal(dev.metrics.precision,100);assert.ok(dev.metrics.recall>0);
assert.equal(hold.status,'sealed_holdout_final_no_further_model_tuning');
assert.equal(hold.n,90);assert.equal(hold.positive,17);assert.equal(hold.negative,73);
assert.equal(hold.modelVersion,'dominant-sense-semantic-v4');
assert.equal(hold.frozenModelSha,'9905d76216194ae6d8b8868c78c5e8383b543a15');
assert.deepEqual(hold.primaryMetricsSenseAligned,{n:90,tp:2,fp:0,tn:73,fn:15,precision:100,recall:11.8,f1:21.1});
assert.deepEqual(hold.relationLevelMetrics,{n:90,tp:3,fp:2,tn:71,fn:14,precision:60,recall:17.6,f1:27.3});
assert.equal(hold.senseRanking.top1.percent,47.1);assert.equal(hold.senseRanking.top2.percent,52.9);assert.equal(hold.senseRanking.top3.percent,58.8);
assert.equal(hold.semanticTypeAccuracy.percent,46.6);
assert.equal(hold.automaticGreens.length,5);assert.equal(hold.falsePositives.length,2);assert.equal(hold.falseNegatives.length,15);assert.equal(hold.wrongSenseGreens.length,1);
assert.equal(hold.coverage.relationsWithObservedSense,88);assert.equal(hold.coverage.positiveWithObservedSense,17);
assert.equal(holdRows.length,90);
for(const r of holdRows){
 assert.equal(r.partition,'holdout');
 for(const s of r.rankedSenses||[]){
  assert.equal(s.senseObserved,true);
  assert.equal(s.provenanceStatus,'observed');
  assert.equal(s.visualConceptCandidate,false,'observed lexical sense must not itself assert visual eligibility');
  assert.ok(s.sourceDefinition&&s.sourceSenseId&&s.sourcePOS);
  assert.ok(s.semanticAnalysis?.type);
  assert.equal(s.phoneticIdentity?.ipa,r.ipa);
  assert.match(s.phoneticIdentity?.ipaProvenance||'',/^B exact relation/);
 }
}

// Pipeline integrity: decision model is general code, not editorial data or a word exception table.
assert.ok(!/node:fs|readFile|goldReview|editorial_added|DSG-[DH]-\d+|sense-candidates-calibration|sense-coverage-recall|independent-sense-gold|structured-sense-holdout/.test(model));
assert.ok(!/editorial_added|whitelist|blacklist/.test(model));
assert.ok(!/goldReview\s*\)|goldReview\s*\.|expectedVisualSenses/.test(model));
assert.match(model,/senseObserved|semanticType|visualEligibility|rankObservedSenses|decideVisualEligibility/);
assert.match(holdoutBuilder,/FROZEN_MODEL_SHA='9905d76216194ae6d8b8868c78c5e8383b543a15'/);
assert.ok(!/development-source\.jsonl/.test(holdoutBuilder),'holdout builder must not read development outcomes');
console.log(JSON.stringify({ok:true,gold:225,development:135,holdout:90,holdoutRecall:hold.primaryMetricsSenseAligned.recall,relationPrecision:hold.relationLevelMetrics.precision},null,2));