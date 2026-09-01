import assert from 'node:assert/strict';
import {buildCreatorTargets} from '../src/creator-catalog.js';

const report={constructible:[
  {word:'merci',ipa:'mɛʁsi',frequency:100,syllableCount:2,decomposition:['mer','scie']},
  {word:'Merci',ipa:'mɛʁsi',frequency:10,syllableCount:2,decomposition:['mer','scie']},
  {word:'cinéma',ipa:'sinema',frequency:50,syllableCount:3,decomposition:['scie','nez','mat']},
  {word:'mer',ipa:'mɛʁ',frequency:200,syllableCount:1,decomposition:['mer']},
  {word:'trop-long',ipa:'abcdef',frequency:1,syllableCount:2,decomposition:['a','b','c','d','e']},
  {word:'cassé',ipa:'',frequency:1,syllableCount:2,decomposition:['a','b']},
  {word:'sans-compte',ipa:'sɑ̃kɔ̃t',frequency:40,syllableCount:null,decomposition:['sans','compte']}
]};

const targets=buildCreatorTargets(report);
assert.equal(targets.length,3);
assert.deepEqual(targets.map(item=>item.target),['merci','cinéma','sans-compte']);
assert.equal(targets[0].mode,'strict');
assert.equal(targets[0].assets,'ready');
assert.equal(targets[0].syllableCount,2);
assert.deepEqual(targets[0].therapy,['denomination','lexical-access','phoneme-initial','phoneme-final','phoneme-segmentation','phoneme-blending','syllable-count','syllable-blending','oral-to-written']);
assert.equal(targets[0].generated,true);
assert.equal(targets[2].syllableCount,null);
assert.equal(targets[2].therapy.includes('syllable-count'),false);

console.log('creator-catalog tests passed');
