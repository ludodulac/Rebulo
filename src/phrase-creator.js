import {buildCreatorCandidate,buildGeneralCreatorCandidate} from './creator-runtime.js';

export const PLAYFUL_PHRASES=Object.freeze([
  'Papa dessine un chat','Le chat regarde papa','Papa tourne près du lit','Le rat file vers le lit','Le chat dort sur le lit','Le rat passe sous le lit','Le chat suit le rat','Le rat regarde le riz','Papa prépare le riz','Le chat renifle le riz','Le rat fait un détour','Papa va au cinéma','Merci papa','Merci pour le dessin','Le rat sous le parapluie','La souris sous le parasol','Un souci sous le soleil','Le chat joue sous la pluie','Papa prend le parapluie','Le rat tourne autour du dé','Le chat cherche la clé','La clé est près du lit','Le dé roule sous le lit','Le rat passe près de la tour','Papa dessine une tour','Le chat regarde la mer','Merci pour le cinéma','Le rat et le chat jouent','Papa cherche la clé du lit','Le chat attend sous le parasol'
]);

const PHRASE_SYMBOLS=Object.freeze({un:{symbol:'1',reading:'un',convention:'numeric_symbol'}});
export function normalizePhraseWord(value=''){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');}
export function tokenizePhrase(value=''){const text=String(value||'');const tokens=[];const pattern=/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*|[^\p{L}\p{N}]+/gu;for(const match of text.matchAll(pattern)){const token=match[0];const word=/[\p{L}\p{N}]/u.test(token);tokens.push({kind:word?'word':'separator',text:token});}return tokens;}
export function isPhraseInput(value=''){return tokenizePhrase(value).filter(token=>token.kind==='word').length>1;}
function viableCandidate(target,lexicon=[],therapyDefinitions=[]){if(!target||target.assets!=='ready')return null;if(target.mode==='strict')return buildCreatorCandidate(target,lexicon,therapyDefinitions);if(target.mode==='general')return buildGeneralCreatorCandidate(target,lexicon);return null;}
function directPictogram(key,lexicon=[]){const item=(lexicon||[]).find(entry=>entry?.active&&entry?.image&&normalizePhraseWord(entry.label)===key);if(!item)return null;return {answer:item.label,targetIpa:item.ipa,pieces:[{image:item.image,reading:item.label,ipa:item.ipa}],construction:{mode:'strict',source:'direct_pictogram'}};}
export function buildPhrasePlan(value='',targets=[],lexicon=[],therapyDefinitions=[]){
  const tokens=tokenizePhrase(value);const targetMap=new Map();for(const target of targets||[]){const key=normalizePhraseWord(target?.target);if(key&&!targetMap.has(key))targetMap.set(key,target);}
  let wordCount=0;let rebusCount=0;let conventionCount=0;
  const planned=tokens.map(token=>{
    if(token.kind!=='word')return token;wordCount+=1;const key=normalizePhraseWord(token.text);const target=targetMap.get(key)||null;const candidate=viableCandidate(target,lexicon,therapyDefinitions);
    if(candidate){rebusCount+=1;return {kind:'rebus',text:token.text,mode:target.mode,target,candidate};}
    const direct=directPictogram(key,lexicon);if(direct){rebusCount+=1;return {kind:'rebus',text:token.text,mode:'strict',target:{target:token.text,source:'direct-pictogram'},candidate:direct};}
    const symbol=PHRASE_SYMBOLS[key];if(symbol){rebusCount+=1;conventionCount+=1;return {kind:'symbol',text:token.text,...symbol,mode:'general'};}
    return {kind:'text',text:token.text,reason:target?'not_renderable':'not_available'};
  });
  return {input:String(value||''),tokens:planned,wordCount,rebusCount,conventionCount,textCount:Math.max(0,wordCount-rebusCount),complete:wordCount>0&&rebusCount===wordCount};
}
export function playfulPhraseAt(index=0){const size=PLAYFUL_PHRASES.length;if(!size)return '';const safe=((Number(index)||0)%size+size)%size;return PLAYFUL_PHRASES[safe];}
