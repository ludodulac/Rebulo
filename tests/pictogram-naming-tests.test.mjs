import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';

const schema=JSON.parse(await readFile(new URL('../data/pictogram-naming-tests.schema.json',import.meta.url),'utf8'));
const registry=JSON.parse(await readFile(new URL('../data/pictogram-naming-tests.json',import.meta.url),'utf8'));
const planSchema=JSON.parse(await readFile(new URL('../data/pictogram-naming-test-plans.schema.json',import.meta.url),'utf8'));
const planRegistry=JSON.parse(await readFile(new URL('../data/pictogram-naming-test-plans.json',import.meta.url),'utf8'));
const comparisonSchema=JSON.parse(await readFile(new URL('../data/pictogram-prototype-comparisons.schema.json',import.meta.url),'utf8'));
const comparisonRegistry=JSON.parse(await readFile(new URL('../data/pictogram-prototype-comparisons.json',import.meta.url),'utf8'));
const lexicon=JSON.parse(await readFile(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));

assert.equal(registry.schemaVersion,'1.0');
assert.deepEqual(registry.records,[],'the repository must not contain fabricated participant results');

const record=schema.$defs.testRecord;
for(const field of ['concept','targetIpa','asset','population','participantCount','instruction','observations','targetResponseFrequency','competingResponses','review']) assert.ok(record.required.includes(field),`missing required naming-test field: ${field}`);
assert.equal(schema.$defs.observation.additionalProperties,false);
assert.deepEqual(schema.$defs.observation.required,['responseVerbatim','hesitation','noResponse']);
assert.match(schema.$defs.review.description,/must never be inferred automatically/i);
assert.equal(comparisonRegistry.schemaVersion,'1.0');
assert.equal(comparisonSchema.$defs.comparison.properties.activationState.const,'inactive_until_human_decision');
assert.match(comparisonSchema.$defs.candidate.properties.namingRisks.description,/hypotheses only/i);
assert.match(comparisonSchema.$defs.humanDecision.description,/does not activate a lexicon entry/i);

const potComparison=comparisonRegistry.comparisons.find(item=>item.concept==='pot');
assert.ok(potComparison);assert.equal(potComparison.targetIpa,'/po/');assert.equal(potComparison.activationState,'inactive_until_human_decision');assert.equal(potComparison.humanDecision,null);assert.equal(potComparison.candidates.length,4);
const openMojiPot=potComparison.candidates.find(item=>item.candidateId==='pot-openmoji-1fab4');
assert.equal(openMojiPot.namingTestStatus,'not_run');assert.deepEqual(openMojiPot.namingRisks,['plante','plante en pot','pot de fleurs']);
const emptyPot=potComparison.candidates.find(item=>item.candidateId==='pot-openclipart-empty-flowerpot');
assert.ok(emptyPot);assert.equal(emptyPot.namingTestStatus,'not_run');assert.ok(!emptyPot.namingRisks.includes('plante'));

const dosComparison=comparisonRegistry.comparisons.find(item=>item.concept==='dos');
assert.ok(dosComparison);assert.equal(dosComparison.targetIpa,'/do/');assert.equal(dosComparison.activationState,'inactive_until_human_decision');assert.equal(dosComparison.humanDecision,null);assert.equal(dosComparison.candidates.length,4);
for(const candidate of dosComparison.candidates){assert.equal(candidate.availability,'available');assert.equal(candidate.namingTestStatus,'not_run');assert.ok(candidate.namingRisks.length>0);}
assert.ok(dosComparison.candidates.some(item=>item.provenance.includes('CC0')));
assert.ok(dosComparison.candidates.some(item=>item.provenance.includes('CC BY-SA 4.0')));

const raieComparison=comparisonRegistry.comparisons.find(item=>item.concept==='raie');
assert.ok(raieComparison,'raie must have a structured four-stimulus comparison');
assert.equal(raieComparison.targetIpa,'/ʁɛ/');
assert.equal(raieComparison.activationState,'inactive_until_human_decision');
assert.equal(raieComparison.humanDecision,null);
assert.equal(raieComparison.candidates.length,4);
assert.ok(raieComparison.candidates.every(item=>item.candidateId.startsWith('raie-rebulo-')));

const rebuloResearchCandidates=[...potComparison.candidates,...dosComparison.candidates,...raieComparison.candidates].filter(item=>item.candidateId.includes('-rebulo-'));
assert.equal(rebuloResearchCandidates.length,8,'pot/dos/raie should now include eight Rebulo-authored local stimuli');
for(const candidate of rebuloResearchCandidates){
  assert.match(candidate.asset,/^assets\/research\/.+\.svg$/);
  await access(new URL(`../${candidate.asset}`,import.meta.url));
  assert.match(candidate.provenance,/Prototype de recherche dessiné dans Rebulo/);
  assert.equal(candidate.namingTestStatus,'not_run');
}

assert.equal(planRegistry.schemaVersion,'1.0');
assert.match(planSchema.description,/contains no participant result/i);
for(const concept of ['pot','dos','raie']){
  const comparison=comparisonRegistry.comparisons.find(item=>item.concept===concept);
  const plan=planRegistry.plans.find(item=>item.concept===concept);
  assert.ok(plan,`${concept} must have an executable pre-observation naming plan`);
  assert.equal(plan.activationState,'inactive_until_human_decision');
  assert.deepEqual(new Set(plan.candidateIds),new Set(comparison.candidates.map(x=>x.candidateId)));
  assert.equal(plan.candidateIds.length,4);
  assert.equal(plan.capture.firstSpontaneousResponseOnly,true);
  assert.equal(plan.capture.anonymousOnly,true);
  assert.equal(plan.capture.candidateOrder,'counterbalanced_or_randomized');
  assert.equal(plan.decisionGate.requiresHumanReview,true);
  assert.equal(plan.decisionGate.automaticActivation,false);
  assert.match(plan.instruction,/Qu’est-ce que c’est/);
}
assert.match(planRegistry.plans.find(item=>item.concept==='pot').planId,/-v2$/);
assert.match(planRegistry.plans.find(item=>item.concept==='dos').planId,/-v2$/);
assert.match(planRegistry.plans.find(item=>item.concept==='raie').planId,/-v1$/);

for(const concept of ['pot','dos','raie']){
  const item=lexicon.find(entry=>entry.id===concept);
  assert.ok(item,`${concept} must remain registered in the lexicon`);
  assert.equal(item.active,false,`${concept} naming comparison must never auto-activate the lexicon entry`);
  assert.notEqual(item.clinicalStatus,'clinical_approved');
}
assert.equal(lexicon.find(item=>item.id==='pot').clinicalStatus,'naming_test_required');
assert.equal(lexicon.find(item=>item.id==='pot').prototypeStatus,'asset_available');

console.log('pictogram naming test schema guardrails: pot, dos and raie expose four real stimuli and stay research-only.');
