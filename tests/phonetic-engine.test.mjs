import assert from 'node:assert/strict';
import {
  normalizeIPA,
  concatenateIPA,
  validateStrictRebus,
  segmentTargetWithLexicon
} from '../src/phonetic-engine.js';

assert.equal(normalizeIPA('/mɛʁ.si/'),'mɛʁsi');
assert.equal(concatenateIPA([{ipa:'/mɛʁ/'},{ipa:'/si/'}]),'mɛʁsi');

const merci=validateStrictRebus({
  targetIpa:'/mɛʁsi/',
  pieces:[{ipa:'/mɛʁ/'},{ipa:'/si/'}]
});
assert.equal(merci.ok,true);

const fauxRebus=validateStrictRebus({
  targetIpa:'/ʁebys/',
  pieces:[{ipa:'/ʁi/'},{ipa:'/bys/'}]
});
assert.equal(fauxRebus.ok,false);

const lexicon=[
  {label:'mer',ipa:'/mɛʁ/',active:true},
  {label:'scie',ipa:'/si/',active:true},
  {label:'riz',ipa:'/ʁi/',active:true},
  {label:'bus',ipa:'/bys/',active:true}
];
const decompositions=segmentTargetWithLexicon('/mɛʁsi/',lexicon);
assert.equal(decompositions.length,1);
assert.deepEqual(decompositions[0].map(x=>x.label),['mer','scie']);
assert.equal(segmentTargetWithLexicon('/ʁebys/',lexicon).length,0);

console.log('Rebulo phonetic engine: all strict tests passed.');
