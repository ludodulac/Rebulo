const allowedDecisions=new Set(['keep','rework','reject']);

export function createResearchCuration(registry={}){
  const comparisons=Array.isArray(registry.comparisons)?registry.comparisons:[];
  const items=[];
  for(const comparison of comparisons){
    for(const candidate of comparison.candidates||[]){
      if(!candidate?.candidateId) continue;
      items.push({concept:comparison.concept||'',candidateId:candidate.candidateId,decision:null,note:''});
    }
  }
  return {schemaVersion:'1.0',kind:'visual_research_curation',items};
}

export function setResearchCurationDecision(session={},candidateId='',decision=null,note=''){
  if(!session||!Array.isArray(session.items)||!candidateId) return null;
  if(decision!==null&&!allowedDecisions.has(decision)) return null;
  const cleanNote=String(note||'').trim().slice(0,240);
  let found=false;
  const items=session.items.map(item=>{
    if(item.candidateId!==candidateId) return item;
    found=true;
    return {...item,decision,note:cleanNote};
  });
  return found?{...session,items}:null;
}

export function researchCurationSummary(session={}){
  const counts={keep:0,rework:0,reject:0,unreviewed:0};
  for(const item of session.items||[]){
    if(allowedDecisions.has(item.decision)) counts[item.decision]+=1;
    else counts.unreviewed+=1;
  }
  return counts;
}

export function researchCurationExport(session={}){
  if(!session||!Array.isArray(session.items)) return null;
  return {
    schemaVersion:'1.0',
    kind:'visual_research_curation',
    decisions:session.items.filter(item=>allowedDecisions.has(item.decision)).map(item=>({concept:item.concept,candidateId:item.candidateId,decision:item.decision,note:item.note||''})),
    researchNotice:'Visual design curation only. Not naming-test evidence, not clinical validation, and not an activation decision.'
  };
}
