import assert from 'node:assert/strict';
import {
  normalizeIPA,
  concatenateIPA,
  validateStrictRebus,
  segmentTargetWithLexicon,
  rankDecompositions
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
  {label:'mer',ipa:'/mɛʁ/',active:true,visualConfidence:0.98,labelStability:0.99},
  {label:'scie',ipa:'/si/',active:true,visualConfidence:0.97,labelStability:0.99},
  {label:'riz',ipa:'/ʁi/',active:true},
  {label:'lit',ipa:'/li/',active:true},
  {label:'bus',ipa:'/bys/',active:true},
  {label:'faux-mer',ipa:'/mɛʁ/',active:false,visualConfidence:1,labelStability:1}
];
const decompositions=segmentTargetWithLexicon('/mɛʁsi/',lexicon);
assert.equal(decompositions.length,1);
assert.deepEqual(decompositions[0].map(x=>x.label),['mer','scie']);
assert.equal(segmentTargetWithLexicon('/ʁebys/',lexicon).length,0);

const pilotExpansion=segmentTargetWithLexicon('/liʁi/',lexicon);
assert.equal(pilotExpansion.length,1);
assert.deepEqual(pilotExpansion[0].map(x=>x.label),['lit','riz']);
assert.equal(validateStrictRebus({targetIpa:'/liʁi/',pieces:pilotExpansion[0]}).ok,true);

const alternatives=rankDecompositions([
  [{label:'a',ipa:'/a/',visualConfidence:0.4,labelStability:0.4},{label:'b',ipa:'/b/',visualConfidence:0.4,labelStability:0.4}],
  [{label:'ab',ipa:'/ab/',visualConfidence:0.99,labelStability:0.99}]
]);
assert.deepEqual(alternatives[0].map(x=>x.label),['ab']);

const tooManyPieces=[
  {label:'a',ipa:'/a/',active:true},
  {label:'b',ipa:'/b/',active:true},
  {label:'c',ipa:'/c/',active:true},
  {label:'d',ipa:'/d/',active:true},
  {label:'e',ipa:'/e/',active:true}
];
assert.equal(segmentTargetWithLexicon('/abcde/',tooManyPieces,4).length,0);

console.log('Rebulo phonetic engine: all strict tests passed.');
