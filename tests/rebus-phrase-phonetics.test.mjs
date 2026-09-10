import assert from 'node:assert/strict';
import {buildPronunciationLookup,phraseToContinuousIPA,planPhraseRepresentationPaths} from '../src/rebus-phrase-phonetics.js';

const pronunciation={
  rowSchema:['form','ipa','lemma','frequency','pos','source'],
  rows:[
    ['elles','ɛl','elle',900,'PRO','Lexique 4'],
    ['ne','nə','ne',1000,'ADV','Lexique 4'],
    ['sont','sɔ̃','être',1500,'VER','Lexique 4'],
    ['pas','pa','pas',1400,'ADV','Lexique 4'],
    ['cuites','kɥit','cuire',20,'VER','Lexique 4'],
    ['les','le','le',2000,'DET','Lexique 4'],
    ['pâtes','pat','pâte',40,'NOM','Lexique 4']
  ]
};
const lookup=buildPronunciationLookup(pronunciation);
const phrase=phraseToContinuousIPA('Elles ne sont pas cuites les pâtes',lookup);
assert.equal(phrase.complete,true);
assert.equal(phrase.continuousIpa,'ɛlnəsɔ̃pakɥitlepat');
assert.equal(phrase.wordCount,7);
assert.equal(phrase.unresolvedWords.length,0);
assert.equal(phrase.words[3].text,'pas');
assert.equal(phrase.words[4].text,'cuites');
assert.equal(phrase.words[4].unitStart,phrase.words[3].unitEnd);

const bankRows=[
  {ipa:'ɛl',exactImageRepresentations:[{id:'aile',label:'aile',image:'aile.svg',source:'fixture'}],letters:[],numbers:[],musicNotes:[],lightApproximations:[]},
  {ipa:'nə',exactImageRepresentations:[{id:'noeud',label:'nœud',image:'noeud.svg',source:'fixture'}],letters:[],numbers:[],musicNotes:[],lightApproximations:[]},
  {ipa:'sɔ̃',exactImageRepresentations:[{id:'son',label:'son',image:'son.svg',source:'fixture'}],letters:[],numbers:[],musicNotes:[],lightApproximations:[]},
  {ipa:'pakɥit',exactImageRepresentations:[{id:'cross',label:'route croisée',image:'cross.svg',source:'fixture'}],letters:[],numbers:[],musicNotes:[],lightApproximations:[]},
  {ipa:'le',exactImageRepresentations:[{id:'les',label:'lé',image:'le.svg',source:'fixture'}],letters:[],numbers:[],musicNotes:[],lightApproximations:[]},
  {ipa:'pat',exactImageRepresentations:[{id:'patte',label:'patte',image:'patte.svg',source:'fixture'}],letters:[],numbers:[],musicNotes:[],lightApproximations:[]}
];
const planned=planPhraseRepresentationPaths('Elles ne sont pas cuites les pâtes',pronunciation,bankRows,{mode:'strict',limit:5,allowGaps:false});
assert.equal(planned.status,'routes_found');
assert.equal(planned.routes[0].complete,true);
const cross=planned.routes[0].operations.find(item=>item.id==='cross');
assert.ok(cross);
assert.equal(cross.crossesWordBoundary,true);
assert.deepEqual(cross.sourceWords.map(item=>item.text),['pas','cuites']);

const unresolved=planPhraseRepresentationPaths('Elles xyz sont',pronunciation,bankRows,{mode:'general'});
assert.equal(unresolved.status,'unresolved_phrase_pronunciation');
assert.deepEqual(unresolved.phonetics.unresolvedWords,['xyz']);
assert.equal(unresolved.routes.length,0);

console.log('rebus-phrase-phonetics.test.mjs: phrase lexical IPA stays explicit while representation search may cross word boundaries');
