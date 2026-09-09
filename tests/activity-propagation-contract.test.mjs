import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCreatorTargets} from '../src/creator-catalog.js';
import {buildCreatorCandidate} from '../src/creator-runtime.js';
import {selectTherapyActivity} from '../src/therapy-activities.js';
import {normalizeWorksheetSet,worksheetActivity} from '../src/pdf-export.js';
import {sessionItemKey} from '../src/session-plan.js';

const lexicon=JSON.parse(fs.readFileSync(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));
const definitions=JSON.parse(fs.readFileSync(new URL('../data/therapy-targets.json',import.meta.url),'utf8')).targets;

const [target]=buildCreatorTargets({
  constructible:[{
    word:'merci',
    ipa:'/mɛʁsi/',
    syllableCount:2,
    frequency:100,
    decomposition:['mer','scie']
  }]
});

assert.ok(target,'the generated catalog must expose the strict target');
assert.equal(target.syllableCount,2);

const expectedIds=[
  'denomination',
  'lexical-access',
  'phoneme-initial',
  'phoneme-final',
  'phoneme-segmentation',
  'phoneme-blending',
  'syllable-count',
  'syllable-blending',
  'oral-to-written'
];
assert.deepEqual(target.therapy,expectedIds,'the generated catalog must expose every currently implemented creator activity in its intended order');

const candidate=buildCreatorCandidate(target,lexicon,definitions);
assert.ok(candidate,'the generated target must survive creator runtime construction');
assert.deepEqual(candidate.therapyActivities.map(activity=>activity.id),expectedIds,'runtime must preserve every implemented catalog activity');

for(const id of expectedIds){
  const activity=selectTherapyActivity(candidate.therapyActivities,id);
  assert.ok(activity,`${id} must be selectable in the creator`);
  assert.ok(activity.label,`${id} must retain its catalog label`);
  assert.ok(activity.childInstruction,`${id} must expose a child instruction`);
  assert.ok(activity.proInstruction,`${id} must expose a professional instruction`);

  const [sessionItem]=normalizeWorksheetSet([{...candidate,activity}]);
  assert.ok(sessionItem,`${id} must survive insertion into a session`);
  assert.equal(sessionItem.activity.id,id,`${id} must remain attached to the session item`);
  assert.equal(sessionItemKey(sessionItem),`merci::${id.replaceAll('-','')}`);

  const child=worksheetActivity(sessionItem.activity,'child');
  const pro=worksheetActivity(sessionItem.activity,'pro');
  assert.equal(child.label,activity.label,`${id} child PDF metadata must preserve the activity label`);
  assert.equal(pro.label,activity.label,`${id} professional PDF metadata must preserve the activity label`);
  assert.ok(child.instruction,`${id} must reach child PDF instructions`);
  assert.ok(pro.instruction,`${id} must reach professional PDF instructions`);
}

const phonemeBlending=selectTherapyActivity(candidate.therapyActivities,'phoneme-blending');
assert.deepEqual(phonemeBlending.promptUnits,['m','ɛ','ʁ','s','i']);
assert.equal(phonemeBlending.expectedResponse,'mɛʁsi');
assert.equal(selectTherapyActivity(candidate.therapyActivities,'syllable-count').expectedResponse,2);

console.log('activity propagation contract: generated catalog → creator → session → PDF metadata ok');
