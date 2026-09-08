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

function lexicalLeads(opportunity={}){
  return (opportunity.wholeWordCandidates||[]).slice(0,4).map(candidate=>({
    word:candidate.word,
    lemma:candidate.lemma,
    pos:candidate.pos,
    frequency:candidate.frequency,
    phoneticStatus:candidate.phoneticStatus,
    activationState:'research_only'
  }));
}

function routeScore(route={}){
  const strictBonus=route.mode==='strict'?1000:0;
  const lexicalBonus=route.lexicalLeads?.length?120:0;
  const operationPenalty=(route.operations?.length||0)*25;
  const graphemePenalty=(route.operations||[]).filter(operation=>operation.type==='grapheme').length*120;
  return strictBonus+lexicalBonus-operationPenalty-graphemePenalty+Number(route.alternativeUsefulUnlocked||0);
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
        const route={
          alternativeIpa,
          mode:coverage.mode,
          coverageType:coverage.coverageType,
          operations:coverage.operations,
          lexicalLeads:lexicalLeads(alternative),
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
      targets.push({
        key:target.key,
        word:target.word,
        targetIpa,
        ageBandCandidate:target.ageBandCandidate,
        rebuloUtilityTier:target.rebuloUtilityTier,
        alternativeRouteCount:unique.length,
        routes:unique.slice(0,maxRoutesPerTarget),
        resolutionState:unique.length?'exact_alternative_routes_found':'still_needs_new_representation_or_rule'
      });
    }
    rows.push({
      ipa,
      strategy:strategy.strategy,
      sourceUsefulUnlocked:Number(source.usefulUnlocked)||0,
      targetCount:targets.length,
      targetsWithAlternativeRoutes:targets.filter(target=>target.alternativeRouteCount>0).length,
      targetsStillBlocked:targets.filter(target=>target.alternativeRouteCount===0).length,
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
    targetsStillBlocked:targets.filter(target=>target.alternativeRouteCount===0).length,
    strictAlternativeTargets:targets.filter(target=>(target.routes||[]).some(route=>route.mode==='strict')).length,
    generalAlternativeTargets:targets.filter(target=>(target.routes||[]).some(route=>route.mode==='general')).length
  };
}
