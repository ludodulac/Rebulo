function clean(value=''){return String(value??'').trim();}
function cleanSessionCode(value=''){return clean(value).replace(/[^A-Za-z0-9_-]/g,'').slice(0,32);}

export function comprehensionItems(registry={}){
  return (registry.sets||[]).flatMap(set=>(set.items||[]).map(item=>({...item,setId:set.setId,operationType:set.operationType}))).filter(item=>item.id&&item.grapheme&&item.ipa);
}

export function orderedComprehensionItems(items=[],mode='random',random=Math.random){
  const copy=[...items];
  if(mode==='forward')return copy;
  if(mode==='reverse')return copy.reverse();
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}

export function createComprehensionSession(registry={},options={}){
  const sessionCode=cleanSessionCode(options.sessionCode);
  const items=comprehensionItems(registry);
  if(!sessionCode||!items.length)return null;
  const ordered=orderedComprehensionItems(items,options.orderMode||'random',options.random||Math.random);
  return {schemaVersion:'1.0',kind:'general_operation_comprehension_session',sessionCode,protocolVersion:registry.schemaVersion||'1.0',itemIds:ordered.map(item=>item.id),observations:[]};
}

export function recordComprehensionObservation(session,item,input={}){
  if(!session||!item?.id||!session.itemIds?.includes(item.id)||session.observations?.some(row=>row.itemId===item.id))return null;
  const noResponse=Boolean(input.noResponse);
  const interpretationVerbatim=noResponse?'':clean(input.interpretationVerbatim);
  if(!noResponse&&!interpretationVerbatim)return null;
  return {...session,observations:[...(session.observations||[]),{itemId:item.id,interpretationVerbatim,hesitation:Boolean(input.hesitation),noResponse,misreading:Boolean(input.misreading)}]};
}

export function comprehensionSessionExport(session){
  if(!session?.sessionCode||!session?.protocolVersion||!Array.isArray(session.observations)||!session.observations.length)return null;
  return {
    schemaVersion:'1.0',
    kind:'general_operation_comprehension_observations',
    sessionCode:session.sessionCode,
    protocolVersion:session.protocolVersion,
    observations:session.observations.map(row=>({...row})),
    researchNotice:'Human comprehension observations only. No automatic promotion, authorization, or clinical validation.'
  };
}
