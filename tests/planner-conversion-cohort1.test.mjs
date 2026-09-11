import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ALL_OPEN_PICTOGRAMS} from '../src/pictogram-print-sheets.js';
import {OPEN_PICTOGRAMS_WAVE_4} from '../src/open-pictogram-library-wave4.js';
import {groupRepresentationsBySound} from '../src/rebus-sound-catalog.js';
import {planRepresentationPaths} from '../src/rebus-representation-paths.js';
import {planPhraseRepresentationPaths} from '../src/rebus-phrase-phonetics.js';
import {normalizeIPA} from '../src/phonetic-engine.js';

const expected=[
  {id:'olive',ipa:'oliv'},
  {id:'aiguille',ipa:'egɥij'},
  {id:'noeud',ipa:'nø'},
  {id:'couteau',ipa:'kuto'}
];

function bankRows(items){
  const representations=(items||[]).map(item=>({
    ...item,
    ipa:normalizeIPA(item.ipa),
    kind:'whole_word_image',
    status:item.active!==false&&item.strictEligible!==false?'active':'general',
    source:'open_pictogram_library'
  }));
  return groupRepresentationsBySound(representations).map(group=>({
    ipa:group.ipa,
    exactImages:group.representations.filter(item=>item.tier==='exact_image_ready').map(item=>({
      id:item.id,label:item.label,image:item.image,source:item.source,
      visualConfidence:item.visualConfidence,labelStability:item.labelStability
    }))
  }));
}

const allById=new Map(ALL_OPEN_PICTOGRAMS.map(item=>[item.id,item]));
for(const target of expected){
  const registered=allById.get(target.id);
  assert.ok(registered,`${target.id} must be present in the registered aggregate library`);
  assert.equal(normalizeIPA(registered.ipa),target.ipa,`${target.id} must keep the exact curated IPA`);
  assert.equal(registered.active,true);
  assert.equal(registered.strictEligible,true);
  assert.equal(registered.clinicalStatus,'unreviewed');
  assert.match(registered.image,/openmoji\/aeb8bb3a59e2de39c754ac79180c8131c906acea\/color\/svg\//);
}

assert.equal(OPEN_PICTOGRAMS_WAVE_4.length,4,'conversion cohort must stay deliberately small');

const currentRows=bankRows(ALL_OPEN_PICTOGRAMS);
const beforeRows=bankRows(ALL_OPEN_PICTOGRAMS.filter(item=>!expected.some(target=>target.id===item.id)));
for(const target of expected){
  const before=planRepresentationPaths(target.ipa,beforeRows,{mode:'strict',allowGaps:false,limit:5});
  assert.equal(before.some(route=>route.operations.some(op=>op.id===target.id)),false,`${target.id} must be genuinely new to the planner`);
  const after=planRepresentationPaths(target.ipa,currentRows,{mode:'strict',allowGaps:false,limit:5});
  const route=after.find(candidate=>candidate.complete&&candidate.exact&&candidate.operations.some(op=>op.id===target.id));
  assert.ok(route,`${target.id} must cross the real registered-library -> planner boundary`);
  assert.equal(route.operations.length,1,`${target.id} should be available as one whole-word piece`);
}

const pronunciationSource=JSON.parse(fs.readFileSync('data/rebus-pronunciation-lexicon.json','utf8'));
const smoke=[
  {phrase:'Il mange une olive',id:'olive'},
  {phrase:'Une aiguille tombe par terre',id:'aiguille'},
  {phrase:'Ce nœud tient la corde',id:'noeud'},
  {phrase:'Le couteau coupe le pain',id:'couteau'}
];
const smokeResults=[];
for(const sample of smoke){
  const before=planPhraseRepresentationPaths(sample.phrase,pronunciationSource,beforeRows,{mode:'general',allowGaps:true,limit:20,maxPieces:16});
  const after=planPhraseRepresentationPaths(sample.phrase,pronunciationSource,currentRows,{mode:'general',allowGaps:true,limit:20,maxPieces:16});
  assert.equal(after.phonetics.complete,true,`phrase pronunciation must resolve: ${sample.phrase}`);
  const appears=after.routes.some(route=>route.operations.some(op=>op.id===sample.id));
  assert.equal(appears,true,`new representation ${sample.id} must appear in a natural phrase route`);
  const beforeBest=before.routes[0]?.scoreBreakdown?.coverageRatio||0;
  const afterBest=after.routes[0]?.scoreBreakdown?.coverageRatio||0;
  assert.ok(afterBest>=beforeBest,`planner coverage must not regress for ${sample.phrase}`);
  smokeResults.push({phrase:sample.phrase,id:sample.id,beforeCoverage:Number(beforeBest.toFixed(4)),afterCoverage:Number(afterBest.toFixed(4)),bestPieceCount:after.routes[0]?.scoreBreakdown?.pieceCount??null,complete:Boolean(after.routes[0]?.complete)});
}

const cohort=JSON.parse(fs.readFileSync('data/rebus-product-conversion-cohort1.json','utf8'));
assert.equal(cohort.summary.newReadyForPlannerCount,4);
assert.equal(cohort.summary.newResearchStimulusCount,0);
assert.ok(cohort.newReadyForPlanner.every(item=>item.spontaneousNamingRisk==='unknown'&&item.humanNamingEvidence==='none'&&item.clinicalEvidence==='none'));

console.log(JSON.stringify({registeredNew:expected.length,smokeResults},null,2));
