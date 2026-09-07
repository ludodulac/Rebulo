import assert from 'node:assert/strict';
import {buildPhrasePracticeCatalog,recommendedPhrasePractice,DEFAULT_PHRASE_PRACTICE_POLICY} from '../src/phrase-practice-catalog.js';

assert.equal(DEFAULT_PHRASE_PRACTICE_POLICY.validationStatus,'product_guidance_only');
const lexicon=[
  {id:'chat',label:'chat',ipa:'/ʃa/',image:'chat.svg',active:true},
  {id:'rat',label:'rat',ipa:'/ʁa/',image:'rat.svg',active:true},
  {id:'lit',label:'lit',ipa:'/li/',image:'lit.svg',active:true}
];
const phrases=['chat rat','le chat regarde le rat','bonjour tout le monde'];
const catalog=buildPhrasePracticeCatalog(phrases,[],lexicon,[]);
assert.equal(catalog.length,3);
assert.equal(catalog[0].eligible,true);
assert.equal(catalog[0].phrase,'chat rat');
assert.equal(catalog[0].band,'high_support');
assert.equal(catalog[0].validationStatus,'product_guidance_only');
assert.equal(catalog.at(-1).eligible,false);
assert.equal(recommendedPhrasePractice(catalog,0)?.phrase,'chat rat');
assert.equal(recommendedPhrasePractice(catalog,99)?.eligible,true);
console.log('phrase practice catalog: ranks visually supported phrases before text-heavy phrases without claiming clinical validation');
