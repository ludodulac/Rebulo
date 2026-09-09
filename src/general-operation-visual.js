const GENERAL_VISUAL_TYPES=new Set(['grapheme_sound','contextual_grapheme','explicit_deletion','explicit_substitution','repetition']);

export function generalOperationVisual(piece={}){
  if(!GENERAL_VISUAL_TYPES.has(piece?.operationType))return null;
  if(piece.operationType==='grapheme_sound'){
    const grapheme=String(piece.grapheme||'').trim();
    const ipa=String(piece.ipa||'').trim();
    if(!grapheme||!ipa)return null;
    return {kind:'grapheme-sound',grapheme,ipa,reading:String(piece.reading||'').trim()||null,visual:'grapheme_with_sound_cue'};
  }
  if(piece.operationType==='contextual_grapheme'){
    const grapheme=String(piece.grapheme||'').trim();
    const ipa=String(piece.ipa||'').trim();
    const sourceWord=String(piece.sourceWord||'').trim();
    const sourceIpa=String(piece.sourceIpa||'').trim();
    const context=String(piece.context||'').trim();
    if(!grapheme||!ipa||!sourceWord||!sourceIpa||!context)return null;
    return {kind:'contextual-grapheme',grapheme,ipa,sourceWord,sourceIpa,context,visual:'grapheme_with_source_evidence'};
  }
  if(!piece?.image)return null;
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
