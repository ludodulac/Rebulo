import assert from 'node:assert/strict';
import {PLAYFUL_PHRASES,buildPhrasePlan,isPhraseInput,playfulPhraseAt,tokenizePhrase} from '../src/phrase-creator.js';

assert.equal(isPhraseInput('merci'),false);
assert.equal(isPhraseInput('merci souris'),true);
assert.deepEqual(tokenizePhrase('Merci, souris !').map(token=>token.kind),['word','separator','word','separator']);
assert.equal(playfulPhraseAt(0),'Papa dessine un chat');
assert.ok(PLAYFUL_PHRASES.length>=30);
assert.equal(new Set(PLAYFUL_PHRASES).size,PLAYFUL_PHRASES.length);
assert.ok(PLAYFUL_PHRASES.every(phrase=>isPhraseInput(phrase)));

const lexicon=[
  {id:'mer',label:'mer',ipa:'/mɛʁ/',image:'mer.svg',active:true},
  {id:'scie',label:'scie',ipa:'/si/',image:'scie.svg',active:true},
  {id:'chat',label:'chat',ipa:'/ʃa/',image:'chat.svg',active:true}
];
const targets=[{target:'merci',targetIpa:'/mɛʁsi/',mode:'strict',assets:'ready',therapy:[]}];
const plan=buildPhrasePlan('Merci, ami !',targets,lexicon,[]);
assert.equal(plan.wordCount,2);assert.equal(plan.rebusCount,1);assert.equal(plan.textCount,1);assert.equal(plan.complete,false);
assert.equal(plan.tokens.find(token=>token.kind==='rebus')?.candidate.answer,'merci');

const direct=buildPhrasePlan('un chat',targets,lexicon,[]);
assert.equal(direct.wordCount,2);
assert.equal(direct.rebusCount,2);
assert.equal(direct.textCount,0);
assert.equal(direct.complete,true);
assert.equal(direct.conventionCount,1);
assert.equal(direct.tokens.find(token=>token.kind==='symbol')?.symbol,'1');
const chat=direct.tokens.find(token=>token.kind==='rebus');
assert.equal(chat?.candidate.answer,'chat');
assert.equal(chat?.candidate.pieces[0].image,'chat.svg');
assert.equal(chat?.candidate.construction.source,'direct_pictogram');

const unavailable=buildPhrasePlan('Bonjour tout le monde',[],lexicon,[]);
assert.equal(unavailable.wordCount,4);assert.equal(unavailable.rebusCount,0);assert.equal(unavailable.textCount,4);
console.log('phrase creator planning: ok');
