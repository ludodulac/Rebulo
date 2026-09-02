import {normalizeIPA} from './phonetic-engine.js';

export const PRODUCTIVITY_STATUS=Object.freeze({
  PRODUCTIVE:'strict_productive',CANDIDATE:'strict_candidate',GENERAL:'general_only',ILLUSTRATION:'illustration_only'
});

function tokenKey(item={}){return item.id||`${item.label||''}:${normalizeIPA(item.ipa||'')}`;}
function labelKey(value=''){return String(value||'').trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');}

export function mergeProductivityInventory(seed=[],openItems=[]){
  const result=[];const ids=new Set();const labels=new Set();
  for(const item of [...(seed||[]),...(openItems||[])]){
    if(!item?.label||!item?.ipa)continue;
    const id=String(item.id||'');const label=labelKey(item.label);
    if((id&&ids.has(id))||(label&&labels.has(label)))continue;
    result.push({...item});if(id)ids.add(id);if(label)labels.add(label);
  }
  return result;
}

function uniqueTargets(targets=[]){
  const map=new Map();
  for(const target of targets||[]){
    if(!target?.word||!target?.ipa)continue;
    const ipa=normalizeIPA(target.ipa);if(!ipa)continue;
    const key=`${String(target.word).toLocaleLowerCase('fr')}|${ipa}`;
    const current=map.get(key);
    if(!current||Number(target.frequency||0)>Number(current.frequency||0))map.set(key,{...target,normalizedIPA:ipa});
  }
  return [...map.values()];
}

function strictSoundBlocks(items=[]){
  const blocks=new Map();
  for(const item of items||[]){
    if(item?.active===false||item?.strictEligible===false||!item?.label||!item?.ipa)continue;
    const ipa=normalizeIPA(item.ipa);if(!ipa)continue;
    const bucket=blocks.get(ipa)||[];bucket.push(item);blocks.set(ipa,bucket);
  }
  return blocks;
}

function segmentByWholeBlocks(target='',blocks=new Map(),maxPieces=4){
  const byFirst=new Map();
  for(const ipa of blocks.keys()){
    const first=Array.from(ipa)[0]||'';const bucket=byFirst.get(first)||[];bucket.push(ipa);byFirst.set(first,bucket);
  }
  for(const bucket of byFirst.values())bucket.sort((a,b)=>b.length-a.length||a.localeCompare(b));
  const results=[];
  function walk(offset,path){
    if(offset===target.length){if(path.length>=2)results.push(path);return;}
    if(path.length>=maxPieces)return;
    const first=Array.from(target.slice(offset))[0]||'';
    for(const ipa of byFirst.get(first)||[]){if(target.startsWith(ipa,offset))walk(offset+ipa.length,[...path,ipa]);}
  }
  walk(0,[]);
  return results;
}

export function classifyStrictProductivity(items=[],targets=[],{maxPieces=4}={}){
  const blocks=strictSoundBlocks(items);
  const proof=new Map((items||[]).map(x=>[tokenKey(x),{count:0,examples:[]} ]));
  const rebuses=[];
  for(const target of uniqueTargets(targets)){
    const decompositions=segmentByWholeBlocks(target.normalizedIPA,blocks,maxPieces);
    if(!decompositions.length)continue;
    decompositions.sort((a,b)=>a.length-b.length||a.join('|').localeCompare(b.join('|')));
    const best=decompositions[0];
    const record={word:target.word,ipa:target.ipa,frequency:Number(target.frequency)||0,decomposition:best.map(ipa=>tokenKey(blocks.get(ipa)[0])),soundBlocks:best};
    rebuses.push(record);
    const usedKeys=new Set();
    for(const path of decompositions){
      for(const ipa of path){
        for(const token of blocks.get(ipa)||[])usedKeys.add(tokenKey(token));
      }
    }
    for(const key of usedKeys){
      const p=proof.get(key);if(!p)continue;p.count+=1;
      if(p.examples.length<5&&!p.examples.some(x=>String(x.word).toLocaleLowerCase('fr')===String(record.word).toLocaleLowerCase('fr')))p.examples.push(record);
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
  return {tokens,rebuses,stats:{tokens:tokens.length,productive:tokens.filter(x=>x.productivityStatus===PRODUCTIVITY_STATUS.PRODUCTIVE).length,candidates:tokens.filter(x=>x.productivityStatus===PRODUCTIVITY_STATUS.CANDIDATE).length,generalOnly:tokens.filter(x=>x.productivityStatus===PRODUCTIVITY_STATUS.GENERAL).length,illustrationOnly:tokens.filter(x=>x.productivityStatus===PRODUCTIVITY_STATUS.ILLUSTRATION).length,strictRebuses:rebuses.length}};
}

export function groupProductiveHomophones(tokens=[]){
  const groups=new Map();
  for(const token of tokens||[]){if(!token.normalizedIPA)continue;const list=groups.get(token.normalizedIPA)||[];list.push(token);groups.set(token.normalizedIPA,list);}
  return [...groups.entries()].filter(([,entries])=>entries.length>1).map(([ipa,entries])=>({ipa,entries}));
}
