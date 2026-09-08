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
        visualResolutionState:visualCount?'curated_visual_research_candidate_found':(representableCount?'lexical_candidate_needs_visual_curation':'still_needs_visual_representation')
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
