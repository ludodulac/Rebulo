const GENERAL_VISUAL_TYPES=new Set(['explicit_deletion','explicit_substitution','repetition']);

export function generalOperationVisual(piece={}){
  if(!GENERAL_VISUAL_TYPES.has(piece?.operationType)||!piece?.image)return null;
  if(piece.operationType==='explicit_deletion'){
    if(!piece.reading||!piece.sourceReading||!piece.keep||!piece.remove)return null;
    return {kind:piece.visual==='half'?'deletion-half':'deletion-cross-out',image:piece.image,label:piece.label||piece.sourceReading,reading:piece.reading,sourceReading:piece.sourceReading,keep:piece.keep,remove:piece.remove};
  }
  if(piece.operationType==='explicit_substitution'){
    if(!piece.reading||!piece.sourceReading||!piece.replace||!piece.replacement||!['cross_out_replace','swap'].includes(piece.visual))return null;
    return {kind:'substitution',image:piece.image,label:piece.label||piece.sourceReading,reading:piece.reading,sourceReading:piece.sourceReading,replace:piece.replace,replacement:piece.replacement,visual:piece.visual};
  }
  const count=Number(piece.count);
  if(!Number.isInteger(count)||count<2||count>6||!piece.reading||!piece.sourceReading)return null;
  return {kind:'repetition',image:piece.image,label:piece.label||piece.sourceReading,reading:piece.reading,sourceReading:piece.sourceReading,count};
}
