import assert from 'node:assert/strict';
import {buildCreatorTargets} from '../src/creator-catalog.js';

const report={constructible:[
  {word:'merci',ipa:'mɛʁsi',frequency:100,decomposition:['mer','scie']},
  {word:'Merci',ipa:'mɛʁsi',frequency:10,decomposition:['mer','scie']},
  {word:'cinéma',ipa:'sinema',frequency:50,decomposition:['scie','nez','mat']},
  {word:'mer',ipa:'mɛʁ',frequency:200,decomposition:['mer']},
  {word:'trop-long',ipa:'abcdef',frequency:1,decomposition:['a','b','c','d','e']},
  {word:'cassé',ipa:'',frequency:1,decomposition:['a','b']}
]};

const targets=buildCreatorTargets(report);
assert.equal(targets.length,2);
assert.deepEqual(targets.map(item=>item.target),['merci','cinéma']);
assert.equal(targets[0].mode,'strict');
assert.equal(targets[0].assets,'ready');
assert.deepEqual(targets[0].therapy,['denomination','syllable-blending','oral-to-written']);
assert.equal(targets[0].generated,true);

console.log('creator-catalog tests passed');
