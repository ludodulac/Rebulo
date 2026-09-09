import {normalizeIPA,splitIPAUnits} from './phonetic-engine.js';

export function sourceExactSyllables(entry={}){
  const ipa=normalizeIPA(entry.ipa||entry.targetIpa||'');
  const source=String(entry.syllabification||'').trim();
  if(!ipa||!source)return [];
  const syllables=source.split('.').map(normalizeIPA).filter(Boolean);
  if(!syllables.length||syllables.join('')!==ipa)return [];
  const count=Number(entry?.syllableCount);
  if(Number.isInteger(count)&&count>0&&syllables.length!==count)return [];
  return syllables;
}

function pushWindow(map,ipa,meta={}){
  const key=normalizeIPA(ipa);
  if(!key)return;
  const previous=map.get(key)||{ipa:key,occurrenceCount:0,syllableSpans:new Set(),crossesWordBoundary:false,examples:[]};
  previous.occurrenceCount+=1;
  if(meta.syllableSpan)previous.syllableSpans.add(meta.syllableSpan);
  if(meta.crossesWordBoundary)previous.crossesWordBoundary=true;
  if(meta.example&&previous.examples.length<12&&!previous.examples.includes(meta.example))previous.examples.push(meta.example);
  map.set(key,previous);
}

function finalize(map){
  return [...map.values()].map(row=>({...row,syllableSpans:[...row.syllableSpans].sort((a,b)=>a-b)})).sort((a,b)=>b.occurrenceCount-a.occurrenceCount||a.ipa.localeCompare(b.ipa));
}

export function buildSyllableWindowInventory(entries=[],{minSyllables=1,maxSyllables=2}={}){
  const map=new Map();
  for(const entry of entries||[]){
    const syllables=sourceExactSyllables(entry);
    if(!syllables.length)continue;
    const label=String(entry.word||entry.target||'').trim();
    for(let start=0;start<syllables.length;start++){
      for(let length=minSyllables;length<=maxSyllables&&start+length<=syllables.length;length++){
        pushWindow(map,syllables.slice(start,start+length).join(''),{syllableSpan:length,example:label});
      }
    }
  }
  return finalize(map);
}

export function buildPhraseSyllableWindows(words=[],{minSyllables=1,maxSyllables=2}={}){
  const flat=[];
  for(let wordIndex=0;wordIndex<(words||[]).length;wordIndex++){
    const word=words[wordIndex]||{};
    const syllables=Array.isArray(word.syllables)?word.syllables.map(normalizeIPA).filter(Boolean):sourceExactSyllables(word);
    syllables.forEach((ipa,syllableIndex)=>flat.push({ipa,wordIndex,syllableIndex,label:String(word.word||word.target||'').trim()}));
  }
  const out=[];
  for(let start=0;start<flat.length;start++){
    for(let length=minSyllables;length<=maxSyllables&&start+length<=flat.length;length++){
      const parts=flat.slice(start,start+length);
      out.push({
        ipa:parts.map(part=>part.ipa).join(''),
        syllableSpan:length,
        crossesWordBoundary:new Set(parts.map(part=>part.wordIndex)).size>1,
        parts
      });
    }
  }
  return out;
}

export function buildOverlappingPhonemeWindows(ipa='',{minUnits=1,maxUnits=8}={}){
  const units=splitIPAUnits(normalizeIPA(ipa));
  const out=[];
  for(let start=0;start<units.length;start++){
    for(let length=minUnits;length<=maxUnits&&start+length<=units.length;length++){
      out.push({ipa:units.slice(start,start+length).join(''),startUnit:start,unitCount:length});
    }
  }
  return out;
}

export function phonemeEditDistance(source='',target=''){
  const a=splitIPAUnits(normalizeIPA(source));
  const b=splitIPAUnits(normalizeIPA(target));
  const dp=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++)dp[i][0]=i;
  for(let j=0;j<=b.length;j++)dp[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
    const substitution=a[i-1]===b[j-1]?0:1;
    dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+substitution);
  }
  const distance=dp[a.length][b.length];
  const denominator=Math.max(1,a.length,b.length);
  return {distance,ratio:Number((distance/denominator).toFixed(4)),sourceUnits:a.length,targetUnits:b.length};
}

export function representationTier(item={}){
  if(item.match==='approximate'||item.kind==='approximate')return 'approximation_research';
  const wholeWordKinds=new Set(['whole_word_image','whole_word_pictogram','whole_word_scene','whole_word_image_or_scene']);
  if(wholeWordKinds.has(item.kind))return item.status==='active'?'exact_image_ready':'exact_image_research';
  if(['number_symbol','letter_name','music_note','music_note_tile','explicit_grapheme','explicit_grapheme_tile'].includes(item.kind))return 'explicit_visible_convention';
  return 'research_candidate';
}

export function groupRepresentationsBySound(items=[]){
  const groups=new Map();
  for(const item of items||[]){
    const ipa=normalizeIPA(item.ipa||'');
    if(!ipa)continue;
    if(!groups.has(ipa))groups.set(ipa,[]);
    groups.get(ipa).push({...item,ipa,tier:representationTier(item)});
  }
  return [...groups.entries()].map(([ipa,representations])=>({ipa,representations})).sort((a,b)=>a.ipa.localeCompare(b.ipa));
}
