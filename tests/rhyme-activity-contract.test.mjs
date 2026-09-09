import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeIPA} from '../src/phonetic-engine.js';
import {buildRhymeJudgments,buildRhymeMatching} from '../src/rhyme-activities.js';
import {buildRelationalTherapyCatalog} from '../src/relational-therapy-catalog.js';
import {attachCreatorRelationalActivities} from '../src/relational-creator-exposure.js';
import {buildCreatorCandidate} from '../src/creator-runtime.js';
import {normalizeWorksheetSet} from '../src/pdf-export.js';
import {buildSessionSharePayload,serializeSessionShare,deserializeSessionShare,resolveSharedSession} from '../src/session-share.js';
import {sessionAnswerMatches,sessionExpectedAnswer,safeSessionHint} from '../src/session-runner.js';

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

const corpus=JSON.parse(fs.readFileSync('data/corpus-pilot.json','utf8')).items;
const therapy=JSON.parse(fs.readFileSync('data/therapy-targets.json','utf8')).targets;
const strictReady=corpus.filter(item=>item.mode==='strict'&&item.assets==='ready');
const enriched=strictReady.map(item=>attachCreatorRelationalActivities(item,catalog));
const exposed=enriched.filter(item=>item.relationalActivities?.length);
assert.deepEqual(exposed.map(item=>item.target).sort(),['parapluie','parasol'],'the first creator pilot must remain limited to targets with an explicitly declared usable source piece');
for(const target of exposed){
  assert.ok(target.relationalActivities.every(activity=>activity.activityId==='rhyme-matching'),'no other relational type is exposed in the first creator pilot');
  assert.ok(target.relationalActivities.every(activity=>activity.technicalValidation==='phonological_contract'));
  assert.ok(target.relationalActivities.every(activity=>activity.pedagogicalValidation==='not_evaluated'),'technical validity must not be presented as pedagogical validation');
}

const parapluie=enriched.find(item=>item.target==='parapluie');
const creatorCandidate=buildCreatorCandidate(parapluie,lexicon,therapy);
const creatorActivity=creatorCandidate.therapyActivities.find(item=>item.activityId==='rhyme-matching');
assert.ok(creatorActivity,'creator must discover the controlled rhyme matching activity');
assert.equal(creatorActivity.focusWord,'pas');
assert.equal(creatorActivity.label,'Trouver une rime avec « pas »');
assert.equal(creatorActivity.description.includes('mot-image déclaré'),true,'the professional must understand why the activity is proposed');
assert.equal(creatorActivity.childInstruction,'Quel mot rime avec « pas » : tas ou pie ?');
assert.equal(creatorActivity.sessionExpectedResponse,'tas');
assert.equal(creatorCandidate.therapyActivities[0].id,creatorActivity.id,'the controlled pilot must be the visible default when it exists');
assert.equal(creatorActivity.proInstruction,'Avec le mot-image « pas » du rébus, demande : « Quel mot rime avec pas : tas ou pie ? » Réponse attendue : « tas ».');

const [queued]=normalizeWorksheetSet([{...creatorCandidate,activity:creatorActivity}]);
assert.equal(queued.activity.id,creatorActivity.id,'adding to a session must retain the exact relational activity identity');
const payload=buildSessionSharePayload([queued],{hint:true,solution:true});
assert.equal(payload.v,2);assert.equal(payload.rounds[0].activity,'rhyme-matchingpas');assert.equal(payload.rounds[0].activityLabel,creatorActivity.label);
const reopenedPayload=deserializeSessionShare(serializeSessionShare(payload));
const reopened=resolveSharedSession(reopenedPayload,{corpus:enriched,buildCandidate:target=>buildCreatorCandidate(target,lexicon,therapy)});
assert.equal(reopened.allUsable,true);assert.equal(reopened.items.length,1);
const round=reopened.items[0];
assert.equal(round.activity.id,creatorActivity.id,'reopened session must resolve the same controlled activity');
assert.equal(sessionExpectedAnswer(round),'tas');
assert.equal(sessionAnswerMatches('tas',round),true,'session must validate the relational expected word, not the rebus answer');
assert.equal(sessionAnswerMatches('parapluie',round),false);
assert.equal(safeSessionHint(round),'Choisis parmi : tas ou pie.');

const catalogWithoutPilot=enriched.map(item=>item.target==='parapluie'?{...item,relationalActivities:[]}:item);
const unavailable=resolveSharedSession(reopenedPayload,{corpus:catalogWithoutPilot,buildCandidate:target=>buildCreatorCandidate(target,lexicon,therapy)});
assert.equal(unavailable.items.length,0);assert.equal(unavailable.unavailable.length,1);
assert.equal(unavailable.unavailable[0].reason,'activity_unavailable');
assert.equal(unavailable.unavailable[0].descriptor.targetLabel,'parapluie');
assert.equal(unavailable.unavailable[0].descriptor.activityLabel,'Trouver une rime avec « pas »','saved session must remain intelligible when relational data disappears later');

assert.equal(catalog.rhymeMatching.find(item=>item.targetWord==='pie'),undefined,'pie has no controlled matching set yet: insufficient explicit choices must remain an acceptable absence');

console.log('relational creator/session pilot: controlled rhyme discovery, queue, save, reopen, use and later unavailability all pass');
