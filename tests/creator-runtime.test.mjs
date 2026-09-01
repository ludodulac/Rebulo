import assert from 'node:assert/strict';
import {buildCreatorCandidate} from '../src/creator-runtime.js';

const lexicon=[
  {label:'mer',ipa:'/mɛʁ/',active:true,image:'assets/rebus/mer.svg'},
  {label:'scie',ipa:'/si/',active:true,image:'assets/rebus/scie.svg'}
];
const definitions=[
  {id:'phoneme-blending',label:'Fusion phonémique',unit:'phoneme',description:'Fusionner des phonèmes en un mot.'},
  {id:'syllable-count',label:'Comptage syllabique',unit:'syllable',description:'Compter les syllabes orales d’un mot.'}
];
const target={
  target:'merci',
  targetIpa:'/mɛʁsi/',
  syllableCount:2,
  mode:'strict',
  assets:'ready',
  therapy:['phoneme-blending','syllable-count'],
  source:'coverage-report',
  generated:true
};

const candidate=buildCreatorCandidate(target,lexicon,definitions);
assert.ok(candidate);
assert.equal(candidate.answer,'merci');
assert.equal(candidate.syllableCount,2);
assert.equal(candidate.source,'coverage-report');
assert.equal(candidate.generated,true);
assert.deepEqual(candidate.pieces.map(piece=>piece.reading),['mer','scie']);

const blending=candidate.therapyActivities.find(activity=>activity.id==='phoneme-blending');
assert.ok(blending);
assert.equal(blending.expectedResponse,'mɛʁsi');
assert.deepEqual(blending.promptUnits,['m','ɛ','ʁ','s','i']);

const syllableCount=candidate.therapyActivities.find(activity=>activity.id==='syllable-count');
assert.ok(syllableCount);
assert.equal(syllableCount.expectedResponse,2);

assert.equal(buildCreatorCandidate({...target,mode:'explicit_operation'},lexicon,definitions),null);
assert.equal(buildCreatorCandidate({...target,assets:'missing'},lexicon,definitions),null);
assert.equal(buildCreatorCandidate({...target,targetIpa:''},lexicon,definitions),null);

console.log('Rebulo creator runtime: metadata and activities preserved.');
