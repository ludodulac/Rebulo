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
assert.equal(doSound.strictMultiPieceGain,23);
assert.equal(doSound.impactMethod,'isolated_prototype');
assert.ok(doSound.representations.some(item=>item.reading==='dos'&&item.rebusCount===4));
assert.ok(doSound.representations.some(item=>item.reading==='do'&&item.rebusCount===1));
assert.ok(doSound.inventory.some(item=>item.label==='dos'&&item.active===false));
assert.equal(doSound.researchState,'attested_sound_needs_visual_resolution');

const poSound=sound('po');
assert.equal(poSound.strictMultiPieceGain,27);
assert.ok(poSound.representations.some(item=>item.reading==='pot'&&item.rebusCount===4));

const taSound=sound('ta');
assert.equal(taSound.strictMultiPieceGain,85);
assert.equal(taSound.impactMethod,'greedy_contextual');
assert.equal(taSound.attestedRepresentationCount,1);
assert.ok(taSound.representations.some(item=>item.reading==='tas'&&item.rebusCount===2&&item.sourceCount===2));
assert.equal(taSound.researchState,'attested_sound_needs_visual_resolution');

assert.ok(priorities[0].researchPriorityScore>=priorities.at(-1).researchPriorityScore);
console.log('sound representation priority: phonetic impact is separated from visual reading evidence');
