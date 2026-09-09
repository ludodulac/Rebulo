import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeIPA} from '../src/phonetic-engine.js';
import {buildRhymeJudgments,buildRhymeMatching} from '../src/rhyme-activities.js';
import {buildRelationalTherapyCatalog} from '../src/relational-therapy-catalog.js';

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

const lexicon=JSON.parse(fs.readFileSync('data/lexicon-seed.json','utf8'));
const byLabel=new Map(lexicon.map(item=>[item.label,item]));
const bank=JSON.parse(fs.readFileSync('data/rhyme-relations.json','utf8'));
assert.equal(bank.clinicalValidation,'not_claimed');
assert.ok(bank.relations.some(item=>item.relationship==='rhyme'));
assert.ok(bank.relations.some(item=>item.relationship==='non_rhyme'));
for(const relation of bank.relations){
  assert.ok(contract.allowedRelationships.includes(relation.relationship));
  assert.equal(relation.expectedResponse,relation.relationship==='rhyme');
  const target=byLabel.get(relation.targetWord);const candidate=byLabel.get(relation.candidateWord);
  assert.ok(target&&candidate,`${relation.relationId} must reference words already present in the active lexicon seed`);
  assert.equal(normalizeIPA(target.ipa),normalizeIPA(relation.targetIpa));
  assert.equal(normalizeIPA(candidate.ipa),normalizeIPA(relation.candidateIpa));
  assert.equal(relation.evidence?.source,'data/lexicon-seed.json');
  assert.equal(relation.evidence?.method,'explicit_phonological_relation');
  if(relation.relationship==='rhyme'){
    const rime=normalizeIPA(relation.evidence?.sharedRimeIpa||'');
    assert.ok(rime,`${relation.relationId} must declare a shared rime IPA`);
    assert.ok(normalizeIPA(relation.targetIpa).endsWith(rime));
    assert.ok(normalizeIPA(relation.candidateIpa).endsWith(rime));
  }else{
    assert.notEqual(normalizeIPA(relation.evidence?.targetRimeIpa||''),normalizeIPA(relation.evidence?.candidateRimeIpa||''));
  }
}

const judgments=buildRhymeJudgments(bank.relations);
assert.equal(judgments.length,bank.relations.length,'every valid explicit relation should become a controlled judgment');
assert.ok(judgments.some(item=>item.expectedResponse===true));
assert.ok(judgments.some(item=>item.expectedResponse===false));
assert.ok(judgments.every(item=>item.childInstruction&&item.proInstruction));

const matching=buildRhymeMatching(bank.relations,'pas');
assert.ok(matching,'pas has one declared rhyme and one declared non-rhyme, so matching is controllable');
assert.equal(matching.activityId,'rhyme-matching');
assert.equal(matching.expectedResponse,'tas');
assert.deepEqual(matching.choices.map(item=>item.word),['tas','pie']);
assert.equal(buildRhymeMatching(bank.relations,'pie'),null,'matching must remain unavailable without at least two explicit choices and exactly one rhyme');

const minimalPairs=JSON.parse(fs.readFileSync('data/minimal-pair-relations.json','utf8'));
const phonemeOperations=JSON.parse(fs.readFileSync('data/phoneme-operation-relations.json','utf8'));
const catalog=buildRelationalTherapyCatalog({
  rhymeRelations:bank.relations,
  minimalPairRelations:minimalPairs.relations,
  phonemeOperations:phonemeOperations.operations
});
assert.equal(catalog.rhymeJudgments.length,3);
assert.equal(catalog.rhymeMatching.length,1);
assert.equal(catalog.minimalPairs.length,3);
assert.equal(catalog.phonemeOperations.length,3);
assert.equal(catalog.activities.length,10,'catalog must expose only activities produced from validated explicit data');
assert.equal(buildRelationalTherapyCatalog().activities.length,0,'no relational data means no relational activity');

console.log('relational therapy catalog: explicit rhyme, minimal-pair and phoneme-operation data assemble into controlled activities only');
