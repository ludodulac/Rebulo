import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildSoundRepresentationPriorities} from '../src/sound-representation-priority.js';

const readJson=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const [corpus,readingSounds,lexiconSeed,expansion]=await Promise.all([
  readJson('../data/attested-rebus-corpus.json'),
  readJson('../data/research-reading-sounds.json'),
  readJson('../data/lexicon-seed.json'),
  readJson('../data/expansion-simulation.json')
]);

const priorities=buildSoundRepresentationPriorities({corpus,readingSounds,lexiconSeed,expansion});
const sound=ipa=>priorities.find(item=>item.ipa===ipa);

const doSound=sound('do');
assert.ok(doSound);
assert.ok(doSound.representations.some(item=>item.reading==='dos'&&item.rebusCount===4));
assert.ok(doSound.representations.some(item=>item.reading==='do'&&item.rebusCount===1));
assert.ok(doSound.inventory.some(item=>item.label==='dos'&&item.active===true));
assert.equal(doSound.researchState,'already_active');
assert.equal(doSound.strictMultiPieceGain,0,'active inventory should no longer be counted as a pending expansion gain');
assert.equal(doSound.impactMethod,'none');

const poSound=sound('po');
assert.ok(poSound.representations.some(item=>item.reading==='pot'&&item.rebusCount===4));
assert.ok(poSound.inventory.some(item=>item.label==='pot'&&item.active===true));
assert.equal(poSound.researchState,'already_active');
assert.equal(poSound.strictMultiPieceGain,0,'active inventory should no longer be counted as a pending expansion gain');

const activeThe=lexiconSeed.find(item=>item.label==='thé');
assert.ok(activeThe);
assert.equal(activeThe.ipa,'/te/');
assert.equal(activeThe.active,true);
assert.equal(activeThe.clinicalStatus,'naming_test_required');

const taSound=sound('ta');
assert.ok(taSound.strictMultiPieceGain>0);
assert.equal(taSound.impactMethod,'greedy_contextual');
assert.equal(taSound.attestedRepresentationCount,1);
assert.ok(taSound.representations.some(item=>item.reading==='tas'&&item.rebusCount===2&&item.sourceCount===2));
assert.equal(taSound.researchState,'attested_sound_needs_visual_resolution');

assert.ok(priorities[0].researchPriorityScore>=priorities.at(-1).researchPriorityScore);
console.log('sound representation priority: active sounds leave pending expansion gain; attested unresolved sounds remain prioritized');
