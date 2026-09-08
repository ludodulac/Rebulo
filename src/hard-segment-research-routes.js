import {normalizeIPA} from './phonetic-engine.js';

function candidateType(candidate={}){
  return String(candidate?.candidateType||'').trim();
}

function isVisibleGeneralOperationCandidate(candidate={}){
  const type=candidateType(candidate);
  return ['explicit_grapheme_tile','music_note_tile'].includes(type);
}

function isPictogramOrSceneCandidate(candidate={}){
  const type=candidateType(candidate);
  return /pictogram|scene/.test(type)&&Boolean(String(candidate?.label||'').trim());
}

function normalizedFallback(fallback,sourceIpa,researchIpa,evidence={}){
  if(typeof fallback==='string'){
    const label=fallback.trim();
    if(!label)return null;
    return {label,sourceIpa:sourceIpa||null,targetIpa:null,operationType:null,fallbackStatus:evidence.fallbackStatus||'research_only_not_authorized',nextGate:evidence.nextGate||null};
  }
  if(!fallback||typeof fallback!=='object')return null;
  const label=String(fallback.label||'').trim();
  const targetIpa=normalizeIPA(fallback.ipa||'');
  if(!label||!targetIpa||targetIpa!==normalizeIPA(researchIpa||''))return null;
  return {
    label,
    sourceIpa:sourceIpa||null,
    targetIpa,
    operationType:String(fallback.operationType||'').trim()||null,
    fallbackStatus:fallback.status||evidence.fallbackStatus||'research_only_not_authorized',
    nextGate:fallback.nextGate||evidence.nextGate||null
  };
}

function documentedStrategyFallbacks(group={}){
  const fallbacks=[];
  for(const row of group?.strategyEvidence||[]){
    const evidence=row?.evidence||{};
    for(const fallback of evidence.visibleFallbackResearch||[]){
      const item=normalizedFallback(fallback,row.ipa,group.researchIpa,evidence);
      if(item&&!fallbacks.some(existing=>existing.label===item.label&&existing.targetIpa===item.targetIpa))fallbacks.push(item);
    }
  }
  return fallbacks;
}

function documentedBankOperations(group={}){
  return (group?.candidateBankEvidence?.candidates||[])
    .filter(isVisibleGeneralOperationCandidate)
    .map(candidate=>({
      label:candidate.label,
      candidateType:candidate.candidateType,
      researchDecision:candidate.researchDecision||null,
      nextGate:candidate.nextGate||null
    }));
}

function documentedVisualCandidates(group={}){
  return (group?.candidateBankEvidence?.candidates||[])
    .filter(isPictogramOrSceneCandidate)
    .map(candidate=>({
      label:candidate.label,
      candidateType:candidate.candidateType,
      researchDecision:candidate.researchDecision||null,
      nextGate:candidate.nextGate||null
    }));
}

export function classifyVisualResearchRoute(group={}){
  const visibleOperations=[...documentedBankOperations(group),...documentedStrategyFallbacks(group)];
  const visualCandidates=documentedVisualCandidates(group);
  if(visibleOperations.length){
    return {
      routeClass:'formalize_documented_visible_general_operation',
      visibleOperations,
      visualCandidates,
      authorizationStatus:'research_only_not_authorized',
      nextAction:'define_and_test_visible_general_operation_semantics_before_any_activation'
    };
  }
  if(group.needType==='curate_existing_lexical_candidate'||visualCandidates.length){
    return {
      routeClass:'research_pictogram_or_scene',
      visibleOperations:[],
      visualCandidates,
      authorizationStatus:'research_only_not_naming_validated',
      nextAction:'evaluate_spontaneous_naming_and_visual_concept_before_prototype'
    };
  }
  return {
    routeClass:'discover_new_representation',
    visibleOperations:[],
    visualCandidates:[],
    authorizationStatus:'no_documented_representation_route',
    nextAction:'search_exact_whole_word_scene_alternate_segmentation_or_explicit_operation'
  };
}

export function classifyVisualResearchNeedQueue(queue=[]){
  return (queue||[]).map(group=>({...group,researchRoute:classifyVisualResearchRoute(group)}));
}

export function visualResearchRouteStats(queue=[]){
  const targetCountsByRouteClass={
    research_pictogram_or_scene:0,
    formalize_documented_visible_general_operation:0,
    discover_new_representation:0
  };
  const groupCountsByRouteClass={
    research_pictogram_or_scene:0,
    formalize_documented_visible_general_operation:0,
    discover_new_representation:0
  };
  let targetCount=0;
  for(const group of queue||[]){
    const routeClass=group?.researchRoute?.routeClass||classifyVisualResearchRoute(group).routeClass;
    const count=Number(group?.affectedTargetCount)||0;
    targetCount+=count;
    targetCountsByRouteClass[routeClass]=(targetCountsByRouteClass[routeClass]||0)+count;
    groupCountsByRouteClass[routeClass]=(groupCountsByRouteClass[routeClass]||0)+1;
  }
  return {targetCount,targetCountsByRouteClass,groupCountsByRouteClass};
}
