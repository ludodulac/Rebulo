import assert from 'node:assert/strict';
import {buildPronunciationLookup,phraseToContinuousIPA,planPhraseRepresentationPaths} from '../src/rebus-phrase-phonetics.js';

const image=(id,label)=>({id,label,image:`${id}.svg`,source:'fixture'});
const row=(ipa,images=[])=>({ipa,exactImageRepresentations:images,letters:[],numbers:[],musicNotes:[],lightApproximations:[]});
const pronunciation={
  rowSchema:['form','ipa','lemma','frequency','pos','source'],
  rows:[
    ['elles','ɛl','elle',900,'PRO','fixture'],['ne','nə','ne',1000,'ADV','fixture'],['sont','sɔ̃','être',1500,'VER','fixture'],['pas','pa','pas',1400,'ADV','fixture'],['cuites','kɥit','cuire',20,'VER','fixture'],['les','le','le',2000,'DET','fixture'],['pâtes','pat','pâte',40,'NOM','fixture'],
    ['papa','papa','papa',100,'NOM','fixture'],['merci','mɛʁsi','merci',100,'INT','fixture'],['inside','pata','inside',1,'NOM','fixture'],['foo','pa','foo',1,'NOM','fixture'],['bar','ta','bar',1,'NOM','fixture'],['cuire','kɥiʁ','cuire',100,'VER','fixture'],['œufs','ø','œuf',100,'NOM','fixture']
  ]
};
const lookup=buildPronunciationLookup(pronunciation);
const phrase=phraseToContinuousIPA('Elles ne sont pas cuites les pâtes',lookup);
assert.equal(phrase.complete,true);
assert.equal(phrase.continuousIpa,'ɛlnəsɔ̃pakɥitlepat');
assert.equal(phrase.words[4].unitStart,phrase.words[3].unitEnd);

const bankRows=[
  row('pi',[image('pie','pie')]),row('li',[image('lit','lit')]),row('pa',[image('pas','pas')]),row('mɛʁ',[image('mer','mer')]),row('si',[image('scie','scie')]),
  row('ɛl',[image('aile','aile')]),row('nə',[image('noeud','nœud')]),row('sɔ̃',[image('son','son')]),row('pakɥit',[image('cross','route croisée')]),row('le',[image('les','lé')]),row('pat',[image('patte','patte')]),
  {ipa:'kɥi',exactImageRepresentations:[{id:'cui-editorial',label:'cui',image:null,source:'editorial-only'}],letters:[],numbers:[],musicNotes:[],lightApproximations:[]},
  {ipa:'ɛl',exactImageRepresentations:[],letters:['L'],numbers:[],musicNotes:[],lightApproximations:[]},
  {ipa:'le',exactImageRepresentations:[],letters:[],numbers:[],musicNotes:[],lightApproximations:[{word:'lait',sourceIpa:'lɛ',tier:'light',percent:15,existingAsset:true,image:'lait.svg'}]}
];

// A+B: pili is absent from the pronunciation fixture and from any target catalog. Existing sound-query rules resolve it to /pili/, then active pieces compose it.
assert.equal(lookup.has('pili'),false);
const piliPhonetics=phraseToContinuousIPA('pili',lookup);
assert.equal(piliPhonetics.complete,true);
assert.equal(piliPhonetics.continuousIpa,'pili');
assert.equal(piliPhonetics.words[0].pronunciationMethod,'orthographic_sound_fallback');
const pili=planPhraseRepresentationPaths('pili',lookup,bankRows,{mode:'strict',limit:5,allowGaps:true});
assert.equal(pili.status,'routes_found');
assert.deepEqual(pili.routes[0].operations.filter(item=>item.kind!=='gap').map(item=>item.label),['pie','lit']);
assert.equal(pili.routes[0].complete,true);
const papa=planPhraseRepresentationPaths('papa',lookup,bankRows,{mode:'strict',limit:5,allowGaps:true});
assert.deepEqual(papa.routes[0].operations.map(item=>item.label),['pas','pas']);
const merci=planPhraseRepresentationPaths('merci',lookup,bankRows,{mode:'strict',limit:5,allowGaps:true});
assert.deepEqual(merci.routes[0].operations.map(item=>item.label),['mer','scie']);

// C: a representation can cover an internal fragment of one word.
const internalBank=[row('p',[image('p-piece','P sound')]),row('at',[image('at-piece','AT')]),row('a',[image('a-piece','A')])];
const internal=planPhraseRepresentationPaths('inside',lookup,internalBank,{mode:'strict',limit:3,allowGaps:false});
const internalAt=internal.routes[0].operations.find(item=>item.id==='at-piece');
assert.ok(internalAt);assert.equal(internalAt.crossesWordBoundary,false);assert.equal(internalAt.unitStart,1);assert.equal(internalAt.unitEnd,3);

// D+E: exact continuous matching may cross a lexical boundary and must retain metadata.
const crossing=planPhraseRepresentationPaths('foo bar',lookup,internalBank,{mode:'strict',limit:3,allowGaps:false});
const crossingAt=crossing.routes[0].operations.find(item=>item.id==='at-piece');
assert.ok(crossingAt);assert.equal(crossingAt.crossesWordBoundary,true);assert.deepEqual(crossingAt.sourceWords.map(item=>item.text),['foo','bar']);assert.equal(crossing.routes[0].crossWordOperationCount,1);

// F: missing coverage remains explicit; unresolved words do not erase usable resolved spans.
const partial=planPhraseRepresentationPaths('pili xyz papa',lookup,bankRows,{mode:'strict',limit:3,allowGaps:true});
assert.equal(partial.status,'partial_phrase_pronunciation');
assert.equal(partial.routes[0].complete,false);
assert.ok(partial.routes[0].operations.some(item=>item.kind==='unresolved_word'&&item.text==='xyz'));
assert.deepEqual(partial.routes[0].operations.filter(item=>item.kind==='image').map(item=>item.label),['pie','lit','pas','pas']);
const uncovered=planPhraseRepresentationPaths('cuire',lookup,bankRows,{mode:'strict',limit:3,allowGaps:true});
assert.ok(uncovered.routes[0].operations.some(item=>item.kind==='gap'));

// G: an editorial idea with no active image is never promoted by the planner.
assert.equal(uncovered.routes[0].operations.some(item=>item.id==='cui-editorial'),false);

// H: conventions and approximations remain qualified rather than flattened.
const conventionOnly=[{ipa:'ɛl',exactImageRepresentations:[],letters:['L'],numbers:[],musicNotes:[],lightApproximations:[]}];
const conventionGeneral=planPhraseRepresentationPaths('elles',lookup,conventionOnly,{mode:'general',limit:3,allowGaps:true});
assert.equal(conventionGeneral.routes[0].operations[0].phoneticTier,'exact_convention');
const conventionStrict=planPhraseRepresentationPaths('elles',lookup,conventionOnly,{mode:'strict',limit:3,allowGaps:true});
assert.equal(conventionStrict.routes[0].complete,false);
const approximateOnly=[{ipa:'le',exactImageRepresentations:[],letters:[],numbers:[],musicNotes:[],lightApproximations:[{word:'lait',sourceIpa:'lɛ',tier:'light',percent:15,existingAsset:true,image:'lait.svg'}]}];
const approximateGeneral=planPhraseRepresentationPaths('les',lookup,approximateOnly,{mode:'general',limit:3,allowGaps:true});
assert.equal(approximateGeneral.routes[0].operations[0].phoneticTier,'light_approximation');
assert.equal(approximateGeneral.routes[0].operations[0].sourceIpa,'lɛ');
const approximateStrict=planPhraseRepresentationPaths('les',lookup,approximateOnly,{mode:'strict',limit:3,allowGaps:true});
assert.equal(approximateStrict.routes[0].complete,false);

// Existing controlled cross-boundary fixture remains valid.
const planned=planPhraseRepresentationPaths('Elles ne sont pas cuites les pâtes',lookup,bankRows,{mode:'strict',limit:5,allowGaps:false});
assert.equal(planned.routes[0].complete,true);
const cross=planned.routes[0].operations.find(item=>item.id==='cross');
assert.ok(cross);assert.equal(cross.crossesWordBoundary,true);assert.deepEqual(cross.sourceWords.map(item=>item.text),['pas','cuites']);

console.log('rebus-phrase-phonetics.test.mjs: lexical + existing orthographic sound resolution, internal fragments, cross-word metadata, honest gaps and runtime qualification are protected');
