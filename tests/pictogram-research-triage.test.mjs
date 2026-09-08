import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyVisualResearchNeedQueue,pictogramResearchTriageStats} from '../src/hard-segment-research-routes.js';

const bank=JSON.parse(fs.readFileSync(new URL('../data/phonetic-brick-candidates.json',import.meta.url),'utf8'));
const bankEvidence=ipa=>{
  const segment=(bank.segments||[]).find(row=>row.ipa===ipa);
  if(!segment)return null;
  return {
    recommendedRoute:segment.recommendedRoute||null,
    candidates:(segment.candidates||[]).map(candidate=>({
      label:candidate.label,
      candidateType:candidate.candidateType,
      visualPlausibility:candidate.visualPlausibility||null,
      spontaneousNamingRisk:candidate.spontaneousNamingRisk||null,
      researchDecision:candidate.researchDecision||null,
      nextGate:candidate.nextGate||null
    }))
  };
};

const queue=classifyVisualResearchNeedQueue([
  {
    needType:'resolve_source_segment',researchIpa:'œʁ',affectedTargetCount:10,lexicalCandidates:[],strategyEvidence:[],
    candidateBankEvidence:bankEvidence('œʁ')
  },
  {
    needType:'curate_existing_lexical_candidate',researchIpa:'lo',affectedTargetCount:3,lexicalCandidates:[{word:'lot'},{word:'los'},{word:'laud'}],strategyEvidence:[],
    candidateBankEvidence:bankEvidence('lo')
  },
  {
    needType:'curate_existing_lexical_candidate',researchIpa:'alɛʁ',affectedTargetCount:2,lexicalCandidates:[{word:'alaire'},{word:'allèrent'},{word:'halèrent'}],strategyEvidence:[],candidateBankEvidence:null
  },
  {
    needType:'curate_existing_lexical_candidate',researchIpa:'div',affectedTargetCount:1,lexicalCandidates:[{word:'div'},{word:'dive'}],strategyEvidence:[],
    candidateBankEvidence:bankEvidence('div')
  },
  {
    needType:'curate_existing_lexical_candidate',researchIpa:'divɛʁ',affectedTargetCount:1,lexicalCandidates:[{word:'divers'}],strategyEvidence:[],
    candidateBankEvidence:bankEvidence('divɛʁ')
  }
]);

assert.deepEqual(queue.map(row=>row.researchRoute.routeClass),Array(5).fill('research_pictogram_or_scene'));
assert.equal(queue[0].pictogramTriage.triageClass,'prototype_candidate_needs_blind_naming_test');
assert.deepEqual(queue[0].pictogramTriage.candidateLabels,['heure']);

for(const row of queue.slice(1)){
  assert.equal(row.pictogramTriage.triageClass,'lexical_candidate_needs_visual_eligibility_review',`/${row.researchIpa}/ has no retained pictogram/scene hypothesis in the real bank`);
}
assert.deepEqual(queue[1].pictogramTriage.candidateLabels,['lot','los','laud']);
assert.deepEqual(queue[2].pictogramTriage.candidateLabels,['alaire','allèrent','halèrent']);
assert.deepEqual(queue[3].pictogramTriage.candidateLabels,['div','dive']);
assert.deepEqual(queue[4].pictogramTriage.candidateLabels,['divers']);

const stats=pictogramResearchTriageStats(queue);
assert.equal(stats.targetCount,17);
assert.deepEqual(stats.targetCountsByTriageClass,{
  prototype_candidate_needs_blind_naming_test:10,
  do_not_prototype_current_visual_candidate:0,
  lexical_candidate_needs_visual_eligibility_review:7
});
assert.deepEqual(stats.groupCountsByTriageClass,{
  prototype_candidate_needs_blind_naming_test:1,
  do_not_prototype_current_visual_candidate:0,
  lexical_candidate_needs_visual_eligibility_review:4
});
console.log('Pictogram research triage: real bank types leave heure as the only current prototype candidate; 7 targets still need visual eligibility review.');
