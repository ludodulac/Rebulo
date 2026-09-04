import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const bank=JSON.parse(await readFile(new URL('../data/pictogram-research-candidate-bank.json',import.meta.url),'utf8'));
assert.equal(bank.schemaVersion,'1.0');
assert.equal(bank.guardrails.automaticActivation,false);
assert.equal(bank.guardrails.clinicalValidation,false);
assert.equal(bank.guardrails.requiresHumanDecision,true);
assert.equal(bank.guardrails.runnerRequiresSeparateStimulusReview,true);

for(const conceptName of ['tas','raie','terre']){
  const concept=bank.concepts.find(item=>item.concept===conceptName);
  assert.ok(concept,`${conceptName} research concept should exist`);
  assert.equal(concept.activationState,'research_only');
  assert.ok(concept.candidates.length>=3,`${conceptName} should have at least three research candidates`);
  for(const candidate of concept.candidates){
    assert.match(candidate.sourcePage,/^https:\/\//);
    assert.ok(candidate.license);
    assert.ok(candidate.sourceLabel);
    assert.ok(candidate.namingRisks.length>=2);
    assert.equal(candidate.runnerReady,false,'research source must not silently enter the human runner');
  }
}

assert.equal(bank.concepts.some(concept=>concept.activationState==='active'),false);
assert.equal(JSON.stringify(bank).includes('clinical_approved'),false);

console.log('pictogram research candidate bank: source richness and activation guardrails ok');
