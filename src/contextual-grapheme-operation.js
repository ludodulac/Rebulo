import {normalizeIPA} from './phonetic-engine.js';

const RULES=Object.freeze({
  TR:Object.freeze({grapheme:'TR',position:'prefix',ipa:'tʁ'}),
  TION:Object.freeze({grapheme:'TION',position:'suffix',ipa:'sjɔ̃'}),
  SION:Object.freeze({grapheme:'SION',position:'suffix',ipa:'sjɔ̃'}),
  MENT:Object.freeze({grapheme:'MENT',position:'suffix',ipa:'mɑ̃'})
});

function normalizeWord(value=''){
  return String(value||'').trim().normalize('NFC').toLocaleUpperCase('fr-FR');
}

export function contextualGraphemeRule(grapheme=''){
  return RULES[normalizeWord(grapheme)]||null;
}

export function validateContextualGraphemeEvidence({grapheme,sourceWord,sourceIpa,segmentIpa}={}){
  const rule=contextualGraphemeRule(grapheme);
  if(!rule)return {ok:false,reason:'unsupported_contextual_grapheme'};
  const word=normalizeWord(sourceWord);
  const source=normalizeIPA(sourceIpa||'');
  const segment=normalizeIPA(segmentIpa||'');
  if(!word||!source||!segment)return {ok:false,reason:'missing_explicit_evidence'};
  if(segment!==rule.ipa)return {ok:false,reason:'segment_ipa_mismatch'};
  if(rule.position==='suffix'&&!word.endsWith(rule.grapheme))return {ok:false,reason:'orthographic_context_mismatch'};
  if(rule.position==='suffix'&&!source.endsWith(rule.ipa))return {ok:false,reason:'phonetic_context_mismatch'};
  if(rule.position==='prefix'&&!word.startsWith(rule.grapheme))return {ok:false,reason:'orthographic_context_mismatch'};
  if(rule.position==='prefix'&&!source.startsWith(rule.ipa))return {ok:false,reason:'phonetic_context_mismatch'};
  return {ok:true,reason:`exact_${rule.position}_word_and_ipa_evidence`,rule,sourceWord:String(sourceWord).trim(),sourceIpa:`/${source}/`,segmentIpa:`/${segment}/`};
}

export function buildContextualGraphemeOperation(evidence={}){
  const validation=validateContextualGraphemeEvidence(evidence);
  if(!validation.ok)return null;
  return {
    type:'contextual_grapheme',
    operationType:'contextual_grapheme',
    grapheme:validation.rule.grapheme,
    ipa:`/${validation.rule.ipa}/`,
    sourceWord:validation.sourceWord,
    sourceIpa:validation.sourceIpa,
    context:`${validation.rule.position}_exact_word_and_ipa_evidence`,
    visual:'grapheme_with_source_evidence',
    strictCompatible:false,
    automaticActivation:false
  };
}

export function canInferContextualGraphemeWithoutLexicalEvidence(){return false;}
