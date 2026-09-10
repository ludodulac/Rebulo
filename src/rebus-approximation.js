import {normalizeIPA,splitIPAUnits} from './phonetic-engine.js';

const VOWELS=new Set(['a','ɑ','e','ɛ','i','o','ɔ','u','y','ø','œ','ə','ɛ̃','ɑ̃','ɔ̃','œ̃']);
const GLIDES=new Set(['j','w','ɥ']);

export function phonemeClass(unit=''){
  const value=normalizeIPA(unit);
  if(VOWELS.has(value))return 'vowel';
  if(GLIDES.has(value))return 'glide';
  if(value)return 'consonant';
  return 'empty';
}

function safeWeight(policy={},key,fallback){
  const value=Number(policy?.weights?.[key]);
  return Number.isFinite(value)&&value>=0?value:fallback;
}

export function approximationWeights(policy={}){
  return {
    vowelSubstitution:safeWeight(policy,'vowelSubstitution',0.35),
    glideSubstitution:safeWeight(policy,'glideSubstitution',0.45),
    consonantSubstitution:safeWeight(policy,'consonantSubstitution',0.55),
    crossClassSubstitution:safeWeight(policy,'crossClassSubstitution',0.9),
    insertion:safeWeight(policy,'insertion',0.75),
    deletion:safeWeight(policy,'deletion',0.75)
  };
}

export function substitutionWeight(sourceUnit='',targetUnit='',policy={}){
  const source=normalizeIPA(sourceUnit),target=normalizeIPA(targetUnit);
  if(source===target)return 0;
  const weights=approximationWeights(policy);
  const sourceClass=phonemeClass(source),targetClass=phonemeClass(target);
  if(sourceClass!==targetClass)return weights.crossClassSubstitution;
  if(sourceClass==='vowel')return weights.vowelSubstitution;
  if(sourceClass==='glide')return weights.glideSubstitution;
  return weights.consonantSubstitution;
}

function candidateStep(dp,i,j,step){
  const previous=dp[i-step.di]?.[j-step.dj];
  if(!previous)return null;
  return {cost:previous.cost+step.cost,edits:previous.edits+(step.type==='match'?0:1),steps:[...previous.steps,step]};
}

function better(a,b){
  if(!a)return b;
  if(!b)return a;
  if(Math.abs(a.cost-b.cost)>1e-9)return a.cost<b.cost?a:b;
  if(a.edits!==b.edits)return a.edits<b.edits?a:b;
  const rank=steps=>steps.reduce((sum,step)=>sum+({match:0,substitution:1,deletion:2,insertion:3}[step.type]??4),0);
  return rank(a.steps)<=rank(b.steps)?a:b;
}

export function alignApproximateIPA(sourceIpa='',targetIpa='',policy={}){
  const source=splitIPAUnits(sourceIpa),target=splitIPAUnits(targetIpa),weights=approximationWeights(policy);
  const dp=Array.from({length:source.length+1},()=>Array(target.length+1).fill(null));
  dp[0][0]={cost:0,edits:0,steps:[]};
  for(let i=0;i<=source.length;i++)for(let j=0;j<=target.length;j++){
    if(i===0&&j===0)continue;
    let best=null;
    if(i>0&&j>0){
      const same=source[i-1]===target[j-1];
      best=better(best,candidateStep(dp,i,j,{di:1,dj:1,type:same?'match':'substitution',sourceUnit:source[i-1],targetUnit:target[j-1],sourceIndex:i-1,targetIndex:j-1,cost:same?0:substitutionWeight(source[i-1],target[j-1],policy),sourceClass:phonemeClass(source[i-1]),targetClass:phonemeClass(target[j-1])}));
    }
    if(i>0)best=better(best,candidateStep(dp,i,j,{di:1,dj:0,type:'deletion',sourceUnit:source[i-1],targetUnit:null,sourceIndex:i-1,targetIndex:j,cost:weights.deletion,sourceClass:phonemeClass(source[i-1]),targetClass:'empty'}));
    if(j>0)best=better(best,candidateStep(dp,i,j,{di:0,dj:1,type:'insertion',sourceUnit:null,targetUnit:target[j-1],sourceIndex:i,targetIndex:j-1,cost:weights.insertion,sourceClass:'empty',targetClass:phonemeClass(target[j-1])}));
    dp[i][j]=best;
  }
  const result=dp[source.length][target.length]||{cost:Infinity,edits:Infinity,steps:[]};
  const denominator=Math.max(1,source.length,target.length);
  const weightedRatio=Number((result.cost/denominator).toFixed(4));
  return {
    sourceIpa:normalizeIPA(sourceIpa),targetIpa:normalizeIPA(targetIpa),sourceUnits:source.length,targetUnits:target.length,
    weightedCost:Number(result.cost.toFixed(4)),weightedRatio,editorialApproximationPercent:Number((weightedRatio*100).toFixed(1)),editCount:result.edits,
    operations:result.steps.filter(step=>step.type!=='match').map(({di,dj,...step})=>step)
  };
}

export function approximationTier(alignment={},policy={}){
  if(!alignment?.sourceIpa||!alignment?.targetIpa)return {tier:'invalid',eligible:false,mode:null,reason:'missing_ipa'};
  if(alignment.editCount===0)return {tier:'exact',eligible:true,mode:'strict',reason:'zero_edit_exact_match'};
  const ratio=Number(alignment.weightedRatio),edits=Number(alignment.editCount),targetUnits=Number(alignment.targetUnits);
  const light=policy?.tiers?.light||{};
  if(targetUnits>=Number(light.minTargetUnits||2)&&edits<=Number(light.maxEdits||1)&&ratio<=Number(light.maxWeightedRatio||0.2)+1e-9)return {tier:'light',eligible:true,mode:'general',reason:'within_light_editorial_budget',label:light.label||'petite approximation'};
  const loose=policy?.tiers?.loose||{};
  if(targetUnits>=Number(loose.minTargetUnits||5)&&edits<=Number(loose.maxEdits||2)&&ratio<=Number(loose.maxWeightedRatio||0.28)+1e-9)return {tier:'loose',eligible:true,mode:'general',reason:'within_magazine_editorial_budget',label:loose.label||'approximation de magazine'};
  return {tier:'too_far',eligible:false,mode:null,reason:'outside_editorial_approximation_budget'};
}

export function analyzeApproximation(sourceIpa='',targetIpa='',policy={}){
  const alignment=alignApproximateIPA(sourceIpa,targetIpa,policy);
  return {...alignment,...approximationTier(alignment,policy),strictEligible:alignment.editCount===0,clinicalDefaultEligible:alignment.editCount===0};
}

function unitCounts(units=[]){
  const counts=new Map();
  for(const unit of units)counts.set(unit,(counts.get(unit)||0)+1);
  return counts;
}

function multisetOverlap(aCounts,bCounts){
  let common=0;
  for(const [unit,count] of aCounts)common+=Math.min(count,bCounts.get(unit)||0);
  return common;
}

export function boundedUnitEditDistance(source=[],target=[],maxEdits=2){
  if(Math.abs(source.length-target.length)>maxEdits)return maxEdits+1;
  let previous=Array.from({length:target.length+1},(_,index)=>index);
  for(let i=1;i<=source.length;i++){
    const current=new Array(target.length+1);
    current[0]=i;
    let rowMin=current[0];
    for(let j=1;j<=target.length;j++){
      current[j]=Math.min(
        previous[j]+1,
        current[j-1]+1,
        previous[j-1]+(source[i-1]===target[j-1]?0:1)
      );
      rowMin=Math.min(rowMin,current[j]);
    }
    if(rowMin>maxEdits)return maxEdits+1;
    previous=current;
  }
  return previous[target.length];
}

export function buildApproximateLexicalIndex(exactCandidateIndex=new Map()){
  const byLength=new Map();
  for(const [ipa,candidates] of exactCandidateIndex.entries()){
    const units=splitIPAUnits(ipa);
    const unitCount=units.length;
    if(!unitCount)continue;
    if(!byLength.has(unitCount))byLength.set(unitCount,[]);
    byLength.get(unitCount).push({ipa,units,unitCounts:unitCounts(units),candidates});
  }
  return byLength;
}

export function findApproximateWholeWordCandidates(targetIpa='',exactCandidateIndex=new Map(),policy={},options={}){
  const target=normalizeIPA(targetIpa),targetUnitList=splitIPAUnits(target),targetUnits=targetUnitList.length;
  if(!target||!targetUnits)return [];
  const byLength=options.approximateIndex instanceof Map?options.approximateIndex:buildApproximateLexicalIndex(exactCandidateIndex);
  const lengthDelta=Math.max(0,Number.isInteger(options.maxLengthDelta)?options.maxLengthDelta:1);
  const candidateLimit=Math.max(1,Number.isInteger(options.limit)?options.limit:12);
  const maxPolicyEdits=Math.max(Number(policy?.tiers?.light?.maxEdits)||1,Number(policy?.tiers?.loose?.maxEdits)||2);
  const targetCounts=unitCounts(targetUnitList);
  const results=[];
  for(let unitCount=Math.max(1,targetUnits-lengthDelta);unitCount<=targetUnits+lengthDelta;unitCount++){
    for(const group of byLength.get(unitCount)||[]){
      if(group.ipa===target)continue;
      const sourceUnits=Array.isArray(group.units)?group.units:splitIPAUnits(group.ipa);
      if(Math.abs(sourceUnits.length-targetUnits)>maxPolicyEdits)continue;
      const sourceCounts=group.unitCounts instanceof Map?group.unitCounts:unitCounts(sourceUnits);
      const minimumShared=Math.max(0,Math.min(sourceUnits.length,targetUnits)-maxPolicyEdits);
      if(multisetOverlap(sourceCounts,targetCounts)<minimumShared)continue;
      if(boundedUnitEditDistance(sourceUnits,targetUnitList,maxPolicyEdits)>maxPolicyEdits)continue;
      const analysis=analyzeApproximation(group.ipa,target,policy);
      if(!analysis.eligible||analysis.tier==='exact')continue;
      for(const candidate of group.candidates||[])results.push({...candidate,sourceIpa:group.ipa,targetIpa:target,approximation:analysis});
    }
  }
  const tierRank={light:0,loose:1};
  results.sort((a,b)=>(tierRank[a.approximation.tier]??9)-(tierRank[b.approximation.tier]??9)||a.approximation.weightedRatio-b.approximation.weightedRatio||a.approximation.editCount-b.approximation.editCount||b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));
  const seen=new Set(),deduped=[];
  for(const item of results){const key=`${String(item.word).toLocaleLowerCase('fr')}|${item.sourceIpa}`;if(seen.has(key))continue;seen.add(key);deduped.push(item);if(deduped.length>=candidateLimit)break;}
  return deduped;
}
