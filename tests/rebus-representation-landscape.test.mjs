import assert from 'node:assert/strict';
import {representationLandscapeRows} from '../src/rebus-representation-landscape.js';
import {planRepresentationPaths} from '../src/rebus-representation-paths.js';
import {analyzeApproximation} from '../src/rebus-approximation.js';

const backlog=[
  {ipa:'ni',syllableSpans:[1],usefulTargetCount:100,usefulWeightedGain:900,schoolTargetCount:3,usefulExamples:['niveau'],nounWords:[{word:'nid',pos:'NOM',frequency:55,syllableCount:1}],exactWords:[]},
  {ipa:'kɔ̃pa',syllableSpans:[2],usefulTargetCount:20,usefulWeightedGain:300,schoolTargetCount:2,usefulExamples:['compagnie'],nounWords:[{word:'compas',pos:'NOM',frequency:30,syllableCount:2}],exactWords:[]},
  {ipa:'a',syllableSpans:[1],usefulTargetCount:200,usefulWeightedGain:1200,schoolTargetCount:5,usefulExamples:['aller'],nounWords:[{word:'ha',pos:'NOM',frequency:1,syllableCount:1}],exactWords:[]}
];
const curation={entries:[
  {ipa:'ni',candidate:'nid',decision:'prototype_candidate',visualPlausibility:'high',spontaneousNamingRisk:'low_medium',mainConfusions:['œufs'],nextGate:'prototype_then_naming_test'},
  {ipa:'kɔ̃pa',candidate:'compas',decision:'prototype_candidate',visualPlausibility:'high',spontaneousNamingRisk:'low_medium'},
  {ipa:'a',candidate:'ha',decision:'reject_candidate',visualPlausibility:'low',spontaneousNamingRisk:'very_high'}
]};
const conventions={entries:[{ipa:'a',kind:'letter_name',label:'A',status:'research'}]};
const rows=representationLandscapeRows(backlog,curation,conventions,new Map());
const nid=rows.find(row=>row.ipa==='ni');
assert.equal(nid.exactCandidates[0].proofStatus,'visual_hypothesis_curated');
assert.equal(nid.exactCandidates[0].visualPotential,'high');
assert.equal(nid.exactCandidates[0].automaticActivation,false);
assert.equal(nid.clinicalEvidence,'none');
const compas=rows.find(row=>row.ipa==='kɔ̃pa');
assert.equal(compas.longWindowPotential.coversTwoSyllables,true);
assert.equal(compas.longWindowPotential.candidate,'compas');
const a=rows.find(row=>row.ipa==='a');
assert.equal(a.exactCandidates[0].proofStatus,'visual_route_rejected');
assert.equal(a.visibleConventionCount,1);
assert.equal(a.automaticActivation,false);

const policy={weights:{nearVowelSubstitution:0.3,vowelSubstitution:0.6,farVowelSubstitution:0.65,insertion:0.75,deletion:0.75,internalInsertion:0.9,internalDeletion:0.9,consonantSubstitution:0.55,nearConsonantSubstitution:0.35,farConsonantSubstitution:0.9,crossClassSubstitution:0.9,glideSubstitution:0.45},tiers:{light:{maxWeightedRatio:0.2,maxEdits:1,minTargetUnits:2},loose:{maxWeightedRatio:0.28,maxEdits:2,minTargetUnits:5}}};
const approximation=analyzeApproximation('lɛ','le',policy);
assert.equal(approximation.tier,'light');
assert.equal(approximation.strictEligible,false);
assert.equal(approximation.clinicalDefaultEligible,false);
assert.equal(approximation.approximationAllowedByDefaultInClinicalMode,false);
assert.equal(approximation.clinicalEvidence,'none');

const plannerRows=[
  {ipa:'kɔ̃',exactImages:[{id:'small-a',label:'petite A',image:'a.svg',visualConfidence:0.8,labelStability:0.8}]},
  {ipa:'pa',exactImages:[{id:'small-b',label:'petite B',image:'b.svg',visualConfidence:0.8,labelStability:0.8}]},
  {ipa:'kɔ̃pa',exactImages:[{id:'compas',label:'compas',image:'compas.svg',visualConfidence:0.8,labelStability:0.8}]}
];
const routes=planRepresentationPaths('kɔ̃pa',plannerRows,{mode:'general',limit:5,allowGaps:false});
assert.equal(routes[0].complete,true);
assert.equal(routes[0].operations.length,1);
assert.equal(routes[0].operations[0].label,'compas');
assert.ok(routes.some(route=>route.operations.length===2),'Le découpage en deux petites pièces doit rester concurrent.');

console.log('rebus-representation-landscape.test.mjs: evidence levels, clinical separation and two-syllable competition are guarded');
