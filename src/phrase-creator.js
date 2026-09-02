import {buildCreatorCandidate,buildGeneralCreatorCandidate} from './creator-runtime.js';

export const PLAYFUL_PHRASES=Object.freeze([
  'Le rat sous le parapluie',
  'Merci pour le cinéma',
  'La souris sous le parasol',
  'Un souci sous le soleil'
]);

export function normalizePhraseWord(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

export function tokenizePhrase(value=''){
  const text=String(value||'');
  const tokens=[];
  const pattern=/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*|[^\p{L}\p{N}]+/gu;
  for(const match of text.matchAll(pattern)){
    const token=match[0];
    const word=/[\p{L}\p{N}]/u.test(token);
    tokens.push({kind:word?'word':'separator',text:token});
  }
  return tokens;
}

export function isPhraseInput(value=''){
  return tokenizePhrase(value).filter(token=>token.kind==='word').length>1;
}

function viableCandidate(target,lexicon=[],therapyDefinitions=[]){
  if(!target||target.assets!=='ready')return null;
  if(target.mode==='strict')return buildCreatorCandidate(target,lexicon,therapyDefinitions);
  if(target.mode==='general')return buildGeneralCreatorCandidate(target,lexicon);
  return null;
}

export function buildPhrasePlan(value='',targets=[],lexicon=[],therapyDefinitions=[]){
  const tokens=tokenizePhrase(value);
  const targetMap=new Map();
  for(const target of targets||[]){
    const key=normalizePhraseWord(target?.target);
    if(key&&!targetMap.has(key))targetMap.set(key,target);
  }

  let wordCount=0;
  let rebusCount=0;
  const planned=tokens.map(token=>{
    if(token.kind!=='word')return token;
    wordCount+=1;
    const key=normalizePhraseWord(token.text);
    const target=targetMap.get(key)||null;
    const candidate=viableCandidate(target,lexicon,therapyDefinitions);
    if(!candidate)return {kind:'text',text:token.text,reason:target?'not_renderable':'not_available'};
    rebusCount+=1;
    return {kind:'rebus',text:token.text,mode:target.mode,target,candidate};
  });

  return {
    input:String(value||''),
    tokens:planned,
    wordCount,
    rebusCount,
    textCount:Math.max(0,wordCount-rebusCount),
    complete:wordCount>0&&rebusCount===wordCount
  };
}

export function playfulPhraseAt(index=0){
  const size=PLAYFUL_PHRASES.length;
  if(!size)return '';
  const safe=((Number(index)||0)%size+size)%size;
  return PLAYFUL_PHRASES[safe];
}
