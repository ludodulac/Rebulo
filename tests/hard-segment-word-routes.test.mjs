import assert from 'node:assert/strict';
import {buildHardSegmentWordRoutes,hardSegmentWordRouteStats,buildVisualResearchNeedQueue,visualResearchNeedStats} from '../src/hard-segment-word-routes.js';
import {classifyVisualResearchNeedQueue,classifyVisualResearchRoute,visualResearchRouteStats} from '../src/hard-segment-research-routes.js';

const strategies=[
  {ipa:'tʁ',strategy:'alternate_segmentation_required'},
  {ipa:'di',strategy:'alternate_segmentation_required'},
  {ipa:'x',strategy:'test_phonetic_only'},
  {ipa:'z',strategy:'test_source_unresolved'}
];
const technicalInventory=[
  {id:'tas',label:'tas',ipa:'ta',active:true,strictEligible:true}
];
const targetTr={key:'tari|taʁi',word:'tari',targetIpa:'taʁi',ageBandCandidate:7,rebuloUtilityTier:'child_common'};
const targetDi={key:'dodo|dodo',word:'dodo',targetIpa:'dodo',ageBandCandidate:5,rebuloUtilityTier:'very_common_simple'};
const targetSingle={key:'to-test|to',word:'to-test',targetIpa:'to',ageBandCandidate:7,rebuloUtilityTier:'child_common'};
const targetSingle2={key:'toto-test|to',word:'toto-test',targetIpa:'to',ageBandCandidate:9,rebuloUtilityTier:'school_common'};
const targetSource={key:'zz-test|zz',word:'zz-test',targetIpa:'zz',ageBandCandidate:5,rebuloUtilityTier:'child_common'};
const opportunities=[
  {ipa:'tʁ',usefulUnlocked:1,usefulUnlockedTargets:[targetTr],wholeWordCandidates:[]},
  {ipa:'ʁi',usefulUnlocked:4,usefulUnlockedTargets:[targetTr],wholeWordCandidates:[{word:'riz',lemma:'riz',pos:'NOM',frequency:30,phoneticStatus:'whole_pronunciation_exact'}]},
  {ipa:'di',usefulUnlocked:1,usefulUnlockedTargets:[targetDi],wholeWordCandidates:[{word:'dit',lemma:'dire',pos:'VER',frequency:50,phoneticStatus:'whole_pronunciation_exact'}]},
  {ipa:'do',usefulUnlocked:6,usefulUnlockedTargets:[targetDi],wholeWordCandidates:[{word:'dos',lemma:'dos',pos:'NOM',frequency:80,phoneticStatus:'whole_pronunciation_exact'}]},
  {ipa:'x',usefulUnlocked:2,usefulUnlockedTargets:[targetSingle,targetSingle2],wholeWordCandidates:[]},
  {ipa:'t',usefulUnlocked:99,usefulUnlockedTargets:[targetSingle,targetSingle2],wholeWordCandidates:[{word:'t',lemma:'t',pos:'NOM',frequency:22,phoneticStatus:'whole_pronunciation_exact'}]},
  {ipa:'z',usefulUnlocked:1,usefulUnlockedTargets:[targetSource],wholeWordCandidates:[]}
];
const visualCandidateBank={segments:[
  {ipa:'ʁi',recommendedRoute:'natural_pictogram',candidates:[{label:'riz',candidateType:'whole_word_pictogram',visualConcept:'Un bol de riz clairement identifiable.',visualPlausibility:'high',spontaneousNamingRisk:'low',researchDecision:'first_wave',nextGate:'prototype_then_naming_test'}]},
  {ipa:'do',recommendedRoute:'natural_pictogram',candidates:[{label:'dos',candidateType:'whole_word_pictogram',visualConcept:'Le dos d’une personne.',visualPlausibility:'medium',spontaneousNamingRisk:'medium',researchDecision:'reject_visual_priority',nextGate:'do_not_promote'}]}
]};
const hardStrategyRegistry={segments:[
  {ipa:'di',strategy:'alternate_segmentation_required',nextGate:'search_alternate_exact_decompositions'},
  {ipa:'x',strategy:'alternate_segmentation_required',visibleFallbackResearch:['T'],fallbackStatus:'research_only_not_authorized',nextGate:'define_visible_operation_only_if_needed'},
  {ipa:'z',strategy:'scene_comparison',lexicalLeads:[],lexicalAssessment:'no_current_route',nextGate:'search_new_representation'}
]};

const rows=buildHardSegmentWordRoutes(strategies,opportunities,technicalInventory,{maxOperations:4,maxRoutesPerTarget:3,visualCandidateBank});
const tr=rows.find(row=>row.ipa==='tʁ');
assert.equal(tr.targetCount,1);
assert.equal(tr.targetsWithAlternativeRoutes,1);
assert.equal(tr.targetsWithRepresentableAlternativeRoutes,1);
assert.equal(tr.targetsWithCuratedVisualAlternativeRoutes,1);
assert.equal(tr.targets[0].resolutionState,'exact_alternative_routes_found');
assert.equal(tr.targets[0].representationResolutionState,'representable_alternative_candidate_found');
assert.equal(tr.targets[0].visualResolutionState,'curated_visual_research_candidate_found');
assert.equal(tr.targets[0].visualResearchNeed,null,'already curated visual routes must not enter the visual need queue');
assert.equal(tr.targets[0].routes[0].alternativeIpa,'ʁi');
assert.equal(tr.targets[0].routes[0].mode,'strict');
assert.equal(tr.targets[0].routes[0].representationStatus,'lexical_representation_candidate');
assert.equal(tr.targets[0].routes[0].visualResearchStatus,'curated_visual_research_candidate');
assert.deepEqual(tr.targets[0].routes[0].operations.map(operation=>operation.ipa),['ta','ʁi']);
assert.equal(tr.targets[0].routes[0].representationLeads[0].word,'riz');
assert.equal(tr.targets[0].routes[0].visualResearchLeads[0].label,'riz');

const di=rows.find(row=>row.ipa==='di');
assert.equal(di.targetsWithAlternativeRoutes,1);
assert.equal(di.targetsWithRepresentableAlternativeRoutes,1);
assert.equal(di.targetsWithCuratedVisualAlternativeRoutes,0,'rejected visual candidates must not count as curated visual routes');
assert.equal(di.targets[0].visualResolutionState,'lexical_candidate_needs_visual_curation');
assert.equal(di.targets[0].visualResearchNeed.needType,'curate_existing_lexical_candidate');
assert.equal(di.targets[0].visualResearchNeed.researchIpa,'do');

const phoneticOnly=rows.find(row=>row.ipa==='x');
assert.equal(phoneticOnly.targetCount,2);
assert.equal(phoneticOnly.targetsWithAlternativeRoutes,2,'single-letter lexical artifacts may still prove exact phonetic routes');
assert.equal(phoneticOnly.targetsWithRepresentableAlternativeRoutes,0,'single-letter lexical artifacts must not count as representable alternatives');
assert.equal(phoneticOnly.targetsWithCuratedVisualAlternativeRoutes,0);
assert.ok(phoneticOnly.targets.every(target=>target.visualResearchNeed.needType==='find_lexical_or_visible_operation_for_phonetic_brick'));
assert.ok(phoneticOnly.targets.every(target=>target.visualResearchNeed.researchIpa==='t'));

const sourceUnresolved=rows.find(row=>row.ipa==='z');
assert.equal(sourceUnresolved.targetsWithAlternativeRoutes,0);
assert.equal(sourceUnresolved.targets[0].visualResearchNeed.needType,'resolve_source_segment');
assert.equal(sourceUnresolved.targets[0].visualResearchNeed.researchIpa,'z');

const stats=hardSegmentWordRouteStats(rows);
assert.equal(stats.segmentCount,4);
assert.equal(stats.targetCount,5);
assert.equal(stats.targetsWithAlternativeRoutes,4);
assert.equal(stats.targetsWithRepresentableAlternativeRoutes,2);
assert.equal(stats.targetsWithCuratedVisualAlternativeRoutes,1);
assert.equal(stats.targetsStillBlocked,1);
assert.equal(stats.targetsStillNeedingRepresentableAlternative,3);
assert.equal(stats.targetsStillNeedingCuratedVisualAlternative,4);

const rawQueue=buildVisualResearchNeedQueue(rows,{visualCandidateBank,hardStrategyRegistry});
const queue=classifyVisualResearchNeedQueue(rawQueue);
const queueStats=visualResearchNeedStats(queue);
const routeStats=visualResearchRouteStats(queue);
assert.deepEqual(queue.map(row=>row.needType),[
  'curate_existing_lexical_candidate',
  'find_lexical_or_visible_operation_for_phonetic_brick',
  'resolve_source_segment'
]);
assert.equal(queue[0].researchIpa,'do');
assert.equal(queue[0].lexicalCandidates[0].word,'dos');
assert.equal(queue[0].candidateBankEvidence.candidates[0].researchDecision,'reject_visual_priority','rejected bank evidence remains visible without being promoted');
assert.equal(queue[0].researchRoute.routeClass,'research_pictogram_or_scene');
assert.equal(queue[1].researchIpa,'t');
assert.equal(queue[1].affectedTargetCount,2,'same missing phonetic brick must aggregate multiple targets');
assert.equal(queue[1].researchRoute.routeClass,'formalize_documented_visible_general_operation');
assert.equal(queue[1].researchRoute.visibleOperations[0].label,'T');
assert.equal(queue[1].researchRoute.authorizationStatus,'research_only_not_authorized');
assert.equal(queue[2].researchIpa,'z');
assert.equal(queue[2].researchRoute.routeClass,'discover_new_representation');
assert.equal(queue[2].strategyEvidence[0].evidence.nextGate,'search_new_representation');
assert.equal(queueStats.groupCount,3);
assert.equal(queueStats.unresolvedTargetCount,4);
assert.equal(queueStats.unresolvedTargetCount,stats.targetsStillNeedingCuratedVisualAlternative,'queue must partition every unresolved visual target exactly once');
assert.deepEqual(routeStats.targetCountsByRouteClass,{
  research_pictogram_or_scene:1,
  formalize_documented_visible_general_operation:2,
  discover_new_representation:1
});
assert.deepEqual(routeStats.groupCountsByRouteClass,{
  research_pictogram_or_scene:1,
  formalize_documented_visible_general_operation:1,
  discover_new_representation:1
});
assert.equal(routeStats.targetCount,stats.targetsStillNeedingCuratedVisualAlternative,'research route classes must conserve every unresolved target exactly once');

const dFallback={label:'D',ipa:'d',operationType:'grapheme_sound',status:'grapheme_sound_general_mode_research_only',nextGate:'test_D_to_d'};
const exactDGroup={needType:'find_lexical_or_visible_operation_for_phonetic_brick',researchIpa:'d',strategyEvidence:[{ipa:'di',evidence:{visibleFallbackResearch:[dFallback],fallbackStatus:'grapheme_sound_general_mode_research_only'}}]};
const dRoute=classifyVisualResearchRoute(exactDGroup);
assert.equal(dRoute.routeClass,'formalize_documented_visible_general_operation');
assert.equal(dRoute.visibleOperations[0].label,'D');
assert.equal(dRoute.visibleOperations[0].targetIpa,'d');
assert.equal(dRoute.visibleOperations[0].operationType,'grapheme_sound');
for(const leakedIpa of ['di','dite','mid']){
  const leaked=classifyVisualResearchRoute({...exactDGroup,researchIpa:leakedIpa});
  assert.equal(leaked.routeClass,'discover_new_representation',`D→/d/ must not leak into /${leakedIpa}/`);
  assert.equal(leaked.visibleOperations.length,0);
}
console.log('Hard segment word routes: unresolved visual needs stay partitioned and IPA-scoped grapheme-sound fallbacks cannot leak into longer segments.');
