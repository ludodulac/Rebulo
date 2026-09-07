import {normalizeIPA} from './phonetic-engine.js';

export const TARGET_AGE_BANDS=Object.freeze([
  Object.freeze({age:5,label:'5–6 ans',minFrequency:50,maxSyllables:2,maxLetters:9}),
  Object.freeze({age:7,label:'7–8 ans',minFrequency:10,maxSyllables:3,maxLetters:12}),
  Object.freeze({age:9,label:'9–11 ans',minFrequency:2,maxSyllables:4,maxLetters:15}),
  Object.freeze({age:12,label:'12 ans +',minFrequency:0.5,maxSyllables:5,maxLetters:18})
]);

const ALLOWED_POS=new Set(['NOM','VER','ADJ','ADV','ONO']);

function lexicalPos(value=''){
  return String(value||'').trim().toUpperCase().split(':')[0];
}

function normalizedWord(value=''){
  return String(value||'').trim().toLocaleLowerCase('fr').normalize('NFC');
}

function letterCount(value=''){
  return Array.from(normalizedWord(value).replace(/[-'’]/g,'')).length;
}

export function sourceSyllables(value=''){
  const raw=String(value||'').trim();
  if(!raw)return [];
  return raw
    .replace(/^[/\[]|[/\]]$/g,'')
    .split(/[.·‧-]+/)
    .map(normalizeIPA)
    .filter(Boolean);
}

export function ageBandCandidateForEntry(entry={}){
  const word=normalizedWord(entry.word||entry.lemma);
  const frequency=Number(entry.frequency)||0;
  const syllableCount=Number.isInteger(entry.syllableCount)&&entry.syllableCount>0?entry.syllableCount:null;
  const pos=lexicalPos(entry.pos);
  if(!word||!normalizeIPA(entry.ipa)||!ALLOWED_POS.has(pos))return null;
  if(!/^[\p{L}'’-]+$/u.test(word))return null;
  if(!syllableCount)return null;
  const letters=letterCount(word);
  return TARGET_AGE_BANDS.find(profile=>frequency>=profile.minFrequency&&syllableCount<=profile.maxSyllables&&letters<=profile.maxLetters)?.age||null;
}

function candidateEntry(raw={}){
  const word=String(raw.word||'').trim();
  const lemma=String(raw.lemma||word).trim();
  const ipa=normalizeIPA(raw.ipa||'');
  const syllableCount=Number.isInteger(raw.syllableCount)&&raw.syllableCount>0?raw.syllableCount:null;
  const syllables=sourceSyllables(raw.syllabification||'');
  const ageBandCandidate=ageBandCandidateForEntry(raw);
  if(!ageBandCandidate)return null;
  return {
    target:word,
    lemma,
    targetIpa:ipa,
    pos:raw.pos||'',
    frequency:Number(raw.frequency)||0,
    syllableCount,
    syllables,
    syllabificationSource:raw.syllabification||null,
    syllabificationStatus:syllables.length===syllableCount?'source_exact':'needs_source_review',
    ageBandCandidate,
    ageStatus:'heuristic_preselection',
    source:'Lexique 4'
  };
}

export function buildTargetVocabulary(entries=[]){
  const best=new Map();
  for(const raw of entries||[]){
    const item=candidateEntry(raw);
    if(!item)continue;
    const lemmaKey=normalizedWord(item.lemma);
    if(!lemmaKey)continue;
    const isLemmaForm=normalizedWord(item.target)===lemmaKey;
    const previous=best.get(lemmaKey);
    if(!previous||
      (isLemmaForm&&!previous.isLemmaForm)||
      (isLemmaForm===previous.isLemmaForm&&item.frequency>previous.item.frequency)){
      best.set(lemmaKey,{item,isLemmaForm});
    }
  }
  return [...best.values()]
    .map(value=>value.item)
    .sort((a,b)=>a.ageBandCandidate-b.ageBandCandidate||b.frequency-a.frequency||a.target.localeCompare(b.target,'fr'));
}

export function buildSyllableInventory(targets=[]){
  const inventory=new Map();
  for(const target of targets||[]){
    if(target?.syllabificationStatus!=='source_exact')continue;
    for(const syllable of target.syllables||[]){
      const ipa=normalizeIPA(syllable);
      if(!ipa)continue;
      let item=inventory.get(ipa);
      if(!item){
        item={ipa,targetCount:0,totalFrequency:0,minAgeBandCandidate:12,examples:[]};
        inventory.set(ipa,item);
      }
      item.targetCount+=1;
      item.totalFrequency+=Number(target.frequency)||0;
      item.minAgeBandCandidate=Math.min(item.minAgeBandCandidate,Number(target.ageBandCandidate)||12);
      if(item.examples.length<8&&!item.examples.includes(target.target))item.examples.push(target.target);
    }
  }
  return [...inventory.values()]
    .map(item=>({...item,totalFrequency:Number(item.totalFrequency.toFixed(3))}))
    .sort((a,b)=>b.targetCount-a.targetCount||b.totalFrequency-a.totalFrequency||a.ipa.localeCompare(b.ipa));
}

export function targetVocabularyStats(targets=[]){
  const ageBands=Object.fromEntries(TARGET_AGE_BANDS.map(profile=>[String(profile.age),0]));
  let sourceExactSyllabification=0;
  let needsSourceReview=0;
  for(const target of targets||[]){
    const key=String(target?.ageBandCandidate||'');
    if(key in ageBands)ageBands[key]+=1;
    if(target?.syllabificationStatus==='source_exact')sourceExactSyllabification+=1;
    else needsSourceReview+=1;
  }
  return {total:targets.length,ageBands,sourceExactSyllabification,needsSourceReview};
}
