import assert from 'node:assert/strict';
import {representationCurationCandidates} from '../src/rebus-representation-curation.js';

const audit={
  usefulRows:[
    {ipa:'ni',usefulTargetCount:80,usefulWeightedGain:900,schoolTargetCount:4,syllableSpans:[1],usefulExamples:['nidification'],nounWords:[{word:'nid',pos:'NOM',frequency:50,syllableCount:1}],exactWords:[]}
  ],
  queues:{exactWordVisualBacklog:[
    {ipa:'a',usefulTargetCount:300,usefulWeightedGain:2000,schoolTargetCount:8,syllableSpans:[1],usefulExamples:['avoir'],nounWords:[{word:'a',pos:'NOM',frequency:5000,syllableCount:1}],exactWords:[]},
    {ipa:'e',usefulTargetCount:200,usefulWeightedGain:2000,schoolTargetCount:8,syllableSpans:[1],usefulExamples:['école'],nounWords:[],exactWords:[{word:'et',pos:'CON',frequency:5000,syllableCount:1}]},
    {ipa:'bo',usefulTargetCount:40,usefulWeightedGain:500,schoolTargetCount:2,syllableSpans:[1],usefulExamples:['beauté'],nounWords:[{word:'beau',pos:'ADJ',frequency:120,syllableCount:1}],exactWords:[]}
  ]}
};
const curation={entries:[
  {ipa:'ni',candidate:'nid',decision:'prototype_candidate',visualConcept:'Un nid isolé.',visualPlausibility:'high',spontaneousNamingRisk:'low_medium',mainConfusions:['œufs'],nextGate:'prototype_then_naming_test'},
  {ipa:'e',candidate:'et',decision:'reject_candidate'}
]};
const assets=[{id:'beau-wrong',label:'beau',ipa:'/bu/',image:'beau.svg',active:true,strictEligible:true}];
const rows=representationCurationCandidates(audit,curation,assets,{limit:10});
assert.equal(rows.length,2);
const nid=rows.find(row=>row.ipa==='ni');
assert.equal(nid.status,'curated_prototype_needs_naming_test');
assert.equal(nid.preferredCandidate.visualRoute,'curated_prototype');
assert.equal(nid.preferredCandidate.visualConcept,'Un nid isolé.');
assert.equal(nid.preferredCandidate.automaticActivation,false);
assert.equal(nid.preferredCandidate.requiresHumanNamingReview,true);
assert.ok(rows[0]===nid,'curated visual evidence should outrank uncurated lexical leads');
assert.equal(rows.find(row=>row.ipa==='a'),undefined,'single-letter lexical artifacts belong to visible conventions, not image curation');
assert.equal(rows.find(row=>row.ipa==='e'),undefined,'rejected lexical route must stay excluded');
const beau=rows.find(row=>row.ipa==='bo');
assert.equal(beau.status,'lexical_precheck_before_visual_curation');
assert.equal(beau.preferredCandidate.visualRoute,'asset_phonology_conflict');
assert.equal(beau.preferredCandidate.conflictingAssets.length,1);
assert.match(beau.caution,/remains a lexical precheck/);

console.log('rebus-representation-curation.test.mjs: curated visual hypotheses stay above lexical prechecks without automatic activation');
