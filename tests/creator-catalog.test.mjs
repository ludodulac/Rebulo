import assert from 'node:assert/strict';
import {buildCreatorTargets,mergeCreatorTargets} from '../src/creator-catalog.js';

const report={constructible:[
  {word:'merci',ipa:'mɛʁsi',frequency:100,syllableCount:2,decomposition:['mer','scie']},
  {word:'Merci',ipa:'mɛʁsi',frequency:10,syllableCount:2,decomposition:['mer','scie']},
  {word:'cinéma',ipa:'sinema',frequency:50,syllableCount:3,decomposition:['scie','nez','mat']},
  {word:'mer',ipa:'mɛʁ',frequency:200,syllableCount:1,decomposition:['mer']},
  {word:'trop-long',ipa:'abcdef',frequency:1,syllableCount:2,decomposition:['a','b','c','d','e']},
  {word:'cassé',ipa:'',frequency:1,syllableCount:2,decomposition:['a','b']},
  {word:'sans-compte',ipa:'sɑ̃kɔ̃t',frequency:40,syllableCount:null,decomposition:['sans','compte']}
]};

const targets=buildCreatorTargets(report);
assert.equal(targets.length,3);
assert.deepEqual(targets.map(item=>item.target),['merci','cinéma','sans-compte']);
assert.equal(targets[0].mode,'strict');
assert.equal(targets[0].assets,'ready');
assert.equal(targets[0].syllableCount,2);
assert.deepEqual(targets[0].therapy,['denomination','lexical-access','phoneme-initial','phoneme-final','phoneme-segmentation','phoneme-blending','syllable-count','syllable-blending','oral-to-written']);
assert.equal(targets[0].generated,true);
assert.equal(targets[2].syllableCount,null);
assert.equal(targets[2].therapy.includes('syllable-count'),false);

const manual=[
  {target:'merci',targetIpa:'/mɛʁsi/',mode:'strict',assets:'ready',therapy:['denomination','syllable-blending','oral-to-written'],manualNote:'keep me'},
  {target:'cinéma',targetIpa:'/different/',mode:'strict',assets:'ready',therapy:['denomination','syllable-blending']},
  {target:'refus',targetIpa:'/mɛʁsi/',mode:'rejected',reason:'manual refusal'},
  {target:'local-only',targetIpa:'/lokal/',mode:'strict',assets:'missing',therapy:['denomination']}
];
const generated=[
  targets.find(item=>item.target==='merci'),
  targets.find(item=>item.target==='cinéma'),
  {target:'refus',targetIpa:'/mɛʁsi/',syllableCount:2,mode:'strict',assets:'ready',therapy:['syllable-count'],generated:true},
  {target:'generated-only',targetIpa:'/ʒenere/',syllableCount:3,mode:'strict',assets:'ready',therapy:['syllable-count'],generated:true}
].filter(Boolean);

const merged=mergeCreatorTargets(manual,generated);
assert.deepEqual(merged.map(item=>item.target),['merci','cinéma','refus','local-only','generated-only']);
const mergedMerci=merged.find(item=>item.target==='merci');
assert.equal(mergedMerci.syllableCount,2);
assert.deepEqual(mergedMerci.therapy,['denomination','syllable-count','syllable-blending','oral-to-written']);
assert.equal(mergedMerci.manualNote,'keep me');
assert.equal(mergedMerci.generated,undefined);
const mergedCinema=merged.find(item=>item.target==='cinéma');
assert.equal(mergedCinema.syllableCount,undefined);
assert.equal(mergedCinema.therapy.includes('syllable-count'),false);
const mergedRefus=merged.find(item=>item.target==='refus');
assert.equal(mergedRefus.mode,'rejected');
assert.equal(mergedRefus.reason,'manual refusal');
assert.equal(mergedRefus.syllableCount,undefined);
assert.equal(merged.filter(item=>item.target==='refus').length,1);

console.log('creator-catalog tests passed');