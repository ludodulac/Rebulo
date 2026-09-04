import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';

const comparisons=JSON.parse(await readFile(new URL('../data/pictogram-prototype-comparisons.json',import.meta.url),'utf8'));
const plans=JSON.parse(await readFile(new URL('../data/pictogram-naming-test-plans.json',import.meta.url),'utf8'));
const lexicon=JSON.parse(await readFile(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));
const namingRecords=JSON.parse(await readFile(new URL('../data/pictogram-naming-tests.json',import.meta.url),'utf8'));

const terre=comparisons.comparisons.find(item=>item.concept==='terre');
assert.ok(terre);
assert.equal(terre.targetIpa,'/tɛʁ/');
assert.equal(terre.activationState,'inactive_until_human_decision');
assert.equal(terre.humanDecision,null);
assert.equal(terre.candidates.length,4);
for(const candidate of terre.candidates){
  assert.match(candidate.candidateId,/^terre-rebulo-/);
  assert.match(candidate.asset,/^assets\/research\/terre-.+\.svg$/);
  await access(new URL(`../${candidate.asset}`,import.meta.url));
  assert.match(candidate.provenance,/Prototype de recherche dessiné dans Rebulo/);
  assert.equal(candidate.namingTestStatus,'not_run');
  assert.ok(candidate.namingRisks.length>=3);
}
const plan=plans.plans.find(item=>item.concept==='terre');
assert.ok(plan);
assert.equal(plan.planId,'terre-prototype-comparison-v1');
assert.deepEqual(new Set(plan.candidateIds),new Set(terre.candidates.map(item=>item.candidateId)));
assert.equal(plan.capture.firstSpontaneousResponseOnly,true);
assert.equal(plan.capture.anonymousOnly,true);
assert.equal(plan.decisionGate.automaticActivation,false);
assert.equal(lexicon.find(item=>item.id==='terre'),undefined,'terre research must not silently create or reactivate a lexicon entry');
assert.deepEqual(namingRecords.records,[],'no participant result may be fabricated');

console.log('terre naming stimuli: four local candidates remain research-only and outside the lexicon');
