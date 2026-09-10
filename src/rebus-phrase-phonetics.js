import {normalizeIPA,splitIPAUnits} from './phonetic-engine.js';
import {planRepresentationPaths} from './rebus-representation-paths.js';

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
    const selected=bestPronunciation(candidates);
    if(!selected){
      complete=false;
      wordTokens.push({...token,key,resolved:false,candidates:[],ipa:'',unitStart:unitOffset,unitEnd:unitOffset});
      continue;
    }
    const ipa=normalizeIPA(selected.ipa);
    const unitCount=splitIPAUnits(ipa).length;
    wordTokens.push({...token,key,resolved:true,ipa,lemma:selected.lemma||key,pos:selected.pos||'',source:selected.source||'',frequency:selected.frequency||0,candidates:candidates.slice(0,5),unitStart:unitOffset,unitEnd:unitOffset+unitCount});
    unitOffset+=unitCount;
  }
  const continuousIpa=wordTokens.filter(token=>token.resolved).map(token=>token.ipa).join('');
  return {
    input:String(value||''),
    complete:complete&&wordTokens.length>0,
    continuousIpa,
    unitCount:splitIPAUnits(continuousIpa).length,
    wordCount:wordTokens.length,
    resolvedWordCount:wordTokens.filter(token=>token.resolved).length,
    unresolvedWords:wordTokens.filter(token=>!token.resolved).map(token=>token.text),
    words:wordTokens,
    tokens
  };
}

export function annotateRouteWordBoundaries(route={},phrasePhonetics={}){
  const words=phrasePhonetics.words||[];
  let offset=0;
  const operations=(route.operations||[]).map(operation=>{
    const units=splitIPAUnits(operation.targetIpa||'');
    const start=offset;
    const end=offset+units.length;
    offset=end;
    const touched=words.filter(word=>word.resolved&&word.unitStart<end&&word.unitEnd>start).map(word=>({text:word.text,lemma:word.lemma,unitStart:word.unitStart,unitEnd:word.unitEnd}));
    return {...operation,unitStart:start,unitEnd:end,crossesWordBoundary:touched.length>1,sourceWords:touched};
  });
  return {...route,operations,crossWordOperationCount:operations.filter(operation=>operation.crossesWordBoundary).length};
}

export function planPhraseRepresentationPaths(value='',pronunciationSource={},bankRows=[],options={}){
  const phonetics=phraseToContinuousIPA(value,pronunciationSource);
  if(!phonetics.complete)return {phonetics,routes:[],status:'unresolved_phrase_pronunciation'};
  const routes=planRepresentationPaths(phonetics.continuousIpa,bankRows,options).map(route=>annotateRouteWordBoundaries(route,phonetics));
  return {phonetics,routes,status:routes.length?'routes_found':'no_representation_route'};
}
