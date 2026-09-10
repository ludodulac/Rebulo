import assert from 'node:assert/strict';
import {buildKnownAssetIndex,classifyExpansionRow,buildRepresentationExpansionQueue,summarizeExpansionQueue} from '../src/rebus-representation-expansion.js';

const assetIndex=buildKnownAssetIndex({
  seed:[{id:'nid',label:'nid',ipa:'/ni/',image:'nid.svg',active:true,clinicalStatus:'unreviewed'}],
  openLibraries:[[{id:'compas',label:'compas',ipa:'/kɔ̃pa/',image:'compas.svg',active:true,strictEligible:true,clinicalStatus:'unreviewed'}]],
  researchAssets:[{path:'assets/research/boue-study.svg',inferredLabel:'boue'}]
});

const base={usefulTargetCount:20,usefulWeightedGain:50,schoolTargetCount:2,usefulExamples:['exemple']};
const nid=classifyExpansionRow({...base,ipa:'ni',syllableSpans:[1],exactCandidateCount:2,exactCandidates:[
  {word:'nid',proofStatus:'lexical_exact_only',visualPotential:'unknown',namingRisk:'unknown'},
  {word:'nie',proofStatus:'lexical_exact_only',visualPotential:'unknown',namingRisk:'unknown'}
],visibleConventions:[],approximateCandidates:[]},assetIndex);
assert.equal(nid.lane,'asset_existing_to_review');
assert.equal(nid.phoneticAssetCandidateCount,1);
assert.equal(nid.multipleExactHomophones,true,'several homophones remain visible even when one already has an asset');
assert.equal(nid.proofStatus.spontaneousNamability,'unknown_unless_human_observation_exists');
assert.equal(nid.proofStatus.orthophonicValidation,'none');

const letter=classifyExpansionRow({...base,ipa:'a',syllableSpans:[1],exactCandidateCount:1,exactCandidates:[{word:'ha',proofStatus:'visual_route_rejected',visualPotential:'very_low',namingRisk:'very_high'}],visibleConventions:[{kind:'letter',label:'A'}],approximateCandidates:[]},new Map());
assert.equal(letter.lane,'visible_convention_preferable');
assert.equal(letter.automaticActivation,false);

const long=classifyExpansionRow({...base,ipa:'kɔ̃pa',syllableSpans:[2],exactCandidateCount:2,exactCandidates:[{word:'compas',proofStatus:'lexical_exact_only',visualPotential:'unknown',namingRisk:'unknown'},{word:'compât',proofStatus:'lexical_exact_only',visualPotential:'unknown',namingRisk:'unknown'}],visibleConventions:[],approximateCandidates:[]},assetIndex);
assert.equal(long.twoSyllableFirstClass,true);
assert.equal(long.lane,'asset_existing_to_review');

const approximate=classifyExpansionRow({...base,ipa:'le',syllableSpans:[1],exactCandidateCount:1,exactCandidates:[{word:'les',proofStatus:'visual_route_rejected',visualPotential:'very_low',namingRisk:'very_high'}],visibleConventions:[],approximateCandidates:[{word:'lait',sourceIpa:'lɛ',targetIpa:'le',proofStatus:'general_rebus_approximation_only',strictEligible:false}]},new Map());
assert.equal(approximate.lane,'approximation_only_after_rejected_exacts');
assert.equal(approximate.approximateCandidates[0].strictEligible,false);

const unknown=classifyExpansionRow({...base,ipa:'xyz',syllableSpans:[1],exactCandidateCount:1,exactCandidates:[{word:'objet',proofStatus:'lexical_exact_only',visualPotential:'unknown',namingRisk:'unknown'}],visibleConventions:[],approximateCandidates:[]},new Map());
assert.equal(unknown.lane,'exact_image_candidate_precheck');
assert.equal(unknown.likelyNeedsNewAsset,true);
assert.equal(unknown.informationInsufficient,true,'a plausible lexical route can still have insufficient visual evidence');

const rows=[];
for(let i=0;i<8;i++)rows.push({...base,ipa:`s${i}`,syllableSpans:[1],usefulTargetCount:100-i,exactCandidateCount:1,exactCandidates:[{word:`mot${i}`,proofStatus:'lexical_exact_only'}],visibleConventions:[],approximateCandidates:[]});
for(let i=0;i<4;i++)rows.push({...base,ipa:`long${i}`,syllableSpans:[2],usefulTargetCount:10-i,exactCandidateCount:1,exactCandidates:[{word:`longmot${i}`,proofStatus:'lexical_exact_only'}],visibleConventions:[],approximateCandidates:[]});
const queue=buildRepresentationExpansionQueue(rows,new Map(),{globalLimit:3,twoSyllableReserve:2});
assert.equal(queue.length,5);
assert.equal(queue.filter(row=>row.twoSyllableFirstClass).length,2,'two-syllable reserve survives even when shorter sounds dominate raw yield');
const stats=summarizeExpansionQueue(queue);
assert.equal(stats.soundCount,5);
assert.equal(stats.twoSyllableSoundCount,2);
console.log('rebus representation expansion queue: ok');
