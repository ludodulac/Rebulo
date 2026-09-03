import assert from 'node:assert/strict';
import {buildCreatorCandidate,buildGeneralCreatorCandidate} from '../src/creator-runtime.js';

const lexicon=[
  {id:'mer',label:'mer',ipa:'/mɛʁ/',active:true,image:'assets/rebus/mer.svg'},
  {id:'scie',label:'scie',ipa:'/si/',active:true,image:'assets/rebus/scie.svg'},
  {id:'riz',label:'riz',ipa:'/ʁi/',active:true,image:'assets/rebus/riz.svg'},
  {id:'yoyo',label:'yo-yo',ipa:'/jojo/',active:true,image:'openmoji-yoyo.svg',strictEligible:false}
];
const definitions=[
  {id:'phoneme-blending',label:'Fusion phonémique',unit:'phoneme',description:'Fusionner des phonèmes en un mot.'},
  {id:'syllable-count',label:'Comptage syllabique',unit:'syllable',description:'Compter les syllabes orales d’un mot.'}
];
const target={target:'merci',targetIpa:'/mɛʁsi/',syllableCount:2,mode:'strict',assets:'ready',therapy:['phoneme-blending','syllable-count'],source:'coverage-report',generated:true};

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

const citeTarget={target:'cité',targetIpa:'/site/',mode:'general',assets:'ready',operations:[{type:'whole_word',pieceId:'scie'},{type:'grapheme',grapheme:'T',reading:'té'}]};
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

const sourisTarget={target:'souris',targetIpa:'/suʁi/',mode:'general',assets:'ready',operations:[{type:'spatial_relation',relation:'under'},{type:'whole_word',pieceId:'riz'}]};
const souris=buildGeneralCreatorCandidate(sourisTarget,lexicon);
assert.ok(souris);
assert.equal(souris.answer,'souris');
assert.deepEqual(souris.construction.capabilities,['general']);
assert.deepEqual(souris.pieces.map(piece=>piece.operationType),['spatial_relation','whole_word']);
assert.equal(souris.pieces[0].relation,'under');
assert.equal(souris.pieces[0].reading,'sous');
assert.equal(souris.pieces[1].image,'assets/rebus/riz.svg');
assert.deepEqual(souris.therapyActivities,[]);

const halfYoyoTarget={target:'yo',mode:'general',assets:'ready',operations:[{type:'explicit_deletion',pieceId:'yoyo',keep:'premier yo',remove:'second yo',reading:'yo',visual:'half'}]};
const halfYoyo=buildGeneralCreatorCandidate(halfYoyoTarget,lexicon);
assert.ok(halfYoyo);
assert.equal(halfYoyo.answer,'yo');
assert.deepEqual(halfYoyo.construction.capabilities,['general']);
assert.equal(halfYoyo.construction.operations[0].type,'explicit_deletion');
assert.equal(halfYoyo.pieces[0].operationType,'explicit_deletion');
assert.equal(halfYoyo.pieces[0].sourceReading,'yo-yo');
assert.equal(halfYoyo.pieces[0].reading,'yo');
assert.equal(halfYoyo.pieces[0].visual,'half');
assert.deepEqual(halfYoyo.therapyActivities,[]);

assert.equal(buildGeneralCreatorCandidate({...sourisTarget,operations:[{type:'spatial_relation',relation:'above'},{type:'whole_word',pieceId:'riz'}]},lexicon),null);
assert.equal(buildGeneralCreatorCandidate({...citeTarget,assets:'missing'},lexicon),null);
assert.equal(buildGeneralCreatorCandidate({...citeTarget,operations:[{type:'repetition'}]},lexicon),null);
assert.equal(buildGeneralCreatorCandidate({...citeTarget,operations:[{type:'whole_word',pieceId:'unknown'}]},lexicon),null);
assert.equal(buildGeneralCreatorCandidate({...halfYoyoTarget,operations:[{type:'explicit_deletion',pieceId:'yoyo',keep:'yo',remove:'yo',reading:'yo'}]},lexicon),null);

console.log('Rebulo creator runtime: strict and explicit general operations preserved, including deletion.');
