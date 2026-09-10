const FUNCTION_LIKE_POS=new Set(['DET','ADJ','PRO','ADV','CON','PRE','VER']);
const rejected=new Set(['visual_route_rejected','visual_route_deferred']);
function posFamily(value=''){return String(value||'').trim().toUpperCase().split(':')[0];}

export function differentialPreselectionEvidence(row={}){
  const viable=(row.exactCandidates||[]).filter(candidate=>!rejected.has(candidate.proofStatus));
  const nouns=viable.filter(candidate=>candidate.noun===true||posFamily(candidate.pos)==='NOM');
  const nonNouns=viable.filter(candidate=>!(candidate.noun===true||posFamily(candidate.pos)==='NOM'));
  const functionLike=viable.filter(candidate=>FUNCTION_LIKE_POS.has(posFamily(candidate.pos)));
  let score=0;const signals=[];
  if(viable.length>=2){score+=5;signals.push('multiple_exact_candidates');}
  if(nouns.length&&nonNouns.length){score+=6;signals.push('noun_vs_non_noun_contrast');}
  if(nouns.length>=2){score+=3;signals.push('multiple_nouns');}
  if(functionLike.length&&nouns.length){score+=2;signals.push('function_like_vs_noun');}
  if(Number(row.registeredAssetCandidateCount)>0){score+=7;signals.push('registered_asset');}
  if(Number(row.researchAssetLeadCandidateCount)>0){score+=4;signals.push('research_asset_lead');}
  if((row.visibleConventions||[]).length){score+=4;signals.push('visible_convention');}
  if(row.twoSyllableFirstClass===true){score+=4;signals.push('two_syllable');}
  const yieldCount=Number(row.usefulTargetCount)||0;
  if(yieldCount>=20){score+=3;signals.push('high_useful_yield');}else if(yieldCount>=8)score+=2;else if(yieldCount>=3)score+=1;
  if(Number(row.curatedVisualHypothesisCount)>0)score-=100;
  return {score,signals,viableExactCandidateCount:viable.length,nounCandidateCount:nouns.length,nonNounCandidateCount:nonNouns.length,functionLikeCandidateCount:functionLike.length};
}

export function buildDifferentialPreselection(rows=[],{limit=220,twoSyllableReserve=80,minScore=7}={}){
  const ranked=(rows||[]).map(row=>({row,evidence:differentialPreselectionEvidence(row)}))
    .filter(item=>item.evidence.score>=minScore&&Number(item.row.curatedVisualHypothesisCount)===0)
    .sort((a,b)=>b.evidence.score-a.evidence.score||(b.row.usefulTargetCount||0)-(a.row.usefulTargetCount||0)||String(a.row.ipa).localeCompare(String(b.row.ipa)));
  const global=ranked.slice(0,limit);
  const two=ranked.filter(item=>item.row.twoSyllableFirstClass===true).slice(0,twoSyllableReserve);
  const chosen=[...new Map([...global,...two].map(item=>[item.row.ipa,item])).values()];
  return chosen.map((item,index)=>({
    rank:index+1,ipa:item.row.ipa,syllableSpans:item.row.syllableSpans||[],twoSyllableFirstClass:item.row.twoSyllableFirstClass===true,
    usefulTargetCount:Number(item.row.usefulTargetCount)||0,usefulWeightedGain:Number(item.row.usefulWeightedGain)||0,
    exactCandidates:(item.row.exactCandidates||[]).map(candidate=>({word:candidate.word,pos:candidate.pos,frequency:candidate.frequency,proofStatus:candidate.proofStatus,knownAssets:candidate.knownAssets||[]})),
    visibleConventions:item.row.visibleConventions||[],registeredAssetCandidateCount:Number(item.row.registeredAssetCandidateCount)||0,
    researchAssetLeadCandidateCount:Number(item.row.researchAssetLeadCandidateCount)||0,preselectionScore:item.evidence.score,preselectionSignals:item.evidence.signals,
    candidateStructure:{viableExactCandidateCount:item.evidence.viableExactCandidateCount,nounCandidateCount:item.evidence.nounCandidateCount,nonNounCandidateCount:item.evidence.nonNounCandidateCount,functionLikeCandidateCount:item.evidence.functionLikeCandidateCount},
    visualDecision:'unknown',spontaneousNamingRisk:'unknown',humanNamingEvidence:'none',clinicalEvidence:'none',automaticActivation:false
  }));
}
