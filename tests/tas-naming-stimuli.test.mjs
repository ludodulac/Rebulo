import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';

const comparisons=JSON.parse(await readFile(new URL('../data/pictogram-prototype-comparisons.json',import.meta.url),'utf8'));
const plans=JSON.parse(await readFile(new URL('../data/pictogram-naming-test-plans.json',import.meta.url),'utf8'));
const lexicon=JSON.parse(await readFile(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));
const namingRecords=JSON.parse(await readFile(new URL('../data/pictogram-naming-tests.json',import.meta.url),'utf8'));

const tas=comparisons.comparisons.find(item=>item.concept==='tas');
assert.ok(tas);
assert.equal(tas.revision,'tas-v1');
assert.equal(tas.targetIpa,'/ta/');
assert.equal(tas.activationState,'inactive_until_human_decision');
assert.equal(tas.humanDecision,null);
assert.equal(tas.candidates.length,4);
for(const candidate of tas.candidates){
  assert.match(candidate.candidateId,/^tas-rebulo-/);
  assert.match(candidate.asset,/^assets\/research\/tas-.+\.svg$/);
  await access(new URL(`../${candidate.asset}`,import.meta.url));
  assert.match(candidate.provenance,/Prototype de recherche dessiné dans Rebulo/);
  assert.equal(candidate.namingTestStatus,'not_run');
  assert.ok(candidate.namingRisks.length>=3);
}
const plan=plans.plans.find(item=>item.concept==='tas');
assert.ok(plan);
assert.equal(plan.planId,'tas-prototype-comparison-v1');
assert.deepEqual(new Set(plan.candidateIds),new Set(tas.candidates.map(item=>item.candidateId)));
assert.equal(plan.capture.firstSpontaneousResponseOnly,true);
assert.equal(plan.capture.anonymousOnly,true);
assert.equal(plan.decisionGate.automaticActivation,false);

const activeTas=lexicon.find(item=>item.id==='tas');
assert.ok(activeTas,'the newer product revision may exist without rewriting tas-v1 research');
assert.equal(activeTas.ipa,'/ta/');
assert.equal(activeTas.active,true);
assert.equal(activeTas.image,'assets/rebus/tas.svg');
assert.equal(activeTas.artRevision,'tas-comic-v1');
assert.equal(activeTas.prototypeStatus,'general_owner_approved');
assert.equal(activeTas.clinicalStatus,'naming_test_required');
assert.notEqual(activeTas.artRevision,tas.revision,'tas-v1 research observations must never be transferred to the comic revision');
assert.deepEqual(namingRecords.records,[],'no participant result may be fabricated');

console.log('tas naming stimuli: tas-v1 remains immutable research while tas-comic-v1 is a separate general-product revision');
