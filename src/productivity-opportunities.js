import {normalizeIPA} from './phonetic-engine.js';

function uniqueLexicalTargets(targets=[]){
  const map=new Map();
  for(const target of targets||[]){
    const word=String(target?.word||'').trim();
    const ipa=normalizeIPA(target?.ipa||'');
    if(!word||!ipa)continue;
    const key=`${word.toLocaleLowerCase('fr')}|${ipa}`;
    const frequency=Number(target?.frequency)||0;
    const current=map.get(key);
    if(!current||frequency>current.frequency)map.set(key,{word,ipa,frequency});
  }
  return [...map.values()];
}

function strictBlocks(items=[]){
  const blocks=new Set();
  for(const item of items||[]){
    if(item?.active===false||item?.strictEligible===false)continue;
    const ipa=normalizeIPA(item?.ipa||'');
    if(ipa)blocks.add(ipa);
  }
  return blocks;
}

function segmentCounts(value='',blocks=new Set(),maxPieces=3){
  if(!value)return new Set([0]);
  const chars=Array.from(value);
  const offsets=[0];
  for(const char of chars)offsets.push(offsets[offsets.length-1]+char.length);
  const memo=new Map();
  function walk(offset,pieces){
    const key=`${offset}|${pieces}`;
    if(memo.has(key))return memo.get(key);
    const counts=new Set();
    if(offset===value.length){counts.add(pieces);memo.set(key,counts);return counts;}
    if(pieces>=maxPieces){memo.set(key,counts);return counts;}
    for(const block of blocks){
      if(value.startsWith(block,offset))for(const count of walk(offset+block.length,pieces+1))counts.add(count);
    }
    memo.set(key,counts);return counts;
  }
  return walk(0,0);
}

function lexicalNamesByIPA(targets=[]){
  const map=new Map();
  for(const target of uniqueLexicalTargets(targets)){
    const list=map.get(target.ipa)||[];
    list.push({word:target.word,frequency:target.frequency});
    map.set(target.ipa,list);
  }
  for(const list of map.values())list.sort((a,b)=>b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));
  return map;
}

export function rankMissingWholeWordOpportunities(items=[],targets=[],{maxPieces=4,limit=100}={}){
  const lexical=uniqueLexicalTargets(targets);
  const names=lexicalNamesByIPA(lexical);
  const existing=strictBlocks(items);
  const opportunities=new Map();

  for(const target of lexical){
    const chars=Array.from(target.ipa);
    const offsets=[0];
    for(const char of chars)offsets.push(offsets[offsets.length-1]+char.length);
    const seenForTarget=new Set();
    for(let i=0;i<offsets.length-1;i++)for(let j=i+1;j<offsets.length;j++){
      const candidate=target.ipa.slice(offsets[i],offsets[j]);
      if(existing.has(candidate)||!names.has(candidate))continue;
      const left=target.ipa.slice(0,offsets[i]);
      const right=target.ipa.slice(offsets[j]);
      const leftCounts=segmentCounts(left,existing,maxPieces-1);
      const rightCounts=segmentCounts(right,existing,maxPieces-1);
      let viable=false;let pieceCount=Infinity;
      for(const a of leftCounts)for(const b of rightCounts){
        const total=a+1+b;
        if(total>=2&&total<=maxPieces){viable=true;pieceCount=Math.min(pieceCount,total);}
      }
      if(!viable||seenForTarget.has(candidate))continue;
      seenForTarget.add(candidate);
      const record=opportunities.get(candidate)||{ipa:candidate,targetCount:0,frequencySum:0,namingCandidates:(names.get(candidate)||[]).slice(0,5),examples:[]};
      record.targetCount+=1;
      record.frequencySum+=target.frequency;
      if(record.examples.length<8)record.examples.push({word:target.word,ipa:target.ipa,frequency:target.frequency,pieceCount});
      opportunities.set(candidate,record);
    }
  }

  return [...opportunities.values()]
    .sort((a,b)=>b.targetCount-a.targetCount||b.frequencySum-a.frequencySum||a.ipa.localeCompare(b.ipa))
    .slice(0,limit);
}
