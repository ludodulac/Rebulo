import assert from 'node:assert/strict';
import {
  normalizeIPA,
  splitIPAUnits,
  firstIPAUnit,
  lastIPAUnit,
  concatenateIPA,
  validateStrictRebus,
  segmentTargetWithLexicon,
  decompositionScore,
  rankDecompositions
} from '../src/phonetic-engine.js';

assert.equal(normalizeIPA('/mɛʁ.si/'),'mɛʁsi');
assert.deepEqual(splitIPAUnits('/mɛʁsi/'),['m','ɛ','ʁ','s','i']);
assert.deepEqual(splitIPAUnits('/ɛ̃fɑ̃/'),['ɛ̃','f','ɑ̃']);
assert.equal(firstIPAUnit('/ʃato/'),'ʃ');
assert.equal(firstIPAUnit('/ɛ̃fɑ̃/'),'ɛ̃');
assert.equal(lastIPAUnit('/mɛʁsi/'),'i');
assert.equal(lastIPAUnit('/ɛ̃fɑ̃/'),'ɑ̃');
assert.equal(concatenateIPA([{ipa:'/mɛʁ/'},{ipa:'/si/'}]),'mɛʁsi');

const merci=validateStrictRebus({
  targetIpa:'/mɛʁsi/',
  pieces:[{ipa:'/mɛʁ/'},{ipa:'/si/'}]
});
assert.equal(merci.ok,true);

const cinema=validateStrictRebus({
  targetIpa:'/sinema/',
  pieces:[{ipa:'/si/'},{ipa:'/ne/'},{ipa:'/ma/'}]
});
assert.equal(cinema.ok,true,'a difficult strict solution must still validate when every full pronunciation concatenates exactly');

const fauxRebus=validateStrictRebus({
  targetIpa:'/ʁebys/',
  pieces:[{ipa:'/ʁi/'},{ipa:'/bys/'}]
});
assert.equal(fauxRebus.ok,false,'orthographic resemblance must not replace an exact phonetic match');

assert.equal(validateStrictRebus({
  targetIpa:'/va/',
  pieces:[{label:'vache',ipa:'/vaʃ/'}]
}).ok,false,'strict mode must not hide a final-phoneme deletion');

assert.equal(validateStrictRebus({
  targetIpa:'/lezami/',
  pieces:[{label:'les',ipa:'/le/'},{label:'amis',ipa:'/ami/'}]
}).ok,false,'strict mode must not invent a liaison consonant');

assert.equal(validateStrictRebus({
  targetIpa:'/tuʁnəsɔl/',
  pieces:[{label:'tour',ipa:'/tuʁ/'},{label:'nez',ipa:'/ne/'},{label:'sol',ipa:'/sɔl/'}]
}).ok,false,'historical tournesol near-match must remain rejected');

assert.equal(validateStrictRebus({
  targetIpa:'/piʁamid/',
  pieces:[{label:'pie',ipa:'/pi/'},{label:'rat',ipa:'/ʁa/'},{label:'mie',ipa:'/mi/'},{label:'dé',ipa:'/de/'}]
}).ok,false,'historical pyramide spelling-driven construction must remain rejected');

const lexicon=[
  {label:'mer',ipa:'/mɛʁ/',active:true,visualConfidence:0.98,labelStability:0.99},
  {label:'scie',ipa:'/si/',active:true,visualConfidence:0.97,labelStability:0.99},
  {label:'riz',ipa:'/ʁi/',active:true},
  {label:'lit',ipa:'/li/',active:true},
  {label:'pie',ipa:'/pi/',active:true},
  {label:'tas',ipa:'/ta/',active:true,clinicalStatus:'naming_test_required'},
  {label:'thé',ipa:'/te/',active:false,clinicalStatus:'naming_test_required'},
  {label:'eau',ipa:'/o/',active:false,clinicalStatus:'naming_test_required'},
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

const tapis=segmentTargetWithLexicon('/tapi/',lexicon);
assert.ok(tapis.some(parts=>parts.map(x=>x.label).join('+')==='tas+pie'));
const tasPie=tapis.find(parts=>parts.map(x=>x.label).join('+')==='tas+pie');
assert.equal(validateStrictRebus({targetIpa:'/tapi/',pieces:tasPie}).ok,true);
assert.equal(validateStrictRebus({targetIpa:'/api/',pieces:[{label:'tas',ipa:'/ta/'},{label:'pie',ipa:'/pi/'}]}).ok,false,'tas must contribute its complete /ta/ pronunciation');

assert.equal(segmentTargetWithLexicon('/te/',lexicon).length,0);
assert.equal(segmentTargetWithLexicon('/o/',lexicon).length,0);

const alternatives=rankDecompositions([
  [{label:'a',ipa:'/a/',visualConfidence:0.4,labelStability:0.4},{label:'b',ipa:'/b/',visualConfidence:0.4,labelStability:0.4}],
  [{label:'ab',ipa:'/ab/',visualConfidence:0.99,labelStability:0.99}]
]);
assert.deepEqual(alternatives[0].map(x=>x.label),['ab']);

const twoStrong=[
  {label:'ab',ipa:'/ab/',visualConfidence:0.96,labelStability:0.96},
  {label:'cd',ipa:'/cd/',visualConfidence:0.96,labelStability:0.96}
];
const threeSlightlyStronger=[
  {label:'a',ipa:'/a/',visualConfidence:0.99,labelStability:0.99},
  {label:'bc',ipa:'/bc/',visualConfidence:0.99,labelStability:0.99},
  {label:'d',ipa:'/d/',visualConfidence:0.99,labelStability:0.99}
];
assert.ok(decompositionScore(twoStrong)>decompositionScore(threeSlightlyStronger));
assert.deepEqual(rankDecompositions([threeSlightlyStronger,twoStrong])[0].map(x=>x.label),['ab','cd']);

const longerButClearlyBetter=[
  {label:'a',ipa:'/a/',visualConfidence:1,labelStability:1},
  {label:'bc',ipa:'/bc/',visualConfidence:1,labelStability:1},
  {label:'d',ipa:'/d/',visualConfidence:1,labelStability:1}
];
const shortButWeak=[
  {label:'ab',ipa:'/ab/',visualConfidence:0.6,labelStability:0.6},
  {label:'cd',ipa:'/cd/',visualConfidence:0.6,labelStability:0.6}
];
assert.deepEqual(rankDecompositions([shortButWeak,longerButClearlyBetter])[0].map(x=>x.label),['a','bc','d']);

const tooManyPieces=[
  {label:'a',ipa:'/a/',active:true},
  {label:'b',ipa:'/b/',active:true},
  {label:'c',ipa:'/c/',active:true},
  {label:'d',ipa:'/d/',active:true},
  {label:'e',ipa:'/e/',active:true}
];
assert.equal(segmentTargetWithLexicon('/abcde/',tooManyPieces,4).length,0);

console.log('Rebulo phonetic engine: all strict tests passed.');
