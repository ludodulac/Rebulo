function usableAsset(value=''){
  const asset=String(value||'').trim();
  if(!asset)return false;
  if(/^assets\//.test(asset))return /\.(svg|png|jpe?g|webp)$/i.test(asset);
  return /^https:\/\//.test(asset)&&/\.(svg|png|jpe?g|webp)(?:[?#].*)?$/i.test(asset);
}

export function runnerEligibleResearchCandidate(candidate={}){
  return candidate.runnerReady===true&&usableAsset(candidate.asset||candidate.previewAsset)&&Boolean(String(candidate.sourcePage||'').trim())&&Boolean(String(candidate.license||'').trim());
}

export function runnerEligibleResearchConcept(concept={}){
  const candidates=(concept.candidates||[]).filter(runnerEligibleResearchCandidate);
  if(concept.activationState!=='research_only'||candidates.length<2)return null;
  return {
    concept:concept.concept,
    targetIpa:concept.targetIpa,
    activationState:'inactive_until_human_decision',
    candidates:candidates.map(candidate=>({
      candidateId:candidate.candidateId,
      asset:candidate.asset||candidate.previewAsset,
      provenance:`${candidate.sourceLabel||candidate.candidateId}; ${candidate.license}; ${candidate.sourcePage}`,
      availability:'available',
      designIntent:candidate.designIntent||'Candidat de recherche promu après revue explicite du stimulus.',
      namingRisks:[...(candidate.namingRisks||[])],
      namingTestStatus:'not_run'
    })),
    humanDecision:null
  };
}

export function runnerEligibleResearchConcepts(bank={}){
  return (bank.concepts||[]).map(runnerEligibleResearchConcept).filter(Boolean);
}
