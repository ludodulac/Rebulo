import assert from 'node:assert/strict';
import {buildHardSegmentWordRoutes,hardSegmentWordRouteStats} from '../src/hard-segment-word-routes.js';

const strategies=[{ipa:'tʁ',strategy:'alternate_segmentation_required'},{ipa:'di',strategy:'alternate_segmentation_required'},{ipa:'x',strategy:'test_phonetic_only'}];
const technicalInventory=[
  {id:'tas',label:'tas',ipa:'ta',active:true,strictEligible:true}
];
const targetTr={key:'tari|taʁi',word:'tari',targetIpa:'taʁi',ageBandCandidate:7,rebuloUtilityTier:'child_common'};
const targetDi={key:'dodo|dodo',word:'dodo',targetIpa:'dodo',ageBandCandidate:5,rebuloUtilityTier:'very_common_simple'};
const targetSingle={key:'ta-test|ta',word:'ta-test',targetIpa:'ta',ageBandCandidate:7,rebuloUtilityTier:'child_common'};
const opportunities=[
  {ipa:'tʁ',usefulUnlocked:1,usefulUnlockedTargets:[targetTr],wholeWordCandidates:[]},
  {ipa:'ʁi',usefulUnlocked:4,usefulUnlockedTargets:[targetTr],wholeWordCandidates:[{word:'riz',lemma:'riz',pos:'NOM',frequency:30,phoneticStatus:'whole_pronunciation_exact'}]},
  {ipa:'di',usefulUnlocked:1,usefulUnlockedTargets:[targetDi],wholeWordCandidates:[{word:'dit',lemma:'dire',pos:'VER',frequency:50,phoneticStatus:'whole_pronunciation_exact'}]},
  {ipa:'do',usefulUnlocked:6,usefulUnlockedTargets:[targetDi],wholeWordCandidates:[{word:'dos',lemma:'dos',pos:'NOM',frequency:80,phoneticStatus:'whole_pronunciation_exact'}]},
  {ipa:'x',usefulUnlocked:1,usefulUnlockedTargets:[targetSingle],wholeWordCandidates:[]},
  {ipa:'t',usefulUnlocked:99,usefulUnlockedTargets:[targetSingle],wholeWordCandidates:[{word:'t',lemma:'t',pos:'NOM',frequency:22,phoneticStatus:'whole_pronunciation_exact'}]}
];

const rows=buildHardSegmentWordRoutes(strategies,opportunities,technicalInventory,{maxOperations:4,maxRoutesPerTarget:3});
const tr=rows.find(row=>row.ipa==='tʁ');
assert.equal(tr.targetCount,1);
assert.equal(tr.targetsWithAlternativeRoutes,1);
assert.equal(tr.targetsWithRepresentableAlternativeRoutes,1);
assert.equal(tr.targets[0].resolutionState,'exact_alternative_routes_found');
assert.equal(tr.targets[0].representationResolutionState,'representable_alternative_candidate_found');
assert.equal(tr.targets[0].routes[0].alternativeIpa,'ʁi');
assert.equal(tr.targets[0].routes[0].mode,'strict');
assert.equal(tr.targets[0].routes[0].representationStatus,'lexical_representation_candidate');
assert.deepEqual(tr.targets[0].routes[0].operations.map(operation=>operation.ipa),['ta','ʁi']);
assert.equal(tr.targets[0].routes[0].representationLeads[0].word,'riz');
assert.equal(tr.targets[0].routes[0].representationLeads[0].activationState,'research_only');

const di=rows.find(row=>row.ipa==='di');
assert.equal(di.targetsWithAlternativeRoutes,1);
assert.equal(di.targetsWithRepresentableAlternativeRoutes,1);
assert.equal(di.targets[0].routes[0].alternativeIpa,'do');
assert.deepEqual(di.targets[0].routes[0].operations.map(operation=>operation.ipa),['do','do']);
assert.ok(di.targets[0].routes.every(route=>route.operations.length>=2),'whole-target replacement must not count as alternate segmentation');

const phoneticOnly=rows.find(row=>row.ipa==='x');
assert.equal(phoneticOnly.targetsWithAlternativeRoutes,1,'single-letter lexical artifacts may still prove an exact phonetic route');
assert.equal(phoneticOnly.targetsWithRepresentableAlternativeRoutes,0,'single-letter lexical artifacts must not count as representable alternatives');
assert.equal(phoneticOnly.targets[0].routes[0].representationStatus,'phonetic_only_unresolved_alternative');
assert.equal(phoneticOnly.targets[0].representationResolutionState,'still_needs_representable_alternative');

const stats=hardSegmentWordRouteStats(rows);
assert.equal(stats.segmentCount,3);
assert.equal(stats.targetCount,3);
assert.equal(stats.targetsWithAlternativeRoutes,3);
assert.equal(stats.targetsWithRepresentableAlternativeRoutes,2);
assert.equal(stats.targetsStillBlocked,0);
assert.equal(stats.targetsStillNeedingRepresentableAlternative,1);
assert.equal(stats.strictAlternativeTargets,2);
assert.equal(stats.strictRepresentableAlternativeTargets,2);
console.log('Hard segment word routes: exact phonetic routes stay distinct from alternatives with a real lexical representation candidate.');
