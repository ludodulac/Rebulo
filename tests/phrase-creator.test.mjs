import assert from 'node:assert/strict';
import {PLAYFUL_PHRASES,buildPhrasePlan,isPhraseInput,playfulPhraseAt,tokenizePhrase} from '../src/phrase-creator.js';

assert.equal(isPhraseInput('merci'),false);
assert.equal(isPhraseInput('merci souris'),true);
assert.deepEqual(tokenizePhrase('Merci, souris !').map(token=>token.kind),['word','separator','word','separator']);
assert.equal(playfulPhraseAt(0),'Papa dessine un chat');
assert.ok(PLAYFUL_PHRASES.length>=30,'phrase surprise should have a substantial rotation');
assert.equal(new Set(PLAYFUL_PHRASES).size,PLAYFUL_PHRASES.length,'playful phrases must be unique');
assert.ok(PLAYFUL_PHRASES.every(phrase=>isPhraseInput(phrase)),'every playful entry must be a real phrase');
assert.equal(playfulPhraseAt(PLAYFUL_PHRASES.length),PLAYFUL_PHRASES[0]);

const lexicon=[{id:'mer',label:'mer',ipa:'/mɛʁ/',image:'mer.svg',active:true},{id:'scie',label:'scie',ipa:'/si/',image:'scie.svg',active:true}];
const targets=[{target:'merci',targetIpa:'/mɛʁsi/',mode:'strict',assets:'ready',therapy:[]}];
const plan=buildPhrasePlan('Merci, ami !',targets,lexicon,[]);
assert.equal(plan.wordCount,2);
assert.equal(plan.rebusCount,1);
assert.equal(plan.textCount,1);
assert.equal(plan.complete,false);
assert.equal(plan.tokens.find(token=>token.kind==='rebus')?.candidate.answer,'merci');
assert.equal(plan.tokens.find(token=>token.kind==='text')?.text,'ami');
assert.equal(plan.tokens.filter(token=>token.kind==='separator').map(token=>token.text).join(''),',  !');
const unavailable=buildPhrasePlan('Bonjour tout le monde',[],lexicon,[]);
assert.equal(unavailable.wordCount,4);
assert.equal(unavailable.rebusCount,0);
assert.equal(unavailable.textCount,4);
assert.ok(unavailable.tokens.filter(token=>token.kind==='text').every(token=>token.reason==='not_available'));
console.log('phrase creator planning: ok');
