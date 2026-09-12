import {normalizeIPA,splitIPAUnits} from './phonetic-engine.js';
import {resolveFrenchSoundQuery} from './french-sound-search.js';
import {buildRepresentationPathIndex,planRepresentationPaths} from './rebus-representation-paths.js';

export function normalizePhraseLexeme(value=''){
  return String(value||'').trim().toLocaleLowerCase('fr').replace(/[’]/g,"'").normalize('NFC');
}

export function tokenizeFrenchPhrase(value=''){
  const text=String(value||'');
  const tokens=[];
  const pattern=/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*|[^\p{L}\p{N}]+/gu;
  for(const match of text.matchAll(pattern)){
    const raw=match[0];
    const word=/[\p{L}\p{N}]/u.test(raw);
    tokens.push({kind:word?'word':'separator',text:raw,start:match.index,end:match.index+raw.length});
  }
  return tokens;
}

export function decodePronunciationLexicon(source={}){
  if(Array.isArray(source))return source;
  const schema=source.rowSchema||['form','ipa','lemma','frequency','pos','source'];
  const index=Object.fromEntries(schema.map((name,i)=>[name,i]));
  return (source.rows||[]).map(row=>({
    form:row[index.form]||'',
    ipa:normalizeIPA(row[index.ipa]||''),
    lemma:row[index.lemma]||'',
    frequency:Number(row[index.frequency])||0,
    pos:row[index.pos]||'',
    source:row[index.source]||source.source?.name||'Lexique 4'
  })).filter(item=>item.form&&item.ipa);
}

export function buildPronunciationLookup(source={}){
  const entries=decodePronunciationLexicon(source);
  const byForm=new Map();
  for(const entry of entries){
    const key=normalizePhraseLexeme(entry.form);
    if(!key)continue;
    const list=byForm.get(key)||[];
    list.push(entry);
    byForm.set(key,list);
  }
  for(const list of byForm.values())list.sort((a,b)=>b.frequency-a.frequency||a.ipa.localeCompare(b.ipa));
  return byForm;
}

function bestPronunciation(list=[]){return list[0]||null;}
function fallbackPronunciation(value='',key=''){
  const resolved=resolveFrenchSoundQuery(value);
  if(resolved.ambiguous||resolved.ipaCandidates.length!==1)return null;
  const ipa=normalizeIPA(resolved.ipaCandidates[0]);
  return ipa?{ipa,lemma:key,pos:'',source:'french-sound-search',frequency:0,pronunciationMethod:'orthographic_sound_fallback'}:null;
}

function phoneticSegments(words=[]){
  const segments=[];let current=null;
  for(const word of words){
    if(!word.resolved){
      if(current){segments.push(current);current=null;}
      segments.push({kind:'unresolved_word',text:word.text,word,unitStart:word.unitStart,unitEnd:word.unitEnd});
      continue;
    }
    if(!current)current={kind:'resolved_span',words:[],ipa:'',unitStart:word.unitStart,unitEnd:word.unitEnd};
    current.words.push(word);current.ipa+=word.ipa;current.unitEnd=word.unitEnd;
  }
  if(current)segments.push(current);
  return segments;
}

export function phraseToContinuousIPA(value='',source={}){
  const lookup=source instanceof Map?source:buildPronunciationLookup(source);
  const tokens=tokenizeFrenchPhrase(value);
  const wordTokens=[];
  let unitOffset=0;
  let complete=true;
  for(const token of tokens){
    if(token.kind!=='word')continue;
    const key=normalizePhraseLexeme(token.text);
    const candidates=lookup.get(key)||[];
    const lexical=bestPronunciation(candidates);
    const selected=lexical||fallbackPronunciation(token.text,key);
    if(!selected){
      complete=false;
      wordTokens.push({...token,key,resolved:false,candidates:[],ipa:'',pronunciationMethod:'unresolved',unitStart:unitOffset,unitEnd:unitOffset});
      continue;
    }
    const ipa=normalizeIPA(selected.ipa);
    const unitCount=splitIPAUnits(ipa).length;
    const pronunciationMethod=lexical?'lexicon_exact':selected.pronunciationMethod;
    wordTokens.push({...token,key,resolved:true,ipa,lemma:selected.lemma||key,pos:selected.pos||'',source:selected.source||'',frequency:selected.frequency||0,pronunciationMethod,candidates:candidates.slice(0,5),unitStart:unitOffset,unitEnd:unitOffset+unitCount});
    unitOffset+=unitCount;
  }
  const continuousIpa=wordTokens.filter(token=>token.resolved).map(token=>token.ipa).join('');
  const segments=phoneticSegments(wordTokens);
  return {
    input:String(value||''),
    complete:complete&&wordTokens.length>0,
    continuousIpa,
    unitCount:splitIPAUnits(continuousIpa).length,
    wordCount:wordTokens.length,
    resolvedWordCount:wordTokens.filter(token=>token.resolved).length,
    unresolvedWords:wordTokens.filter(token=>!token.resolved).map(token=>token.text),
    words:wordTokens,
    segments,
    tokens
  };
}

export function annotateRouteWordBoundaries(route={},phrasePhonetics={},context={}){
  const words=context.words||phrasePhonetics.words||[];
  const baseOffset=Number(context.unitStart)||0;
  let offset=baseOffset;
  const operations=(route.operations||[]).map(operation=>{
    const partUnits=splitIPAUnits(operation.targetIpa||'');
    const start=offset;
    const end=offset+partUnits.length;
    offset=end;
    const touched=words.filter(word=>word.resolved&&word.unitStart<end&&word.unitEnd>start).map(word=>({text:word.text,lemma:word.lemma,pronunciationMethod:word.pronunciationMethod,unitStart:word.unitStart,unitEnd:word.unitEnd}));
    return {...operation,unitStart:start,unitEnd:end,crossesWordBoundary:touched.length>1,sourceWords:touched};
  });
  return {...route,operations,crossWordOperationCount:operations.filter(operation=>operation.crossesWordBoundary&&operation.kind!=='gap').length,crossWordGapCount:operations.filter(operation=>operation.crossesWordBoundary&&operation.kind==='gap').length};
}

function unresolvedOperation(segment={}){
  const word=segment.word||{};
  return {kind:'unresolved_word',mode:'uncovered',phoneticTier:'unresolved_pronunciation',targetIpa:'',sourceIpa:'',label:word.text||segment.text||'',text:word.text||segment.text||'',unitCount:0,unitStart:segment.unitStart||0,unitEnd:segment.unitEnd||segment.unitStart||0,crossesWordBoundary:false,sourceWords:[{text:word.text||segment.text||'',lemma:'',unitStart:segment.unitStart||0,unitEnd:segment.unitEnd||segment.unitStart||0}]};
}

function combinePartialSpanRoutes(phonetics={},plannedSegments=[],{mode='general'}={}){
  const operations=[];let coverageUnits=0;let uncoveredUnits=0;let score=0;
  for(const item of plannedSegments){
    if(item.segment.kind==='unresolved_word'){operations.push(unresolvedOperation(item.segment));continue;}
    const route=item.route;
    if(!route)continue;
    operations.push(...route.operations);coverageUnits+=route.coverageUnits||0;uncoveredUnits+=route.uncoveredUnits||0;score+=route.score||0;
  }
  const targetUnits=phonetics.unitCount||0;
  const unresolvedWordCount=phonetics.unresolvedWords.length;
  const crossWordOperationCount=operations.filter(operation=>operation.crossesWordBoundary&&operation.kind!=='gap').length;
  const crossWordGapCount=operations.filter(operation=>operation.crossesWordBoundary&&operation.kind==='gap').length;
  const complete=unresolvedWordCount===0&&uncoveredUnits===0&&coverageUnits===targetUnits;
  return {targetIpa:phonetics.continuousIpa,targetUnits,coverageUnits,uncoveredUnits,unresolvedWordCount,complete,exact:complete&&operations.every(operation=>operation.phoneticTier==='exact'),mode,operations,crossWordOperationCount,crossWordGapCount,scoreBreakdown:{coverageRatio:targetUnits?Number((coverageUnits/targetUnits).toFixed(4)):0,uncoveredUnits,unresolvedWordCount,pieceCount:operations.filter(operation=>!['gap','unresolved_word'].includes(operation.kind)).length},score:Number(score.toFixed(4))};
}

export function planPhraseRepresentationPaths(value='',pronunciationSource={},bankRows=[],options={}){
  const phonetics=phraseToContinuousIPA(value,pronunciationSource);
  const resolvedSpans=phonetics.segments.filter(segment=>segment.kind==='resolved_span'&&segment.ipa);
  if(!resolvedSpans.length)return {phonetics,routes:[],status:'unresolved_phrase_pronunciation'};
  const optionIndex=options.optionIndex?.kind==='representation_path_index'?options.optionIndex:buildRepresentationPathIndex(bankRows,{includeLexicalApproximation:false});
  const plannerOptions={...options,optionIndex};
  if(phonetics.complete){
    const routes=planRepresentationPaths(phonetics.continuousIpa,bankRows,plannerOptions).map(route=>annotateRouteWordBoundaries(route,phonetics));
    return {phonetics,routes,status:routes.length?'routes_found':'no_representation_route',optionIndexStats:{optionCount:optionIndex.optionCount,generalOptionCount:optionIndex.generalOptionCount,strictOptionCount:optionIndex.strictOptionCount}};
  }
  const plannedSegments=phonetics.segments.map(segment=>{
    if(segment.kind!=='resolved_span')return {segment,route:null};
    const route=planRepresentationPaths(segment.ipa,bankRows,plannerOptions)[0]||null;
    return {segment,route:route?annotateRouteWordBoundaries(route,phonetics,{words:segment.words,unitStart:segment.unitStart}):null};
  });
  const combined=combinePartialSpanRoutes(phonetics,plannedSegments,{mode:options.mode||'general'});
  return {phonetics,routes:[combined],status:'partial_phrase_pronunciation',optionIndexStats:{optionCount:optionIndex.optionCount,generalOptionCount:optionIndex.generalOptionCount,strictOptionCount:optionIndex.strictOptionCount}};
}
