import {buildGraphemeCreatorTargets} from './creator-catalog.js';

function normalizeWord(value=''){
  return String(value||'').toLowerCase().normalize('NFC');
}

function countBy(items,keyOf){
  const counts=new Map();
  for(const item of items){
    const key=keyOf(item);
    if(!key)continue;
    counts.set(key,(counts.get(key)||0)+1);
  }
  return Object.fromEntries([...counts.entries()].sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0]),'fr')));
}

function graphemePosition(target){
  const operations=target?.operations||[];
  const index=operations.findIndex(operation=>operation?.type==='grapheme');
  if(index<0)return 'none';
  if(index===0)return 'prefix';
  if(index===operations.length-1)return 'suffix';
  return 'infix';
}

export function analyzeGeneralCoverage(report={}){
  const generated=buildGraphemeCreatorTargets(report);
  const uniqueGenerated=[...new Map(generated.map(target=>[normalizeWord(target.target),target])).values()];
  const strictMultiPieceUnique=Number(report?.strictMultiPieceUniqueWordCount)||new Set(
    (report?.constructibleMultiPiece||[]).map(row=>normalizeWord(row?.word)).filter(Boolean)
  ).size;
  const graphemeUnique=uniqueGenerated.length;
  const combinedUnique=strictMultiPieceUnique+graphemeUnique;
  const gainVsStrict=strictMultiPieceUnique?graphemeUnique/strictMultiPieceUnique:0;

  return {
    strictMultiPieceUniqueWordCount:strictMultiPieceUnique,
    graphemeGeneratedUniqueWordCount:graphemeUnique,
    combinedStrictAndGraphemeUniqueWordCount:combinedUnique,
    graphemeGainVsStrict:Number(gainVsStrict.toFixed(4)),
    lettersUsed:countBy(uniqueGenerated,target=>target.operations?.find(operation=>operation?.type==='grapheme')?.grapheme||''),
    positions:countBy(uniqueGenerated,graphemePosition),
    operationCounts:countBy(uniqueGenerated,target=>String(target.operations?.length||0)),
    examples:uniqueGenerated.slice(0,20).map(target=>({
      target:target.target,
      operations:(target.operations||[]).map(operation=>operation.type==='grapheme'?operation.grapheme:operation.pieceId)
    }))
  };
}
