import {buildPhrasePlan,phrasePracticeMetrics} from './phrase-creator.js';

export const DEFAULT_PHRASE_PRACTICE_POLICY=Object.freeze({
  minimumRebusRatio:0.5,
  minimumStrictRebusRatio:0.25,
  maximumTextWords:3
});

export function phrasePracticeBand(plan={}){
  const metrics=plan.practice||phrasePracticeMetrics(plan);
  if(metrics.complete&&metrics.strictRebusRatio>=0.75)return 'high_support';
  if(metrics.rebusRatio>=0.5&&metrics.strictRebusRatio>=0.25)return 'usable';
  return 'insufficient_visual_support';
}

export function scorePhrasePractice(plan={}){
  const metrics=plan.practice||phrasePracticeMetrics(plan);
  const textPenalty=metrics.wordCount?metrics.textCount/metrics.wordCount:1;
  return Number((metrics.strictRebusRatio*2+metrics.rebusRatio-textPenalty).toFixed(6));
}

export function buildPhrasePracticeCatalog(phrases=[],targets=[],lexicon=[],therapyDefinitions=[],policy=DEFAULT_PHRASE_PRACTICE_POLICY){
  return (phrases||[]).map((phrase,index)=>{
    const plan=buildPhrasePlan(phrase,targets,lexicon,therapyDefinitions);
    const metrics=plan.practice||phrasePracticeMetrics(plan);
    const eligible=metrics.rebusRatio>=policy.minimumRebusRatio&&metrics.strictRebusRatio>=policy.minimumStrictRebusRatio&&metrics.textCount<=policy.maximumTextWords;
    return {phrase,index,plan,metrics,band:phrasePracticeBand(plan),score:scorePhrasePractice(plan),eligible};
  }).sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.score-a.score||a.metrics.wordCount-b.metrics.wordCount||a.index-b.index);
}

export function recommendedPhrasePractice(catalog=[],offset=0){
  const eligible=(catalog||[]).filter(item=>item?.eligible);
  if(!eligible.length)return null;
  const safe=((Number(offset)||0)%eligible.length+eligible.length)%eligible.length;
  return eligible[safe];
}
