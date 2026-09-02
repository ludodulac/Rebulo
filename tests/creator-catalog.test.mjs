import assert from 'node:assert/strict';
import {buildCreatorTargets,buildGraphemeCreatorTargets,letterReadingForIPA,mergeCreatorTargets} from '../src/creator-catalog.js';

const report={
  constructible:[
    {word:'merci',ipa:'mɛʁsi',frequency:100,syllableCount:2,decomposition:['mer','scie']},
    {word:'Merci',ipa:'mɛʁsi',frequency:10,syllableCount:2,decomposition:['mer','scie']},
    {word:'cinéma',ipa:'sinema',frequency:50,syllableCount:3,decomposition:['scie','nez','mat']},
    {word:'mer',ipa:'mɛʁ',frequency:200,syllableCount:1,decomposition:['mer']},
    {word:'trop-long',ipa:'abcdef',frequency:1,syllableCount:2,decomposition:['a','b','c','d','e']},
    {word:'cassé',ipa:'',frequency:1,syllableCount:2,decomposition:['a','b']},
    {word:'sans-compte',ipa:'sɑ̃kɔ̃t',frequency:40,syllableCount:null,decomposition:['sans','compte']}
  ],
  missingSounds:[
    {ipa:'te',examples:[
      {word:'cité',ipa:'site',frequency:80,frame:['scie','[te]']},
      {word:'théière',ipa:'tejɛʁ',frequency:20,frame:['[te]','hier']}
    ]},
    {ipa:'ɛʁ',examples:[
      {word:'merci-R',ipa:'mɛʁsiɛʁ',frequency:5,frame:['mer','scie','[ɛʁ]']}
    ]},
    {ipa:'xyz',examples:[{word:'inconnu',ipa:'xyz',frequency:1,frame:['scie','[xyz]']}]}
  ]
};

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

assert.equal(letterReadingForIPA('/te/').grapheme,'T');
assert.equal(letterReadingForIPA('ɛʁ').grapheme,'R');
assert.equal(letterReadingForIPA('/xyz/'),null);

const graphemeTargets=buildGraphemeCreatorTargets(report);
assert.deepEqual(graphemeTargets.map(item=>item.target),['cité','théière','merci-R']);
assert.equal(graphemeTargets[0].mode,'general');
assert.equal(graphemeTargets[0].generated,true);
assert.equal(graphemeTargets[0].source,'coverage-report-grapheme');
assert.deepEqual(graphemeTargets[0].operations,[
  {type:'whole_word',pieceId:'scie'},
  {type:'grapheme',grapheme:'T',reading:'té'}
]);
assert.deepEqual(graphemeTargets[1].operations,[
  {type:'grapheme',grapheme:'T',reading:'té'},
  {type:'whole_word',pieceId:'hier'}
]);
assert.deepEqual(graphemeTargets[2].operations,[
  {type:'whole_word',pieceId:'mer'},
  {type:'whole_word',pieceId:'scie'},
  {type:'grapheme',grapheme:'R',reading:'air'}
]);

const manual=[
  {target:'merci',targetIpa:'/mɛʁsi/',mode:'strict',assets:'ready',therapy:['denomination','syllable-blending','oral-to-written'],manualNote:'keep me'},
  {target:'cinéma',targetIpa:'/different/',mode:'strict',assets:'ready',therapy:['denomination','syllable-blending']},
  {target:'refus',targetIpa:'/mɛʁsi/',mode:'rejected',reason:'manual refusal'},
  {target:'local-only',targetIpa:'/lokal/',mode:'strict',assets:'missing',therapy:['denomination']},
  {target:'cité',targetIpa:'/site/',mode:'general',assets:'ready',operations:[{type:'whole_word',pieceId:'scie'},{type:'grapheme',grapheme:'T',reading:'té'}],manualNote:'manual general wins'}
];
const generated=[
  targets.find(item=>item.target==='merci'),
  targets.find(item=>item.target==='cinéma'),
  {target:'refus',targetIpa:'/mɛʁsi/',syllableCount:2,mode:'strict',assets:'ready',therapy:['syllable-count'],generated:true},
  {target:'generated-only',targetIpa:'/ʒenere/',syllableCount:3,mode:'strict',assets:'ready',therapy:['syllable-count'],generated:true},
  ...graphemeTargets
].filter(Boolean);

const merged=mergeCreatorTargets(manual,generated);
assert.deepEqual(merged.map(item=>item.target),['merci','cinéma','refus','local-only','cité','generated-only','théière','merci-R']);
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
const mergedCite=merged.find(item=>item.target==='cité');
assert.equal(mergedCite.manualNote,'manual general wins');
assert.equal(mergedCite.generated,undefined);

console.log('creator-catalog tests passed');