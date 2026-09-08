import assert from 'node:assert/strict';
import {classifyVisualResearchNeedQueue,pictogramResearchTriageStats} from '../src/hard-segment-research-routes.js';

const queue=classifyVisualResearchNeedQueue([
  {
    needType:'resolve_source_segment',researchIpa:'œʁ',affectedTargetCount:10,lexicalCandidates:[],strategyEvidence:[],
    candidateBankEvidence:{candidates:[
      {label:'heure',candidateType:'whole_word_scene',visualPlausibility:'medium_high',spontaneousNamingRisk:'high',researchDecision:'second_wave',nextGate:'compare_scene_variants_before_prototype'},
      {label:'heurt',candidateType:'whole_word_scene',visualPlausibility:'medium',spontaneousNamingRisk:'high',researchDecision:'reject_visual_priority'}
    ]}
  },
  {
    needType:'curate_existing_lexical_candidate',researchIpa:'lo',affectedTargetCount:3,lexicalCandidates:[{word:'lot'}],strategyEvidence:[],
    candidateBankEvidence:{candidates:[{label:'lot',candidateType:'whole_word_pictogram',visualPlausibility:'medium',spontaneousNamingRisk:'very_high',researchDecision:'reject_visual_priority'}]}
  },
  {
    needType:'curate_existing_lexical_candidate',researchIpa:'alɛʁ',affectedTargetCount:2,lexicalCandidates:[{word:'alaire'},{word:'allèrent'},{word:'halèrent'}],strategyEvidence:[],candidateBankEvidence:null
  },
  {
    needType:'curate_existing_lexical_candidate',researchIpa:'div',affectedTargetCount:1,lexicalCandidates:[{word:'div'}],strategyEvidence:[],
    candidateBankEvidence:{candidates:[{label:'div',candidateType:'whole_word_scene',researchDecision:'reject_visual_priority'}]}
  },
  {
    needType:'curate_existing_lexical_candidate',researchIpa:'divɛʁ',affectedTargetCount:1,lexicalCandidates:[{word:'divers'}],strategyEvidence:[],
    candidateBankEvidence:{candidates:[{label:'divers',candidateType:'whole_word_scene',researchDecision:'reject_visual_priority'}]}
  }
]);

assert.deepEqual(queue.map(row=>row.researchRoute.routeClass),Array(5).fill('research_pictogram_or_scene'));
assert.equal(queue[0].pictogramTriage.triageClass,'prototype_candidate_needs_blind_naming_test');
assert.deepEqual(queue[0].pictogramTriage.candidateLabels,['heure']);
assert.equal(queue[1].pictogramTriage.triageClass,'do_not_prototype_current_visual_candidate');
assert.equal(queue[2].pictogramTriage.triageClass,'lexical_candidate_needs_visual_eligibility_review');
assert.deepEqual(queue[2].pictogramTriage.candidateLabels,['alaire','allèrent','halèrent']);
assert.equal(queue[3].pictogramTriage.triageClass,'do_not_prototype_current_visual_candidate');
assert.equal(queue[4].pictogramTriage.triageClass,'do_not_prototype_current_visual_candidate');

const stats=pictogramResearchTriageStats(queue);
assert.equal(stats.targetCount,17);
assert.deepEqual(stats.targetCountsByTriageClass,{
  prototype_candidate_needs_blind_naming_test:10,
  do_not_prototype_current_visual_candidate:5,
  lexical_candidate_needs_visual_eligibility_review:2
});
assert.deepEqual(stats.groupCountsByTriageClass,{
  prototype_candidate_needs_blind_naming_test:1,
  do_not_prototype_current_visual_candidate:3,
  lexical_candidate_needs_visual_eligibility_review:1
});
console.log('Pictogram research triage: only retained visual hypotheses advance to blind naming prototypes.');
