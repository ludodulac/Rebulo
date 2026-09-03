import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

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
for(const field of ['concept','targetIpa','asset','population','participantCount','instruction','observations','targetResponseFrequency','competingResponses','review']){
  assert.ok(record.required.includes(field),`missing required naming-test field: ${field}`);
}
assert.equal(schema.$defs.observation.additionalProperties,false,'observations must remain anonymous and tightly scoped');
assert.deepEqual(schema.$defs.observation.required,['responseVerbatim','hesitation','noResponse']);
assert.match(schema.$defs.review.description,/must never be inferred automatically/i);

assert.equal(comparisonRegistry.schemaVersion,'1.0');
assert.equal(comparisonSchema.$defs.comparison.properties.activationState.const,'inactive_until_human_decision');
assert.match(comparisonSchema.$defs.candidate.properties.namingRisks.description,/hypotheses only/i);
assert.match(comparisonSchema.$defs.humanDecision.description,/does not activate a lexicon entry/i);

const potComparison=comparisonRegistry.comparisons.find(item=>item.concept==='pot');
assert.ok(potComparison,'pot must have a structured visual prototype comparison');
assert.equal(potComparison.targetIpa,'/po/');
assert.equal(potComparison.activationState,'inactive_until_human_decision');
assert.equal(potComparison.humanDecision,null,'no human prototype decision may be fabricated');
assert.equal(potComparison.candidates.length,2,'pot should expose two distinct visual candidates for human comparison');

const openMojiPot=potComparison.candidates.find(item=>item.candidateId==='pot-openmoji-1fab4');
assert.equal(openMojiPot.namingTestStatus,'not_run');
assert.deepEqual(openMojiPot.namingRisks,['plante','plante en pot','pot de fleurs']);
const emptyPot=potComparison.candidates.find(item=>item.candidateId==='pot-openclipart-empty-flowerpot');
assert.ok(emptyPot);
assert.equal(emptyPot.namingTestStatus,'not_run','sourcing an asset must not fabricate naming-test results');
assert.ok(!emptyPot.namingRisks.includes('plante'),'the empty-pot candidate specifically removes the visible-plant cue hypothesis');

assert.equal(planRegistry.schemaVersion,'1.0');
assert.match(planSchema.description,/contains no participant result/i);
const potPlan=planRegistry.plans.find(item=>item.concept==='pot');
assert.ok(potPlan,'pot must have an executable pre-observation naming plan');
assert.equal(potPlan.activationState,'inactive_until_human_decision');
assert.deepEqual(new Set(potPlan.candidateIds),new Set(potComparison.candidates.map(x=>x.candidateId)));
assert.equal(potPlan.capture.firstSpontaneousResponseOnly,true);
assert.equal(potPlan.capture.anonymousOnly,true);
assert.equal(potPlan.capture.candidateOrder,'counterbalanced_or_randomized');
assert.equal(potPlan.decisionGate.requiresHumanReview,true);
assert.equal(potPlan.decisionGate.automaticActivation,false);
assert.match(potPlan.instruction,/Qu’est-ce que c’est/);

const potLexicon=lexicon.find(item=>item.id==='pot');
assert.ok(potLexicon,'pot prototype must remain registered in the lexicon');
assert.equal(potLexicon.active,false,'prototype comparison must never auto-activate pot');
assert.equal(potLexicon.clinicalStatus,'naming_test_required');
assert.equal(potLexicon.prototypeStatus,'asset_available');

console.log('pictogram naming test schema guardrails: ok');
