import {normalizeIPA} from './phonetic-engine.js';

const POS_PRIORITY=Object.freeze({NOM:0,ONO:1,ADJ:2,VER:3,ADV:4});

function lexicalPos(value=''){
  return String(value||'').trim().toUpperCase().split(':')[0];
}

function normalizedWord(value=''){
  return String(value||'').trim().toLocaleLowerCase('fr').normalize('NFC');
}

function candidatePriority(entry={}){
  const pos=lexicalPos(entry.pos);
  return POS_PRIORITY[pos]??9;
}

function lexicalCandidate(raw={},target=''){
  const word=String(raw?.word||'').trim();
  const lemma=String(raw?.lemma||word).trim();
  const pos=lexicalPos(raw?.pos);
  if(!word||!lemma||!(pos in POS_PRIORITY))return null;
  if(!/^[\p{L}'’\-]+$/u.test(word))return null;
  return {
    word,
    lemma,
    ipa:target,
    pos:raw.pos||'',
    frequency:Number(raw.frequency)||0,
    syllableCount:Number.isInteger(raw.syllableCount)&&raw.syllableCount>0?raw.syllableCount:null,
    lexicalPriority:candidatePriority(raw),
    phoneticStatus:'whole_pronunciation_exact',
    visualStatus:'unreviewed',
    namingStatus:'unreviewed',
    activationState:'research_only'
  };
}

function preferredCandidate(previous,candidate){
  if(!previous)return candidate;
  const isLemmaForm=normalizedWord(candidate.word)===normalizedWord(candidate.lemma);
  const previousIsLemma=normalizedWord(previous.word)===normalizedWord(previous.lemma);
  if(candidate.lexicalPriority<previous.lexicalPriority)return candidate;
  if(candidate.lexicalPriority>previous.lexicalPriority)return previous;
  if(isLemmaForm&&!previousIsLemma)return candidate;
  if(!isLemmaForm&&previousIsLemma)return previous;
  return candidate.frequency>previous.frequency?candidate:previous;
}

export function buildWholeWordCandidateIndex(entries=[]){
  const byIpaLemma=new Map();
  for(const raw of entries||[]){
    const target=normalizeIPA(raw?.ipa||'');
    if(!target)continue;
    const candidate=lexicalCandidate(raw,target);
    if(!candidate)continue;
    const key=`${target}|${normalizedWord(candidate.lemma)}`;
    byIpaLemma.set(key,preferredCandidate(byIpaLemma.get(key),candidate));
  }
  const index=new Map();
  for(const candidate of byIpaLemma.values()){
    if(!index.has(candidate.ipa))index.set(candidate.ipa,[]);
    index.get(candidate.ipa).push(candidate);
  }
  for(const [ipa,candidates] of index){
    candidates.sort((a,b)=>a.lexicalPriority-b.lexicalPriority||b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));
    index.set(ipa,candidates);
  }
  return index;
}

export function wholeWordRepresentationCandidates(ipa='',entriesOrIndex=[],limit=12){
  const target=normalizeIPA(ipa);
  if(!target)return [];
  const index=entriesOrIndex instanceof Map?entriesOrIndex:buildWholeWordCandidateIndex(entriesOrIndex);
  const sorted=index.get(target)||[];
  return Number.isInteger(limit)&&limit>0?sorted.slice(0,limit):sorted.slice();
}

export function buildRepresentationResearchQueue(syllableRows=[],entries=[],candidateLimit=12){
  const index=buildWholeWordCandidateIndex(entries);
  return (syllableRows||[])
    .filter(row=>row?.coverage?.coverageType==='uncovered')
    .map(row=>({
      ipa:normalizeIPA(row?.ipa||''),
      targetCount:Number(row?.targetCount)||0,
      totalFrequency:Number(row?.totalFrequency)||0,
      minAgeBandCandidate:Number(row?.minAgeBandCandidate)||12,
      examples:Array.isArray(row?.examples)?row.examples:[],
      wholeWordCandidates:wholeWordRepresentationCandidates(row?.ipa||'',index,candidateLimit),
      researchState:'needs_visual_resolution'
    }))
    .sort((a,b)=>
      a.minAgeBandCandidate-b.minAgeBandCandidate||
      b.targetCount-a.targetCount||
      b.totalFrequency-a.totalFrequency||
      a.ipa.localeCompare(b.ipa)
    );
}

export function representationResearchStats(queue=[]){
  return {
    gaps:queue.length,
    gapsWithWholeWordCandidates:queue.filter(item=>item.wholeWordCandidates.length>0).length,
    gapsWithoutWholeWordCandidates:queue.filter(item=>item.wholeWordCandidates.length===0).length
  };
}
