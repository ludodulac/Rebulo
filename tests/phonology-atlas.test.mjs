import assert from 'node:assert/strict';
import {ALL_OPEN_PICTOGRAMS} from '../src/pictogram-print-sheets.js';
import {atlasStats,availablePhonemes,buildPhonologyAtlas,filterAtlas,groupByWholeSound,phonemePosition} from '../src/phonology-atlas.js';

assert.deepEqual(phonemePosition('/ʃa/','ʃ'),['initial']);
assert.deepEqual(phonemePosition('/ʃa/','a'),['final']);
assert.deepEqual(phonemePosition('/velo/','l'),['medial']);
assert.deepEqual(phonemePosition('/dodo/','d'),['initial','medial']);

const atlas=buildPhonologyAtlas();
assert.equal(atlas.length,ALL_OPEN_PICTOGRAMS.length);
assert.ok(atlas.every(entry=>entry.indexId.startsWith('RBL-')));
assert.ok(atlas.every(entry=>entry.ipa&&entry.phonemes.length));
assert.ok(atlas.every(entry=>entry.soundUnit==='whole_word_block'||entry.soundUnit==='syllable_evidenced'));
assert.ok(atlas.filter(entry=>entry.syllableCount===null).every(entry=>entry.soundUnit==='whole_word_block'));

const initialS=filterAtlas({phoneme:'s',position:'initial',strictOnly:true});
assert.ok(initialS.length>0);
assert.ok(initialS.every(entry=>entry.phonemes[0]==='s'));
const finalA=filterAtlas({phoneme:'a',position:'final',strictOnly:true});
assert.ok(finalA.length>0);
assert.ok(finalA.every(entry=>entry.phonemes.at(-1)==='a'));

const phonemes=availablePhonemes();
assert.ok(phonemes.length>10);
assert.ok(phonemes.some(item=>item.phoneme==='ʃ'));
assert.ok(groupByWholeSound().length>50);
const stats=atlasStats();
assert.equal(stats.entries,atlas.length);
assert.ok(stats.wholeSoundBlocks>50);
console.log('phonology atlas: ok');
