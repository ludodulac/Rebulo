function normalizeWord(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

function declaredPieceWords(target={}){
  const manual=Array.isArray(target?.parts)?target.parts.map(part=>part?.label):[];
  const explicit=Array.isArray(target?.pieceLabels)?target.pieceLabels:[];
  return [...new Set([...manual,...explicit].map(value=>String(value||'').trim()).filter(Boolean))];
}

export function buildCreatorRelationalActivities(target={},catalog={}){
  if(target?.mode!=='strict'||target?.assets!=='ready')return [];
  const pieces=declaredPieceWords(target);
  if(!pieces.length)return [];
  const pieceKeys=new Set(pieces.map(normalizeWord));
  const matching=Array.isArray(catalog?.rhymeMatching)?catalog.rhymeMatching:[];
  return matching.filter(activity=>pieceKeys.has(normalizeWord(activity?.targetWord))).map(activity=>{
    const choices=Array.isArray(activity?.choices)?activity.choices.map(choice=>String(choice?.word||'').trim()).filter(Boolean):[];
    if(choices.length<2||!activity?.expectedResponse)return null;
    return {
      ...activity,
      label:`Trouver une rime avec « ${activity.targetWord} »`,
      unit:'rime',
      description:`Proposé parce que « ${activity.targetWord} » est un mot-image déclaré dans ce rébus et dispose de relations de rime explicites.`,
      childInstruction:`Quel mot rime avec « ${activity.targetWord} » : ${choices.join(' ou ')} ?`,
      sessionExpectedResponse:String(activity.expectedResponse),
      focusWord:activity.targetWord,
      exposureStatus:'creator_session_pilot',
      technicalValidation:'phonological_contract',
      pedagogicalValidation:'not_evaluated'
    };
  }).filter(Boolean);
}

export function attachCreatorRelationalActivities(target={},catalog={}){
  const relationalActivities=buildCreatorRelationalActivities(target,catalog);
  return relationalActivities.length?{...target,relationalActivities}:target;
}

export function validatedCreatorRelationalActivities(target={}){
  return (Array.isArray(target?.relationalActivities)?target.relationalActivities:[]).filter(activity=>
    activity?.exposureStatus==='creator_session_pilot'&&
    activity?.technicalValidation==='phonological_contract'&&
    activity?.pedagogicalValidation==='not_evaluated'&&
    activity?.activityId==='rhyme-matching'&&
    Boolean(activity?.id&&activity?.label&&activity?.childInstruction&&activity?.proInstruction&&activity?.sessionExpectedResponse)
  );
}
