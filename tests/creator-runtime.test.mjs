import assert from 'node:assert/strict';
import {buildCreatorCandidate,buildGeneralCreatorCandidate} from '../src/creator-runtime.js';

const lexicon=[
  {id:'mer',label:'mer',ipa:'/mɛʁ/',active:true,image:'assets/rebus/mer.svg'},
  {id:'scie',label:'scie',ipa:'/si/',active:true,image:'assets/rebus/scie.svg'}
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
assert.equal(candidate.construction.mode,'strict');
assert.deepEqual(candidate.construction.operations.map(operation=>operation.type),['whole_word','whole_word']);
assert.deepEqual(candidate.construction.capabilities,['general','phonetic_strict']);

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

const citeTarget={
  target:'cité',
  targetIpa:'/site/',
  mode:'general',
  assets:'ready',
  operations:[
    {type:'whole_word',pieceId:'scie'},
    {type:'grapheme',grapheme:'T',reading:'té'}
  ]
};
const cite=buildGeneralCreatorCandidate(citeTarget,lexicon);
assert.ok(cite);
assert.equal(cite.answer,'cité');
assert.equal(cite.construction.mode,'general');
assert.deepEqual(cite.construction.capabilities,['general']);
assert.deepEqual(cite.pieces.map(piece=>piece.operationType),['whole_word','grapheme']);
assert.equal(cite.pieces[0].image,'assets/rebus/scie.svg');
assert.equal(cite.pieces[1].grapheme,'T');
assert.equal(cite.pieces[1].reading,'té');
assert.deepEqual(cite.therapyActivities,[]);
assert.equal(buildGeneralCreatorCandidate({...citeTarget,assets:'missing'},lexicon),null);
assert.equal(buildGeneralCreatorCandidate({...citeTarget,operations:[{type:'repetition'}]},lexicon),null);
assert.equal(buildGeneralCreatorCandidate({...citeTarget,operations:[{type:'whole_word',pieceId:'unknown'}]},lexicon),null);

console.log('Rebulo creator runtime: strict and general grapheme candidates preserved.');
