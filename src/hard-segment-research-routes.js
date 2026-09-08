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
  return {label,sourceIpa:sourceIpa||null,targetIpa,operationType:String(fallback.operationType||'').trim()||null,fallbackStatus:fallback.status||evidence.fallbackStatus||'research_only_not_authorized',nextGate:fallback.nextGate||evidence.nextGate||null};
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

function operationLabel(operation={}){
  const label=String(operation.label||operation.grapheme||'').trim();
  const ipa=normalizeIPA(operation.ipa||'');
  return label&&ipa?`${label}→/${ipa}/`:label;
}

function documentedComposedFallbacks(group={}){
  const targetIpa=normalizeIPA(group.researchIpa||'');
  const rows=[];
  for(const row of group?.strategyEvidence||[]){
    for(const composition of row?.evidence?.composedFallbackResearch||[]){
      const ipa=normalizeIPA(composition?.ipa||'');
      const operations=Array.isArray(composition?.operations)?composition.operations:[];
      if(!ipa||ipa!==targetIpa||operations.length<2)continue;
      const built=operations.map(operation=>normalizeIPA(operation?.ipa||'')).join('');
      if(!built||built!==ipa)continue;
      rows.push({label:operations.map(operationLabel).join(' + '),sourceIpa:row.ipa||null,targetIpa:ipa,operationType:'composed_general_operation',operations,fallbackStatus:composition.status||'composed_general_mode_research_only',nextGate:composition.nextGate||null});
    }
  }
  return rows;
}

function documentedBankOperations(group={}){
  return (group?.candidateBankEvidence?.candidates||[]).filter(isVisibleGeneralOperationCandidate).map(candidate=>({label:candidate.label,candidateType:candidate.candidateType,researchDecision:candidate.researchDecision||null,nextGate:candidate.nextGate||null}));
}

function documentedVisualCandidates(group={}){
  return (group?.candidateBankEvidence?.candidates||[]).filter(isPictogramOrSceneCandidate).map(candidate=>({label:candidate.label,candidateType:candidate.candidateType,visualPlausibility:candidate.visualPlausibility||null,spontaneousNamingRisk:candidate.spontaneousNamingRisk||null,researchDecision:candidate.researchDecision||null,nextGate:candidate.nextGate||null}));
}

function rejectedBankCandidates(group={}){
  const candidates=group?.candidateBankEvidence?.candidates||[];
  if(!candidates.length||!candidates.every(candidate=>candidate.researchDecision==='reject_visual_priority'))return [];
  return candidates.map(candidate=>candidate.label).filter(Boolean);
}

export function classifyPictogramResearchTriage(group={}){
  const route=group?.researchRoute||classifyVisualResearchRoute(group);
  if(route.routeClass!=='research_pictogram_or_scene')return null;
  const candidates=route.visualCandidates||[];
  const retained=candidates.filter(candidate=>!['reject_visual_priority','fallback_only'].includes(candidate.researchDecision));
  if(retained.length){
    return {triageClass:'prototype_candidate_needs_blind_naming_test',candidateLabels:retained.map(candidate=>candidate.label),authorizationStatus:'research_only_not_naming_validated',nextAction:'prepare_contrasting_visual_variants_then_run_blind_spontaneous_naming_test'};
  }
  const rejectedLexical=rejectedBankCandidates(group);
  if(rejectedLexical.length){
    return {triageClass:'do_not_prototype_exact_lexical_candidate',candidateLabels:rejectedLexical,authorizationStatus:'research_only_visual_eligibility_rejected',nextAction:'keep_as_exact_lexical_negative_evidence_and_prefer_general_or_alternate_route'};
  }
  if(candidates.length&&candidates.every(candidate=>candidate.researchDecision==='reject_visual_priority')){
    return {triageClass:'do_not_prototype_current_visual_candidate',candidateLabels:candidates.map(candidate=>candidate.label),authorizationStatus:'research_only_visual_priority_rejected',nextAction:'keep_as_negative_visual_evidence_and_prefer_general_or_alternate_route'};
  }
  return {triageClass:'lexical_candidate_needs_visual_eligibility_review',candidateLabels:(group.lexicalCandidates||[]).map(candidate=>candidate.word).filter(Boolean),authorizationStatus:'research_only_no_visual_hypothesis',nextAction:'assess_whether_any_exact_lexical_candidate_can_be_spontaneously_named_before_drawing'};
}

export function classifyVisualResearchRoute(group={}){
  const visibleOperations=[...documentedBankOperations(group),...documentedStrategyFallbacks(group),...documentedComposedFallbacks(group)];
  const visualCandidates=documentedVisualCandidates(group);
  if(visibleOperations.length)return {routeClass:'formalize_documented_visible_general_operation',visibleOperations,visualCandidates,authorizationStatus:'research_only_not_authorized',nextAction:'define_and_test_visible_general_operation_semantics_before_any_activation'};
  if(group.needType==='curate_existing_lexical_candidate'||visualCandidates.length)return {routeClass:'research_pictogram_or_scene',visibleOperations:[],visualCandidates,authorizationStatus:'research_only_not_naming_validated',nextAction:'evaluate_spontaneous_naming_and_visual_concept_before_prototype'};
  return {routeClass:'discover_new_representation',visibleOperations:[],visualCandidates:[],authorizationStatus:'no_documented_representation_route',nextAction:'search_exact_whole_word_scene_alternate_segmentation_or_explicit_operation'};
}

export function classifyVisualResearchNeedQueue(queue=[]){
  return (queue||[]).map(group=>{
    const researchRoute=classifyVisualResearchRoute(group);
    const enriched={...group,researchRoute};
    return {...enriched,pictogramTriage:classifyPictogramResearchTriage(enriched)};
  });
}

export function visualResearchRouteStats(queue=[]){
  const targetCountsByRouteClass={research_pictogram_or_scene:0,formalize_documented_visible_general_operation:0,discover_new_representation:0};
  const groupCountsByRouteClass={research_pictogram_or_scene:0,formalize_documented_visible_general_operation:0,discover_new_representation:0};
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

export function pictogramResearchTriageStats(queue=[]){
  const targetCountsByTriageClass={prototype_candidate_needs_blind_naming_test:0,do_not_prototype_exact_lexical_candidate:0,do_not_prototype_current_visual_candidate:0,lexical_candidate_needs_visual_eligibility_review:0};
  const groupCountsByTriageClass={prototype_candidate_needs_blind_naming_test:0,do_not_prototype_exact_lexical_candidate:0,do_not_prototype_current_visual_candidate:0,lexical_candidate_needs_visual_eligibility_review:0};
  let targetCount=0;
  for(const group of queue||[]){
    const triage=group?.pictogramTriage||classifyPictogramResearchTriage(group);
    if(!triage)continue;
    const count=Number(group?.affectedTargetCount)||0;
    targetCount+=count;
    targetCountsByTriageClass[triage.triageClass]=(targetCountsByTriageClass[triage.triageClass]||0)+count;
    groupCountsByTriageClass[triage.triageClass]=(groupCountsByTriageClass[triage.triageClass]||0)+1;
  }
  return {targetCount,targetCountsByTriageClass,groupCountsByTriageClass};
}
