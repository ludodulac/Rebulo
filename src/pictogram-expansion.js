import {normalizeIPA} from './phonetic-engine.js';

const LETTER_NAME_KEYS=new Set([
  'a','be','ce','de','effe','ge','hache','i','ji','ka','elle','aime','haine','o','pe','cu','air','esse','te','u','ve','ix','zede'
]);

function lexicalKey(value=''){
  return String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function knownIpaSet(lexicon=[]){
  return new Set((lexicon||[])
    .filter(item=>item?.ipa)
    .map(item=>normalizeIPA(item.ipa))
    .filter(Boolean));
}

function looksLikePictogramLabel(value=''){
  const key=lexicalKey(value);
  if(key.length<2)return false;
  if(LETTER_NAME_KEYS.has(key))return false;
  if(!/[a-zà-ÿ]/i.test(String(value)))return false;
  return true;
}

function nounCandidates(gap={}){
  const source=Array.isArray(gap?.exactNounCandidates)?gap.exactNounCandidates:[];
  const seen=new Set();
  const out=[];
  for(const item of source){
    if(!item?.word||!looksLikePictogramLabel(item.word))continue;
    const key=lexicalKey(item.word);
    if(!key||seen.has(key))continue;
    seen.add(key);
    out.push({
      word:item.word,
      ipa:item.ipa||gap.ipa||'',
      pos:item.pos||'',
      frequency:Number(item.frequency)||0
    });
  }
  return out.sort((a,b)=>b.frequency-a.frequency||String(a.word).localeCompare(String(b.word),'fr'));
}

function exampleWords(gap={},limit=8){
  const seen=new Set();
  const out=[];
  for(const item of gap?.examples||[]){
    if(!item?.word)continue;
    const key=lexicalKey(item.word);
    if(!key||seen.has(key))continue;
    seen.add(key);
    out.push(item.word);
    if(out.length>=limit)break;
  }
  return out;
}

export function pictogramExpansionScore(gap={},candidate={}){
  const gain=Math.max(0,Number(gap?.weightedGain)||0);
  const unlock=Math.max(0,Number(gap?.unlockCount)||0);
  const frequency=Math.max(0,Number(candidate?.frequency)||0);
  return gain*100+unlock*4+Math.log10(1+frequency)*10;
}

export function buildPictogramExpansionPriorities(report={},lexicon=[],options={}){
  const limit=Number.isInteger(options?.limit)&&options.limit>0?options.limit:25;
  const knownIpas=knownIpaSet(lexicon);
  const gaps=Array.isArray(report?.missingSounds)?report.missingSounds:[];
  const priorities=[];
  for(const gap of gaps){
    const ipa=normalizeIPA(gap?.ipa||'');
    if(!ipa||knownIpas.has(ipa))continue;
    const nouns=nounCandidates(gap);
    if(!nouns.length)continue;
    const lead=nouns[0];
    priorities.push({
      ipa:gap.ipa||ipa,
      normalizedIpa:ipa,
      unlockCount:Number(gap?.unlockCount)||0,
      weightedGain:Number(gap?.weightedGain)||0,
      rankInCoverage:Number(gap?.rank)||null,
      suggestedLabel:lead.word,
      suggestedLabelFrequency:lead.frequency,
      exactNounCandidates:nouns.slice(0,6),
      examples:exampleWords(gap),
      score:Number(pictogramExpansionScore(gap,lead).toFixed(3)),
      status:'research_candidate',
      needsImageabilityReview:true,
      needsNamingReview:true,
      clinicalStatus:'not_reviewed'
    });
  }
  return priorities
    .sort((a,b)=>b.score-a.score||b.unlockCount-a.unlockCount||String(a.suggestedLabel).localeCompare(String(b.suggestedLabel),'fr'))
    .slice(0,limit)
    .map((item,index)=>({...item,priority:index+1}));
}

export function expansionPrioritySummary(priorities=[]){
  const rows=Array.isArray(priorities)?priorities:[];
  return {
    candidateCount:rows.length,
    totalPotentialUnlocks:rows.reduce((sum,item)=>sum+(Number(item?.unlockCount)||0),0),
    top:rows.slice(0,10).map(item=>({
      priority:item.priority,
      label:item.suggestedLabel,
      ipa:item.ipa,
      unlockCount:item.unlockCount,
      weightedGain:item.weightedGain,
      alternatives:item.exactNounCandidates?.map(candidate=>candidate.word)||[],
      examples:item.examples
    }))
  };
}
