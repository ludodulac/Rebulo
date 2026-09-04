function normalizedCode(value=''){
  return String(value).trim().replace(/[^a-zA-Z0-9_-]/g,'').slice(0,32);
}

export function orderedCandidates(candidates=[],mode='random',random=Math.random){
  const items=Array.isArray(candidates)?candidates.map(item=>({...item})):[];
  if(mode==='reverse')return items.reverse();
  if(mode==='forward')return items;
  for(let i=items.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [items[i],items[j]]=[items[j],items[i]];
  }
  return items;
}

export function createNamingSession(comparison={},options={}){
  const sessionCode=normalizedCode(options.sessionCode);
  if(!sessionCode||!comparison?.concept||!comparison?.revision||!comparison?.targetIpa||!Array.isArray(comparison.candidates)||comparison.candidates.length===0)return null;
  const candidates=orderedCandidates(comparison.candidates,options.orderMode||'random',options.random||Math.random);
  return {
    schemaVersion:'1.0',
    sessionCode,
    concept:comparison.concept,
    comparisonRevision:comparison.revision,
    targetIpa:comparison.targetIpa,
    startedAt:new Date().toISOString(),
    orderMode:options.orderMode||'random',
    candidateIds:candidates.map(item=>item.candidateId),
    observations:[]
  };
}

export function recordNamingObservation(session,candidate={},response={}){
  if(!session||!candidate?.candidateId)return null;
  const noResponse=response.noResponse===true;
  const responseVerbatim=noResponse?'':String(response.responseVerbatim||'').trim().slice(0,120);
  if(!noResponse&&!responseVerbatim)return null;
  return {
    ...session,
    observations:[...session.observations,{
      candidateId:candidate.candidateId,
      responseVerbatim,
      hesitation:response.hesitation===true,
      noResponse
    }]
  };
}

export function namingSessionExport(session){
  if(!session?.comparisonRevision)return null;
  return {
    schemaVersion:session.schemaVersion,
    sessionCode:session.sessionCode,
    concept:session.concept,
    comparisonRevision:session.comparisonRevision,
    targetIpa:session.targetIpa,
    candidateIds:[...session.candidateIds],
    observations:session.observations.map(item=>({...item})),
    researchNotice:'Raw anonymous naming observations only. No automatic activation or clinical validation.'
  };
}
