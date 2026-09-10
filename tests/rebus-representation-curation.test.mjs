import assert from 'node:assert/strict';
import {representationCurationCandidates} from '../src/rebus-representation-curation.js';

const audit={queues:{exactWordVisualBacklog:[
  {ipa:'ni',usefulTargetCount:80,usefulWeightedGain:900,schoolTargetCount:4,syllableSpans:[1],usefulExamples:['nidification'],nounWords:[{word:'nid',pos:'NOM',frequency:50,syllableCount:1}],exactWords:[]},
  {ipa:'e',usefulTargetCount:200,usefulWeightedGain:2000,schoolTargetCount:8,syllableSpans:[1],usefulExamples:['école'],nounWords:[],exactWords:[{word:'et',pos:'CON',frequency:5000,syllableCount:1}]},
  {ipa:'bo',usefulTargetCount:40,usefulWeightedGain:500,schoolTargetCount:2,syllableSpans:[1],usefulExamples:['beauté'],nounWords:[{word:'beau',pos:'ADJ',frequency:120,syllableCount:1}],exactWords:[]}
]}};
const curation={entries:[{ipa:'e',candidate:'et',decision:'reject_candidate'}]};
const assets=[
  {id:'nid',label:'nid',ipa:'/ni/',image:'nid.svg',active:true,strictEligible:true},
  {id:'beau-wrong',label:'beau',ipa:'/bu/',image:'beau.svg',active:true,strictEligible:true}
];
const rows=representationCurationCandidates(audit,curation,assets,{limit:10});
assert.equal(rows.length,2);
const nid=rows.find(row=>row.ipa==='ni');
assert.equal(nid.preferredCandidate.visualRoute,'existing_exact_asset');
assert.equal(nid.preferredCandidate.automaticActivation,false);
assert.equal(nid.preferredCandidate.requiresHumanNamingReview,true);
const rejected=rows.find(row=>row.ipa==='e');
assert.equal(rejected,undefined);
const beau=rows.find(row=>row.ipa==='bo');
assert.equal(beau.preferredCandidate.visualRoute,'asset_phonology_conflict');
assert.equal(beau.preferredCandidate.conflictingAssets.length,1);
assert.equal(beau.preferredCandidate.existingExactAssets.length,0);
assert.match(beau.caution,/Exact lexical evidence is not pictogram evidence/);

console.log('rebus-representation-curation.test.mjs: exact lexical backlog is prioritized without automatic visual approval');
