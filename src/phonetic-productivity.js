import {normalizeIPA,segmentTargetWithLexicon,rankDecompositions} from './phonetic-engine.js';

export const PRODUCTIVITY_STATUS=Object.freeze({
  PRODUCTIVE:'strict_productive',CANDIDATE:'strict_candidate',GENERAL:'general_only',ILLUSTRATION:'illustration_only'
});

function tokenKey(item={}){return item.id||`${item.label||''}:${normalizeIPA(item.ipa||'')}`;}

export function classifyStrictProductivity(items=[],targets=[]){
  const usable=(items||[]).filter(x=>x?.label&&x?.ipa&&x.strictEligible!==false);
  const proof=new Map(usable.map(x=>[tokenKey(x),{count:0,examples:[]} ]));
  const rebuses=[];
  for(const target of targets||[]){
    if(!target?.word||!target?.ipa)continue;
    const decompositions=rankDecompositions(segmentTargetWithLexicon(normalizeIPA(target.ipa),usable,4));
    const multi=decompositions.find(parts=>parts.length>=2);
    if(!multi)continue;
    const record={word:target.word,ipa:target.ipa,frequency:Number(target.frequency)||0,decomposition:multi.map(tokenKey)};
    rebuses.push(record);
    for(const part of multi){
      const p=proof.get(tokenKey(part));if(!p)continue;p.count+=1;
      if(p.examples.length<5&&!p.examples.some(x=>x.word===record.word))p.examples.push(record);
    }
  }
  const tokens=(items||[]).map(item=>{
    const p=proof.get(tokenKey(item))||{count:0,examples:[]};
    let productivityStatus;
    if(!item?.image)productivityStatus=PRODUCTIVITY_STATUS.ILLUSTRATION;
    else if(item.strictEligible===false)productivityStatus=PRODUCTIVITY_STATUS.GENERAL;
    else productivityStatus=p.count?PRODUCTIVITY_STATUS.PRODUCTIVE:PRODUCTIVITY_STATUS.CANDIDATE;
    return {...item,normalizedIPA:normalizeIPA(item.ipa||''),productivityStatus,strictUseCount:p.count,strictExamples:p.examples};
  });
  return {tokens,rebuses,stats:{tokens:tokens.length,productive:tokens.filter(x=>x.productivityStatus===PRODUCTIVITY_STATUS.PRODUCTIVE).length,candidates:tokens.filter(x=>x.productivityStatus===PRODUCTIVITY_STATUS.CANDIDATE).length,generalOnly:tokens.filter(x=>x.productivityStatus===PRODUCTIVITY_STATUS.GENERAL).length,strictRebuses:rebuses.length}};
}

export function groupProductiveHomophones(tokens=[]){
  const groups=new Map();
  for(const token of tokens||[]){if(!token.normalizedIPA)continue;const list=groups.get(token.normalizedIPA)||[];list.push(token);groups.set(token.normalizedIPA,list);}
  return [...groups.entries()].filter(([,entries])=>entries.length>1).map(([ipa,entries])=>({ipa,entries}));
}
