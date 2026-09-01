import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCreatorCandidate} from '../src/creator-runtime.js';
import {selectTherapyActivity} from '../src/therapy-activities.js';
import {normalizeWorksheetSet,worksheetActivity,worksheetCopy} from '../src/pdf-export.js';
import {buildSessionProgression,sessionItemKey} from '../src/session-plan.js';

const lexicon=JSON.parse(fs.readFileSync(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));
const therapyDefinitions=JSON.parse(fs.readFileSync(new URL('../data/therapy-targets.json',import.meta.url),'utf8')).targets;
const target={
  target:'merci',
  targetIpa:'/mɛʁsi/',
  syllableCount:2,
  mode:'strict',
  assets:'ready',
  source:'integration-test',
  therapy:['phoneme-blending','syllable-count']
};

const candidate=buildCreatorCandidate(target,lexicon,therapyDefinitions);
assert.ok(candidate,'the creator must build a strict candidate');
assert.equal(candidate.answer,'merci');
assert.equal(candidate.syllableCount,2);
assert.deepEqual(candidate.pieces.map(piece=>piece.label),['mer','scie']);

const blending=selectTherapyActivity(candidate.therapyActivities,'phoneme-blending');
assert.ok(blending,'phoneme blending must reach the creator');
assert.deepEqual(blending.promptUnits,['m','ɛ','ʁ','s','i']);
assert.equal(blending.expectedResponse,'mɛʁsi');

const syllableCount=selectTherapyActivity(candidate.therapyActivities,'syllable-count');
assert.ok(syllableCount,'syllable count must reach the creator');
assert.equal(syllableCount.expectedResponse,2);

const sessionItem={...candidate,activity:syllableCount};
const session=normalizeWorksheetSet([sessionItem,sessionItem]);
assert.equal(session.length,1,'the same target/activity must not be duplicated in a session');
assert.equal(session[0].syllableCount,2,'creator metadata must survive the session queue');
assert.equal(sessionItemKey(session[0]),'merci::syllable-count');
assert.deepEqual(buildSessionProgression(session).map(step=>step.target),['merci']);

const childActivity=worksheetActivity(session[0].activity,'child');
const proActivity=worksheetActivity(session[0].activity,'pro');
assert.equal(childActivity.label,'Comptage syllabique');
assert.match(childActivity.instruction,/compte combien de syllabes/i);
assert.match(proActivity.instruction,/Réponse attendue : 2/);

const childCopy=worksheetCopy(session[0],'child');
const proCopy=worksheetCopy(session[0],'pro');
assert.equal(childCopy.showAnswer,false);
assert.equal(proCopy.proof,'/mɛʁ/ + /si/ = /mɛʁsi/');

console.log('creator → activity → session → PDF flow test passed');
