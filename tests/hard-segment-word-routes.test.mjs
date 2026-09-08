import assert from 'node:assert/strict';
import {buildHardSegmentWordRoutes,hardSegmentWordRouteStats} from '../src/hard-segment-word-routes.js';

const strategies=[{ipa:'tʁ',strategy:'alternate_segmentation_required'},{ipa:'di',strategy:'alternate_segmentation_required'}];
const technicalInventory=[
  {id:'tas',label:'tas',ipa:'ta',active:true,strictEligible:true}
];
const targetTr={key:'tari|taʁi',word:'tari',targetIpa:'taʁi',ageBandCandidate:7,rebuloUtilityTier:'child_common'};
const targetDi={key:'dodo|dodo',word:'dodo',targetIpa:'dodo',ageBandCandidate:5,rebuloUtilityTier:'very_common_simple'};
const opportunities=[
  {ipa:'tʁ',usefulUnlocked:1,usefulUnlockedTargets:[targetTr],wholeWordCandidates:[]},
  {ipa:'ʁi',usefulUnlocked:4,usefulUnlockedTargets:[targetTr],wholeWordCandidates:[{word:'riz',lemma:'riz',pos:'NOM',frequency:30,phoneticStatus:'whole_pronunciation_exact'}]},
  {ipa:'di',usefulUnlocked:1,usefulUnlockedTargets:[targetDi],wholeWordCandidates:[{word:'dit',lemma:'dire',pos:'VER',frequency:50,phoneticStatus:'whole_pronunciation_exact'}]},
  {ipa:'do',usefulUnlocked:6,usefulUnlockedTargets:[targetDi],wholeWordCandidates:[{word:'dos',lemma:'dos',pos:'NOM',frequency:80,phoneticStatus:'whole_pronunciation_exact'}]}
];

const rows=buildHardSegmentWordRoutes(strategies,opportunities,technicalInventory,{maxOperations:4,maxRoutesPerTarget:3});
const tr=rows.find(row=>row.ipa==='tʁ');
assert.equal(tr.targetCount,1);
assert.equal(tr.targetsWithAlternativeRoutes,1);
assert.equal(tr.targets[0].resolutionState,'exact_alternative_routes_found');
assert.equal(tr.targets[0].routes[0].alternativeIpa,'ʁi');
assert.equal(tr.targets[0].routes[0].mode,'strict');
assert.deepEqual(tr.targets[0].routes[0].operations.map(operation=>operation.ipa),['ta','ʁi']);
assert.equal(tr.targets[0].routes[0].lexicalLeads[0].word,'riz');
assert.equal(tr.targets[0].routes[0].lexicalLeads[0].activationState,'research_only');

const di=rows.find(row=>row.ipa==='di');
assert.equal(di.targetsWithAlternativeRoutes,1);
assert.equal(di.targets[0].routes[0].alternativeIpa,'do');
assert.deepEqual(di.targets[0].routes[0].operations.map(operation=>operation.ipa),['do','do']);
assert.ok(di.targets[0].routes.every(route=>route.operations.length>=2),'whole-target replacement must not count as alternate segmentation');

const stats=hardSegmentWordRouteStats(rows);
assert.equal(stats.segmentCount,2);
assert.equal(stats.targetCount,2);
assert.equal(stats.targetsWithAlternativeRoutes,2);
assert.equal(stats.targetsStillBlocked,0);
assert.equal(stats.strictAlternativeTargets,2);
console.log('Hard segment word routes: exact full-word alternatives remain research-only and exclude trivial whole-target replacements.');
