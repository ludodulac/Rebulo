import assert from 'node:assert/strict';
import {
  buildAutomaticCreatorTargets,
  buildCreatorTargets,
  buildGraphemeCreatorTargets,
  buildSpatialCreatorTargets,
  creatorTargetScore,
  creatorTargetSignature,
  letterReadingForIPA,
  mergeCreatorTargets,
  rankCreatorTargets,
  selectBestGeneratedTargets,
  spatialRelationForIPA
} from '../src/creator-catalog.js';

const report={
  constructible:[
    {word:'merci',ipa:'mɛʁsi',frequency:100,syllableCount:2,decomposition:['mer','scie']},
    {word:'Merci',ipa:'mɛʁsi',frequency:10,syllableCount:2,decomposition:['mer','scie']},
    {word:'cinéma',ipa:'sinema',frequency:50,syllableCount:3,decomposition:['scie','nez','mat']},
    {word:'mer',ipa:'mɛʁ',frequency:200,syllableCount:1,decomposition:['mer']},
    {word:'trop-long',ipa:'abcdef',frequency:1,syllableCount:2,decomposition:['a','b','c','d','e']},
    {word:'cassé',ipa:'',frequency:1,syllableCount:2,decomposition:['a','b']},
    {word:'sans-compte',ipa:'sɑ̃kɔ̃t',frequency:40,syllableCount:null,decomposition:['sans','compte']},
    {word:'mixte',ipa:'site',frequency:5,syllableCount:2,decomposition:['scie','the']}
  ],
  missingSounds:[
    {ipa:'te',examples:[
      {word:'cité',ipa:'site',frequency:80,frame:['scie','[te]']},
      {word:'théière',ipa:'tejɛʁ',frequency:20,frame:['[te]','hier']},
      {word:'mixte',ipa:'site',frequency:500,frame:['scie','[te]']}
    ]},
    {ipa:'su',examples:[
      {word:'souris',ipa:'suʁi',frequency:60,frame:['[su]','riz']},
      {word:'sous-lit',ipa:'suli',frequency:5,frame:['[su]','lit']}
    ]},
    {ipa:'ɛʁ',examples:[
      {word:'merci-R',ipa:'mɛʁsiɛʁ',frequency:5,frame:['mer','scie','[ɛʁ]']}
    ]},
    {ipa:'xyz',examples:[{word:'inconnu',ipa:'xyz',frequency:1,frame:['scie','[xyz]']}]}
  ]
};

const targets=buildCreatorTargets(report);
assert.equal(targets.length,4);
assert.deepEqual(targets.map(item=>item.target),['merci','cinéma','sans-compte','mixte']);
assert.equal(targets[0].mode,'strict');
assert.equal(targets[0].assets,'ready');
assert.equal(targets[0].syllableCount,2);
assert.deepEqual(targets[0].therapy,['denomination','lexical-access','phoneme-initial','phoneme-final','phoneme-segmentation','phoneme-blending','syllable-count','syllable-blending','oral-to-written']);
assert.equal(targets[0].generated,true);
assert.equal(targets[0].operationCount,2);
assert.equal(targets[2].syllableCount,null);
assert.equal(targets[2].therapy.includes('syllable-count'),false);

assert.equal(letterReadingForIPA('/te/').grapheme,'T');
assert.equal(letterReadingForIPA('ɛʁ').grapheme,'R');
assert.equal(letterReadingForIPA('/xyz/'),null);
assert.equal(spatialRelationForIPA('/su/').relation,'under');
assert.equal(spatialRelationForIPA('xyz'),null);

const graphemeTargets=buildGraphemeCreatorTargets(report);
assert.deepEqual(graphemeTargets.map(item=>item.target),['cité','théière','mixte','merci-R']);
assert.equal(graphemeTargets[0].mode,'general');
assert.equal(graphemeTargets[0].source,'coverage-report-grapheme');
assert.deepEqual(graphemeTargets[0].operations,[
  {type:'whole_word',pieceId:'scie'},
  {type:'grapheme',grapheme:'T',reading:'té'}
]);

const spatialTargets=buildSpatialCreatorTargets(report);
assert.deepEqual(spatialTargets.map(item=>item.target),['souris','sous-lit']);
assert.equal(spatialTargets[0].source,'coverage-report-spatial');
assert.deepEqual(spatialTargets[0].operations,[
  {type:'spatial_relation',relation:'under',reading:'sous'},
  {type:'whole_word',pieceId:'riz'}
]);
assert.equal(spatialTargets[0].mode,'general');
assert.equal(spatialTargets[0].generated,true);
assert.equal(spatialTargets[0].operationCount,2);

const ranked=rankCreatorTargets([
  {target:'x',mode:'general',frequency:1000,operationCount:2},
  {target:'x',mode:'strict',frequency:1,operationCount:4},
  {target:'x',mode:'general',frequency:10,operationCount:3}
]);
assert.equal(ranked[0].mode,'strict','strict candidates must remain first');
assert.ok(creatorTargetScore(ranked[0])>creatorTargetScore(ranked[1]));

const best=selectBestGeneratedTargets([...targets,...graphemeTargets,...spatialTargets]);
const bestMixte=best.find(item=>item.target==='mixte');
assert.equal(bestMixte.mode,'strict','strict must beat a more frequent grapheme candidate for the same word');
assert.equal(bestMixte.alternatives.length,1);
assert.equal(bestMixte.alternatives[0].mode,'general');
assert.notEqual(creatorTargetSignature(spatialTargets[0]),creatorTargetSignature(graphemeTargets[0]));

const automatic=buildAutomaticCreatorTargets(report);
assert.equal(automatic.find(item=>item.target==='mixte').mode,'strict');
assert.ok(automatic.some(item=>item.target==='cité'&&item.mode==='general'));
assert.ok(automatic.some(item=>item.target==='souris'&&item.source==='coverage-report-spatial'));

const manual=[
  {target:'merci',targetIpa:'/mɛʁsi/',mode:'strict',assets:'ready',therapy:['denomination','syllable-blending','oral-to-written'],manualNote:'keep me'},
  {target:'cinéma',targetIpa:'/different/',mode:'strict',assets:'ready',therapy:['denomination','syllable-blending']},
  {target:'refus',targetIpa:'/mɛʁsi/',mode:'rejected',reason:'manual refusal'},
  {target:'local-only',targetIpa:'/lokal/',mode:'strict',assets:'missing',therapy:['denomination']},
  {target:'cité',targetIpa:'/site/',mode:'general',assets:'ready',operations:[{type:'whole_word',pieceId:'scie'},{type:'grapheme',grapheme:'T',reading:'té'}],manualNote:'manual general wins'},
  {target:'souris',targetIpa:'/suʁi/',mode:'general',assets:'ready',operations:[{type:'spatial_relation',relation:'under',reading:'sous'},{type:'whole_word',pieceId:'riz'}],manualNote:'manual spatial wins'},
  {target:'mixte',targetIpa:'/site/',mode:'strict',assets:'ready',therapy:['denomination'],manualNote:'manual primary wins'}
];
const generated=[
  targets.find(item=>item.target==='merci'),
  targets.find(item=>item.target==='cinéma'),
  {target:'refus',targetIpa:'/mɛʁsi/',syllableCount:2,mode:'strict',assets:'ready',therapy:['syllable-count'],generated:true},
  {target:'generated-only',targetIpa:'/ʒenere/',syllableCount:3,mode:'strict',assets:'ready',therapy:['syllable-count'],generated:true},
  ...graphemeTargets,
  ...spatialTargets,
  targets.find(item=>item.target==='mixte')
].filter(Boolean);

const merged=mergeCreatorTargets(manual,generated);
const mergedRefus=merged.find(item=>item.target==='refus');
assert.equal(mergedRefus.mode,'rejected');
assert.equal(mergedRefus.alternatives,undefined);
const mergedCite=merged.find(item=>item.target==='cité');
assert.equal(mergedCite.manualNote,'manual general wins');
assert.equal(mergedCite.alternatives,undefined,'identical generated construction must be deduplicated');
const mergedSouris=merged.find(item=>item.target==='souris');
assert.equal(mergedSouris.manualNote,'manual spatial wins');
assert.equal(mergedSouris.alternatives,undefined,'identical spatial generation must not duplicate the manual pilot');
const mergedMixte=merged.find(item=>item.target==='mixte');
assert.equal(mergedMixte.manualNote,'manual primary wins');
assert.equal(mergedMixte.alternatives.length,1);
assert.equal(mergedMixte.alternatives[0].mode,'general');
assert.ok(merged.some(item=>item.target==='sous-lit'&&item.source==='coverage-report-spatial'));

console.log('creator-catalog tests passed');