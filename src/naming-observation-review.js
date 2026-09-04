const exportKeys=new Set(['schemaVersion','sessionCode','concept','comparisonRevision','targetIpa','candidateIds','observations','researchNotice']);
const observationKeys=new Set(['candidateId','responseVerbatim','hesitation','noResponse']);

function normalizedResponse(value=''){
  return String(value).trim().normalize('NFC').toLocaleLowerCase('fr-FR');
}

function comparisonFor(comparisons=[],concept=''){
  return (comparisons||[]).find(item=>item.concept===concept)||null;
}

export function validateNamingObservationExport(payload={},comparisons=[]){
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return null;
  if(Object.keys(payload).some(key=>!exportKeys.has(key)))return null;
  if(payload.schemaVersion!=='1.0'||!payload.sessionCode||!payload.concept||!payload.comparisonRevision||!payload.targetIpa)return null;
  if(!/^[a-zA-Z0-9_-]{1,32}$/.test(String(payload.sessionCode)))return null;
  if(!Array.isArray(payload.candidateIds)||!Array.isArray(payload.observations))return null;
  const comparison=comparisonFor(comparisons,payload.concept);
  if(!comparison||comparison.targetIpa!==payload.targetIpa||comparison.revision!==payload.comparisonRevision)return null;
  const expectedIds=(comparison.candidates||[]).map(item=>item.candidateId);
  if(payload.candidateIds.length!==expectedIds.length||new Set(payload.candidateIds).size!==payload.candidateIds.length)return null;
  if(expectedIds.some(id=>!payload.candidateIds.includes(id)))return null;
  if(payload.observations.length!==expectedIds.length)return null;
  const seen=new Set();
  const observations=[];
  for(const observation of payload.observations){
    if(!observation||typeof observation!=='object'||Array.isArray(observation))return null;
    if(Object.keys(observation).some(key=>!observationKeys.has(key)))return null;
    if(!payload.candidateIds.includes(observation.candidateId)||seen.has(observation.candidateId))return null;
    if(typeof observation.hesitation!=='boolean'||typeof observation.noResponse!=='boolean')return null;
    const responseVerbatim=String(observation.responseVerbatim??'').trim();
    if(observation.noResponse&&responseVerbatim)return null;
    if(!observation.noResponse&&(!responseVerbatim||responseVerbatim.length>120))return null;
    seen.add(observation.candidateId);
    observations.push({candidateId:observation.candidateId,responseVerbatim,hesitation:observation.hesitation,noResponse:observation.noResponse});
  }
  return {schemaVersion:'1.0',sessionCode:String(payload.sessionCode),concept:payload.concept,comparisonRevision:payload.comparisonRevision,targetIpa:payload.targetIpa,candidateIds:[...payload.candidateIds],observations};
}

export function buildNamingObservationReview(payloads=[],comparisons=[]){
  if(!Array.isArray(payloads)||!payloads.length)return null;
  const sessions=[];
  const sessionKeys=new Set();
  for(const payload of payloads){
    const session=validateNamingObservationExport(payload,comparisons);
    if(!session)return null;
    const key=`${session.concept}:${session.comparisonRevision}:${session.sessionCode}`;
    if(sessionKeys.has(key))return null;
    sessionKeys.add(key);sessions.push(session);
  }
  const concepts=[];
  for(const comparison of comparisons||[]){
    const conceptSessions=sessions.filter(item=>item.concept===comparison.concept&&item.comparisonRevision===comparison.revision);
    if(!conceptSessions.length)continue;
    const candidateSummaries=[];
    for(const candidate of comparison.candidates||[]){
      const observations=conceptSessions.map(session=>session.observations.find(item=>item.candidateId===candidate.candidateId)).filter(Boolean);
      const responseMap=new Map();
      let hesitationCount=0,noResponseCount=0,targetResponseCount=0;
      for(const observation of observations){
        if(observation.hesitation)hesitationCount+=1;
        if(observation.noResponse){noResponseCount+=1;continue;}
        const normalized=normalizedResponse(observation.responseVerbatim);
        if(normalized===normalizedResponse(comparison.concept))targetResponseCount+=1;
        const current=responseMap.get(normalized)||{response:observation.responseVerbatim,count:0};
        current.count+=1;responseMap.set(normalized,current);
      }
      const responses=[...responseMap.values()].sort((a,b)=>b.count-a.count||a.response.localeCompare(b.response,'fr'));
      candidateSummaries.push({candidateId:candidate.candidateId,asset:candidate.asset||'',observationCount:observations.length,targetResponseCount,hesitationCount,noResponseCount,responses});
    }
    concepts.push({concept:comparison.concept,comparisonRevision:comparison.revision,targetIpa:comparison.targetIpa,sessionCount:conceptSessions.length,candidates:candidateSummaries});
  }
  return {schemaVersion:'1.0',kind:'descriptive_naming_observation_review',sessionCount:sessions.length,concepts,researchNotice:'Descriptive counts from imported anonymous observations tied to an explicit comparison revision only. No automatic prototype activation or clinical validation.'};
}
