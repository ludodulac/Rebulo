import {buildRhymeJudgments,buildRhymeMatching} from './rhyme-activities.js';
import {buildMinimalPairActivities} from './minimal-pair-activities.js';
import {buildPhonemeOperationActivities} from './phoneme-operation-activities.js';

export function buildRelationalTherapyCatalog({rhymeRelations=[],minimalPairRelations=[],phonemeOperations=[]}={}){
  const rhymeJudgments=buildRhymeJudgments(rhymeRelations);
  const rhymeMatching=[];
  const targets=[...new Set((rhymeRelations||[]).map(item=>String(item?.targetWord||'').trim()).filter(Boolean))];
  for(const target of targets){
    const activity=buildRhymeMatching(rhymeRelations,target);
    if(activity)rhymeMatching.push(activity);
  }
  const minimalPairs=buildMinimalPairActivities(minimalPairRelations);
  const phonemeOperationActivities=buildPhonemeOperationActivities(phonemeOperations);
  const activities=[...rhymeJudgments,...rhymeMatching,...minimalPairs,...phonemeOperationActivities];
  return {
    rhymeJudgments,
    rhymeMatching,
    minimalPairs,
    phonemeOperations:phonemeOperationActivities,
    activities
  };
}
