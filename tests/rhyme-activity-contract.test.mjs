import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('data/rhyme-activity-contract.json','utf8'));

assert.equal(contract.activationPolicy,'explicit_relations_only');
assert.deepEqual(contract.activities,['rhyme-judgment','rhyme-matching']);
for(const field of ['targetWord','targetIpa','candidateWord','candidateIpa','relationship','expectedResponse','evidence']){
  assert.ok(contract.requiredRelationFields.includes(field),`${field} must be required before rhyme activation`);
}
assert.deepEqual(contract.allowedRelationships,['rhyme','non_rhyme']);
assert.equal(contract.evidenceRequirements.explicitSharedRimeIpaForRhymes,true);
assert.equal(contract.evidenceRequirements.sourceOrHumanReview,true);
assert.equal(contract.evidenceRequirements.automaticOrthographicInferenceForbidden,true);
assert.equal(contract.evidenceRequirements.automaticRebusPieceInferenceForbidden,true);
assert.deepEqual(contract.judgment.expectedResponseValues,[true,false]);
assert.ok(contract.matching.minimumChoices>=2);
assert.equal(contract.matching.requiresExactlyOneDeclaredRhyme,true);

console.log('rhyme activity contract: explicit relations and controlled expected responses required before activation');
