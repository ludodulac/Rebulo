import {normalizeIPA} from './phonetic-engine.js';

// Lexique's legacy phoneme codes, documented in the Lexique manual.
// This table is intentionally explicit: unknown symbols must be rejected,
// never guessed from spelling or from the target IPA.
const LEXIQUE_TO_IPA=Object.freeze({
  a:'a',i:'i',y:'y',u:'u',o:'o',O:'ɔ',e:'e',E:'ɛ','°':'ə','2':'ø','9':'œ','5':'ɛ̃','1':'œ̃','@':'ɑ̃','§':'ɔ̃','3':'ə',
  j:'j','8':'ɥ',w:'w',
  p:'p',b:'b',t:'t',d:'d',k:'k',g:'g',f:'f',v:'v',s:'s',z:'z',S:'ʃ',Z:'ʒ',m:'m',n:'n',N:'ɲ',l:'l',R:'ʁ',x:'x',G:'ŋ'
});

export function lexiquePhonemeToIPA(symbol=''){
  return Object.prototype.hasOwnProperty.call(LEXIQUE_TO_IPA,symbol)?LEXIQUE_TO_IPA[symbol]:null;
}

export function convertLexiqueSyllable(value=''){
  const source=String(value||'');
  if(!source)return null;
  let ipa='';
  for(const symbol of source){
    const mapped=lexiquePhonemeToIPA(symbol);
    if(mapped===null)return null;
    ipa+=mapped;
  }
  return ipa||null;
}

export function convertLexiqueSyllabification(value=''){
  const source=String(value||'').trim();
  if(!source)return null;
  const sourceSyllables=source.split('-');
  if(sourceSyllables.some(syllable=>!syllable))return null;
  const syllables=sourceSyllables.map(convertLexiqueSyllable);
  return syllables.some(syllable=>!syllable)?null:syllables;
}

export function validateLexiqueSyllabification({sourceSyllabification='',targetIpa='',syllableCount=null}={}){
  const syllables=convertLexiqueSyllabification(sourceSyllabification);
  if(!syllables)return {ok:false,reason:'unsupported_source_notation',syllables:[]};
  if(Number.isInteger(syllableCount)&&syllableCount>0&&syllables.length!==syllableCount){
    return {ok:false,reason:'syllable_count_mismatch',syllables};
  }
  const reconstructed=normalizeIPA(syllables.join(''));
  const target=normalizeIPA(targetIpa);
  if(!target||reconstructed!==target){
    return {ok:false,reason:'target_ipa_mismatch',syllables};
  }
  return {
    ok:true,
    reason:'',
    syllables,
    ipaSyllabification:syllables.join('.')
  };
}
