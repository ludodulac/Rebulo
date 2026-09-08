import {normalizeIPA} from './phonetic-engine.js';
import {classifySyllableCoverage} from './syllable-coverage.js';

function opportunityVirtualPiece(opportunity={}){
  return {
    id:`research-alt-${opportunity.ipa}`,
    label:`/${opportunity.ipa}/`,
    ipa:opportunity.ipa,
    active:true,
    strictEligible:true
  };
}

function usesAlternative(coverage={},ipa=''){
  const id=`research-alt-${ipa}`;
  return (coverage.operations||[]).some(operation=>operation.type==='whole_word'&&operation.pieceId===id);
}

function normalizedWord(value=''){
  return String(value||'').normalize('NFC').trim().toLocaleLowerCase('fr');
}

function isRepresentableLexicalLead(candidate={}){
  const word=String(candidate.word||'').normalize('NFC').trim();
  const letters=[...word].filter(char=>/\p{L}/u.test(char));
  return letters.length>=2;
}

function lexicalLeads(opportunity={}){
  return (opportunity.wholeWordCandidates||[]).slice(0,8).map(candidate=>({
    word:candidate.word,
    lemma:candidate.lemma,
    pos:candidate.pos,
    frequency:candidate.frequency,
    phoneticStatus:candidate.phoneticStatus,
    activationState:'research_only'
  }));
}

function representationLeads(leads=[]){
  return (leads||[]).filter(isRepresentableLexicalLead).slice(0,4);
}

function curatedVisualCandidateIndex(bank={}){
  const index=new Map();
  for(const segment of bank?.segments||[]){
    const ipa=normalizeIPA(segment?.ipa||'');
    if(!ipa)continue;
    for(const candidate of segment?.candidates||[]){
      const label=normalizedWord(candidate?.label||'');
      const visualConcept=String(candidate?.visualConcept||'').trim();
      const candidateType=String(candidate?.candidateType||'');
      const researchDecision=String(candidate?.researchDecision||'');
      const visuallyConcrete=/pictogram|scene/.test(candidateType)&&Boolean(visualConcept);
      const retained=!['reject_visual_priority','fallback_only'].includes(researchDecision);
      if(!label||!visuallyConcrete||!retained)continue;
      index.set(`${ipa}|${label}`,{
        label:candidate.label,
        candidateType,
        visualConcept,
        visualPlausibility:candidate.visualPlausibility||null,
        spontaneousNamingRisk:candidate.spontaneousNamingRisk||null,
        researchDecision,
        nextGate:candidate.nextGate||null,
        activationState:'research_only'
      });
    }
  }
  return index;
}

function visualResearchLeads(ipa,leads=[],visualIndex=new Map()){
  return (leads||[]).map(lead=>visualIndex.get(`${ipa}|${normalizedWord(lead.word)}`)).filter(Boolean);
}

function routeScore(route={}){
  const strictBonus=route.mode==='strict'?1000:0;
  const visualBonus=route.visualResearchLeads?.length?260:0;
  const representationBonus=route.representationLeads?.length?180:0;
  const operationPenalty=(route.operations?.length||0)*25;
  const graphemePenalty=(route.operations||[]).filter(operation=>operation.type==='grapheme').length*120;
  return strictBonus+visualBonus+representationBonus-operationPenalty-graphemePenalty+Number(route.alternativeUsefulUnlocked||0);
}

function targetVisualResearchNeed(sourceIpa='',routes=[]){
  const visual=routes.find(route=>route.visualResearchStatus==='curated_visual_research_candidate');
  if(visual)return null;
  const lexical=routes.find(route=>route.representationStatus==='lexical_representation_candidate');
  if(lexical)return {
    needType:'curate_existing_lexical_candidate',
    researchIpa:lexical.alternativeIpa,
    routeMode:lexical.mode,
    coverageType:lexical.coverageType,
    representationLeads:lexical.representationLeads,
    nextAction:'assess_visual_concept_then_naming_risk_before_prototype'
  };
  const phonetic=routes[0];
  if(phonetic)return {
    needType:'find_lexical_or_visible_operation_for_phonetic_brick',
    researchIpa:phonetic.alternativeIpa,
    routeMode:phonetic.mode,
    coverageType:phonetic.coverageType,
    representationLeads:[],
    nextAction:'search_exact_whole_word_or_explicit_general_operation'
  };
  return {
    needType:'resolve_source_segment',
    researchIpa:sourceIpa,
    routeMode:null,
    coverageType:'uncovered',
    representationLeads:[],
    nextAction:'compare_source_scene_lexical_and_alternate_segmentation_strategies'
  };
}

export function buildHardSegmentWordRoutes(strategies=[],opportunities=[],technicalInventory=[],{maxOperations=4,maxRoutesPerTarget=5,visualCandidateBank=null}={}){
  const opportunityByIpa=new Map((opportunities||[]).map(row=>[normalizeIPA(row.ipa),row]));
  const visualIndex=curatedVisualCandidateIndex(visualCandidateBank||{});
  const rows=[];
  for(const strategy of strategies||[]){
    const ipa=normalizeIPA(strategy?.ipa||'');
    const source=opportunityByIpa.get(ipa);
    if(!ipa||!source)continue;
    const targets=[];
    for(const target of source.usefulUnlockedTargets||[]){
      const targetIpa=normalizeIPA(target.targetIpa||'');
      const routes=[];
      for(const alternative of opportunities||[]){
        const alternativeIpa=normalizeIPA(alternative?.ipa||'');
        if(!alternativeIpa||alternativeIpa===ipa)continue;
        const virtual=opportunityVirtualPiece({...alternative,ipa:alternativeIpa});
        const coverage=classifySyllableCoverage(targetIpa,[...(technicalInventory||[]),virtual],maxOperations);
        if(coverage.coverageType==='uncovered'||!usesAlternative(coverage,alternativeIpa))continue;
        if((coverage.operations||[]).length<2)continue;
        const leads=lexicalLeads(alternative);
        const representable=representationLeads(leads);
        const visualLeads=visualResearchLeads(alternativeIpa,representable,visualIndex);
        const route={
          alternativeIpa,
          mode:coverage.mode,
          coverageType:coverage.coverageType,
          operations:coverage.operations,
          lexicalLeads:leads.slice(0,4),
          representationLeads:representable,
          representationStatus:representable.length?'lexical_representation_candidate':'phonetic_only_unresolved_alternative',
          visualResearchLeads:visualLeads,
          visualResearchStatus:visualLeads.length?'curated_visual_research_candidate':(representable.length?'lexical_only_no_curated_visual_candidate':'phonetic_only_no_visual_candidate'),
          alternativeUsefulUnlocked:Number(alternative.usefulUnlocked)||0,
          status:'research_only_exact_route'
        };
        route.score=routeScore(route);
        routes.push(route);
      }
      const unique=[...new Map(routes.map(route=>[
        `${route.alternativeIpa}|${route.operations.map(operation=>operation.type==='whole_word'?`w:${operation.pieceId}`:`g:${operation.grapheme}`).join('+')}`,
        route
      ])).values()].sort((a,b)=>b.score-a.score||a.operations.length-b.operations.length||a.alternativeIpa.localeCompare(b.alternativeIpa));
      const retained=unique.slice(0,maxRoutesPerTarget);
      const representableCount=unique.filter(route=>route.representationStatus==='lexical_representation_candidate').length;
      const visualCount=unique.filter(route=>route.visualResearchStatus==='curated_visual_research_candidate').length;
      const visualResearchNeed=visualCount?null:targetVisualResearchNeed(ipa,unique);
      targets.push({
        key:target.key,
        word:target.word,
        targetIpa,
        ageBandCandidate:target.ageBandCandidate,
        rebuloUtilityTier:target.rebuloUtilityTier,
        alternativeRouteCount:unique.length,
        representableAlternativeRouteCount:representableCount,
        curatedVisualAlternativeRouteCount:visualCount,
        routes:retained,
        resolutionState:unique.length?'exact_alternative_routes_found':'still_needs_new_representation_or_rule',
        representationResolutionState:representableCount?'representable_alternative_candidate_found':'still_needs_representable_alternative',
        visualResolutionState:visualCount?'curated_visual_research_candidate_found':(representableCount?'lexical_candidate_needs_visual_curation':'still_needs_visual_representation'),
        visualResearchNeed
      });
    }
    rows.push({
      ipa,
      strategy:strategy.strategy,
      sourceUsefulUnlocked:Number(source.usefulUnlocked)||0,
      targetCount:targets.length,
      targetsWithAlternativeRoutes:targets.filter(target=>target.alternativeRouteCount>0).length,
      targetsWithRepresentableAlternativeRoutes:targets.filter(target=>target.representableAlternativeRouteCount>0).length,
      targetsWithCuratedVisualAlternativeRoutes:targets.filter(target=>target.curatedVisualAlternativeRouteCount>0).length,
      targetsStillBlocked:targets.filter(target=>target.alternativeRouteCount===0).length,
      targetsStillNeedingRepresentableAlternative:targets.filter(target=>target.representableAlternativeRouteCount===0).length,
      targetsStillNeedingCuratedVisualAlternative:targets.filter(target=>target.curatedVisualAlternativeRouteCount===0).length,
      targets
    });
  }
  return rows;
}

function compactCandidate(candidate={}){
  return {
    label:candidate.label||null,
    candidateType:candidate.candidateType||null,
    visualPlausibility:candidate.visualPlausibility||null,
    spontaneousNamingRisk:candidate.spontaneousNamingRisk||null,
    researchDecision:candidate.researchDecision||null,
    nextGate:candidate.nextGate||null
  };
}

function candidateBankEvidence(ipa='',bank={}){
  const normalized=normalizeIPA(ipa);
  const segment=(bank?.segments||[]).find(row=>normalizeIPA(row?.ipa||'')===normalized);
  if(!segment)return null;
  return {
    recommendedRoute:segment.recommendedRoute||null,
    candidates:(segment.candidates||[]).slice(0,5).map(compactCandidate)
  };
}

function hardStrategyEvidence(sourceIpa='',registry={}){
  const normalized=normalizeIPA(sourceIpa);
  const row=(registry?.segments||[]).find(item=>normalizeIPA(item?.ipa||'')===normalized);
  if(!row)return null;
  return {
    strategy:row.strategy||null,
    lexicalLeads:row.lexicalLeads||[],
    lexicalAssessment:row.lexicalAssessment||null,
    visualHypotheses:row.visualHypotheses||[],
    visibleFallbackResearch:row.visibleFallbackResearch||[],
    fallbackStatus:row.fallbackStatus||null,
    rejectedFallbacks:row.rejectedFallbacks||[],
    nextGate:row.nextGate||null
  };
}

const VISUAL_NEED_TYPE_ORDER={
  curate_existing_lexical_candidate:0,
  find_lexical_or_visible_operation_for_phonetic_brick:1,
  resolve_source_segment:2
};

export function buildVisualResearchNeedQueue(rows=[],{visualCandidateBank=null,hardStrategyRegistry=null}={}){
  const groups=new Map();
  for(const source of rows||[]){
    for(const target of source.targets||[]){
      const need=target.visualResearchNeed;
      if(!need)continue;
      const researchIpa=normalizeIPA(need.researchIpa||source.ipa||'');
      const key=`${need.needType}|${researchIpa}`;
      let group=groups.get(key);
      if(!group){
        group={
          needType:need.needType,
          researchIpa,
          affectedTargetCount:0,
          minAgeBandCandidate:12,
          sourceSegments:[],
          lexicalCandidates:[],
          examples:[],
          routeModes:[],
          candidateBankEvidence:candidateBankEvidence(researchIpa,visualCandidateBank||{}),
          strategyEvidence:[],
          nextAction:need.nextAction,
          status:'research_only'
        };
        groups.set(key,group);
      }
      group.affectedTargetCount++;
      group.minAgeBandCandidate=Math.min(group.minAgeBandCandidate,Number(target.ageBandCandidate)||12);
      if(!group.sourceSegments.includes(source.ipa))group.sourceSegments.push(source.ipa);
      if(need.routeMode&&!group.routeModes.includes(need.routeMode))group.routeModes.push(need.routeMode);
      for(const lead of need.representationLeads||[]){
        const word=String(lead.word||'').trim();
        if(word&&!group.lexicalCandidates.some(candidate=>normalizedWord(candidate.word)===normalizedWord(word)))group.lexicalCandidates.push(lead);
      }
      if(group.examples.length<10)group.examples.push({word:target.word,targetIpa:target.targetIpa,sourceIpa:source.ipa,ageBandCandidate:target.ageBandCandidate});
    }
  }
  for(const group of groups.values()){
    group.sourceSegments.sort((a,b)=>a.localeCompare(b));
    group.routeModes.sort();
    group.lexicalCandidates=group.lexicalCandidates.slice(0,6);
    group.strategyEvidence=group.sourceSegments.map(ipa=>({ipa,evidence:hardStrategyEvidence(ipa,hardStrategyRegistry||{})})).filter(row=>row.evidence);
  }
  return [...groups.values()].sort((a,b)=>{
    const type=(VISUAL_NEED_TYPE_ORDER[a.needType]??99)-(VISUAL_NEED_TYPE_ORDER[b.needType]??99);
    if(type)return type;
    return b.affectedTargetCount-a.affectedTargetCount||a.minAgeBandCandidate-b.minAgeBandCandidate||a.researchIpa.localeCompare(b.researchIpa);
  });
}

export function visualResearchNeedStats(queue=[]){
  const counts={
    curate_existing_lexical_candidate:0,
    find_lexical_or_visible_operation_for_phonetic_brick:0,
    resolve_source_segment:0
  };
  let unresolvedTargetCount=0;
  for(const row of queue||[]){
    const count=Number(row.affectedTargetCount)||0;
    unresolvedTargetCount+=count;
    counts[row.needType]=(counts[row.needType]||0)+count;
  }
  return {
    groupCount:(queue||[]).length,
    unresolvedTargetCount,
    targetCountsByNeedType:counts
  };
}

export function hardSegmentWordRouteStats(rows=[]){
  const targets=(rows||[]).flatMap(row=>row.targets||[]);
  return {
    segmentCount:(rows||[]).length,
    targetCount:targets.length,
    targetsWithAlternativeRoutes:targets.filter(target=>target.alternativeRouteCount>0).length,
    targetsWithRepresentableAlternativeRoutes:targets.filter(target=>target.representableAlternativeRouteCount>0).length,
    targetsWithCuratedVisualAlternativeRoutes:targets.filter(target=>target.curatedVisualAlternativeRouteCount>0).length,
    targetsStillBlocked:targets.filter(target=>target.alternativeRouteCount===0).length,
    targetsStillNeedingRepresentableAlternative:targets.filter(target=>target.representableAlternativeRouteCount===0).length,
    targetsStillNeedingCuratedVisualAlternative:targets.filter(target=>target.curatedVisualAlternativeRouteCount===0).length,
    strictAlternativeTargets:targets.filter(target=>(target.routes||[]).some(route=>route.mode==='strict')).length,
    strictRepresentableAlternativeTargets:targets.filter(target=>(target.routes||[]).some(route=>route.mode==='strict'&&route.representationStatus==='lexical_representation_candidate')).length,
    strictCuratedVisualAlternativeTargets:targets.filter(target=>(target.routes||[]).some(route=>route.mode==='strict'&&route.visualResearchStatus==='curated_visual_research_candidate')).length,
    generalAlternativeTargets:targets.filter(target=>(target.routes||[]).some(route=>route.mode==='general')).length
  };
}
