import {normalizeIPA,segmentTargetWithLexicon,splitIPAUnits} from './phonetic-engine.js';
import {letterReadingForIPA} from './creator-catalog.js';

function activeStrictLexicon(lexicon=[]){
  return (lexicon||[])
    .filter(item=>item?.active!==false&&item?.strictEligible!==false&&item?.ipa&&(item?.label||item?.id))
    .map(item=>({...item,normalizedIPA:normalizeIPA(item.ipa)}))
    .filter(item=>item.normalizedIPA);
}

function operationKey(operation={}){
  if(operation.type==='whole_word')return `word:${operation.pieceId||operation.label||''}`;
  return `grapheme:${operation.grapheme||''}`;
}

export function strictSyllableCoverage(ipa='',lexicon=[],maxPieces=4){
  const normalized=normalizeIPA(ipa);
  if(!normalized)return null;
  const decompositions=segmentTargetWithLexicon(normalized,activeStrictLexicon(lexicon),maxPieces);
  if(!decompositions.length)return null;
  const best=[...decompositions].sort((a,b)=>a.length-b.length)[0];
  return {
    mode:'strict',
    coverageType:best.length===1?'whole_word':'composite_words',
    operations:best.map(piece=>({type:'whole_word',pieceId:piece.id||piece.label,label:piece.label,ipa:normalizeIPA(piece.ipa)}))
  };
}

export function generalLetterSyllableCoverage(ipa='',lexicon=[],maxOperations=4){
  const targetUnits=splitIPAUnits(ipa);
  if(!targetUnits.length)return null;
  const target=targetUnits.join('');
  const words=activeStrictLexicon(lexicon);
  const results=[];

  function walk(offset,operations,usedGrapheme){
    if(operations.length>maxOperations)return;
    if(offset===targetUnits.length){
      if(usedGrapheme)results.push(operations);
      return;
    }
    const remainder=targetUnits.slice(offset).join('');
    for(const word of words){
      if(!remainder.startsWith(word.normalizedIPA))continue;
      const consumed=splitIPAUnits(word.normalizedIPA).length;
      walk(offset+consumed,[...operations,{type:'whole_word',pieceId:word.id||word.label,label:word.label,ipa:word.normalizedIPA}],usedGrapheme);
    }
    for(let end=offset+1;end<=targetUnits.length;end++){
      const prefix=targetUnits.slice(offset,end).join('');
      const letter=letterReadingForIPA(prefix);
      if(!letter)continue;
      walk(end,[...operations,{type:'grapheme',grapheme:letter.grapheme,reading:letter.reading,ipa:normalizeIPA(letter.ipa)}],true);
    }
  }

  walk(0,[],false);
  if(!results.length)return null;
  const unique=[...new Map(results.map(operations=>[operations.map(operationKey).join('+'),operations])).values()];
  const best=unique.sort((a,b)=>a.length-b.length||a.filter(op=>op.type==='grapheme').length-b.filter(op=>op.type==='grapheme').length)[0];
  return {mode:'general',coverageType:'explicit_grapheme',operations:best};
}

export function classifySyllableCoverage(ipa='',lexicon=[],maxOperations=4){
  const strict=strictSyllableCoverage(ipa,lexicon,maxOperations);
  if(strict)return strict;
  const general=generalLetterSyllableCoverage(ipa,lexicon,maxOperations);
  if(general)return general;
  return {mode:'research',coverageType:'uncovered',operations:[]};
}

export function analyzeSyllableInventoryCoverage(inventory=[],lexicon=[],maxOperations=4){
  const rows=(inventory||[]).map(item=>({
    ...item,
    coverage:classifySyllableCoverage(item?.ipa||'',lexicon,maxOperations)
  }));
  const counts={whole_word:0,composite_words:0,explicit_grapheme:0,uncovered:0};
  for(const row of rows){
    const type=row.coverage.coverageType;
    counts[type]=(counts[type]||0)+1;
  }
  return {counts,rows};
}
