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

function routeScore(route={}){
  const strictBonus=route.mode==='strict'?1000:0;
  const representationBonus=route.representationLeads?.length?180:0;
  const operationPenalty=(route.operations?.length||0)*25;
  const graphemePenalty=(route.operations||[]).filter(operation=>operation.type==='grapheme').length*120;
  return strictBonus+representationBonus-operationPenalty-graphemePenalty+Number(route.alternativeUsefulUnlocked||0);
}

export function buildHardSegmentWordRoutes(strategies=[],opportunities=[],technicalInventory=[],{maxOperations=4,maxRoutesPerTarget=5}={}){
  const opportunityByIpa=new Map((opportunities||[]).map(row=>[normalizeIPA(row.ipa),row]));
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
        const route={
          alternativeIpa,
          mode:coverage.mode,
          coverageType:coverage.coverageType,
          operations:coverage.operations,
          lexicalLeads:leads.slice(0,4),
          representationLeads:representable,
          representationStatus:representable.length?'lexical_representation_candidate':'phonetic_only_unresolved_alternative',
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
      targets.push({
        key:target.key,
        word:target.word,
        targetIpa,
        ageBandCandidate:target.ageBandCandidate,
        rebuloUtilityTier:target.rebuloUtilityTier,
        alternativeRouteCount:unique.length,
        representableAlternativeRouteCount:representableCount,
        routes:retained,
        resolutionState:unique.length?'exact_alternative_routes_found':'still_needs_new_representation_or_rule',
        representationResolutionState:representableCount?'representable_alternative_candidate_found':'still_needs_representable_alternative'
      });
    }
    rows.push({
      ipa,
      strategy:strategy.strategy,
      sourceUsefulUnlocked:Number(source.usefulUnlocked)||0,
      targetCount:targets.length,
      targetsWithAlternativeRoutes:targets.filter(target=>target.alternativeRouteCount>0).length,
      targetsWithRepresentableAlternativeRoutes:targets.filter(target=>target.representableAlternativeRouteCount>0).length,
      targetsStillBlocked:targets.filter(target=>target.alternativeRouteCount===0).length,
      targetsStillNeedingRepresentableAlternative:targets.filter(target=>target.representableAlternativeRouteCount===0).length,
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
    targetsStillBlocked:targets.filter(target=>target.alternativeRouteCount===0).length,
    targetsStillNeedingRepresentableAlternative:targets.filter(target=>target.representableAlternativeRouteCount===0).length,
    strictAlternativeTargets:targets.filter(target=>(target.routes||[]).some(route=>route.mode==='strict')).length,
    strictRepresentableAlternativeTargets:targets.filter(target=>(target.routes||[]).some(route=>route.mode==='strict'&&route.representationStatus==='lexical_representation_candidate')).length,
    generalAlternativeTargets:targets.filter(target=>(target.routes||[]).some(route=>route.mode==='general')).length
  };
}
