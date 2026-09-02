import assert from 'node:assert/strict';
import {rankMissingWholeWordOpportunities} from '../src/productivity-opportunities.js';

const inventory=[
  {id:'chat',label:'chat',ipa:'ʃa',image:'chat.svg',active:true,strictEligible:true},
  {id:'lit',label:'lit',ipa:'li',image:'lit.svg',active:true,strictEligible:true},
  {id:'velo',label:'vélo',ipa:'velo',image:'velo.svg',active:true,strictEligible:true},
  {id:'inactive',label:'pot',ipa:'po',image:'pot.svg',active:false,strictEligible:true}
];
const lexicon=[
  {word:'pot',ipa:'po',frequency:20},
  {word:'chapeau',ipa:'ʃapo',frequency:40},
  {word:'poli',ipa:'poli',frequency:30},
  {word:'dos',ipa:'do',frequency:15},
  {word:'doli',ipa:'doli',frequency:10},
  {word:'vé',ipa:'ve',frequency:99},
  {word:'lolo',ipa:'lolo',frequency:5}
];

const ranked=rankMissingWholeWordOpportunities(inventory,lexicon,{limit:20});
const pot=ranked.find(x=>x.ipa==='po');
assert.ok(pot,'inactive pot remains a missing activation opportunity');
assert.equal(pot.targetCount,2);
assert.ok(pot.examples.some(x=>x.word==='chapeau'));
assert.ok(pot.examples.some(x=>x.word==='poli'));
assert.equal(pot.namingCandidates[0].word,'pot');

const dos=ranked.find(x=>x.ipa==='do');
assert.ok(dos);
assert.equal(dos.targetCount,1);

assert.equal(ranked.some(x=>x.ipa==='ve'),false,'vélo /velo/ must never be split to manufacture /ve/ from the pictogram');
assert.equal(ranked.some(x=>x.ipa==='lo'),false,'vélo /velo/ must never manufacture /lo/');
assert.ok(ranked.every(x=>x.targetCount>0));
console.log('productivity opportunities tests: OK');
