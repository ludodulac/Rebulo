import {normalizeIPA} from './phonetic-engine.js';
import {buildPhoneticSegmentInventory,classifySegmentInventory,buildSegmentResearchQueue,rankBrickOpportunities} from './phonetic-brick-map.js';

function targetKey(target={}){
  const word=String(target?.target||target?.word||'').trim().toLocaleLowerCase('fr');
  const ipa=normalizeIPA(target?.targetIpa||target?.ipa||'');
  return `${word}|${ipa}`;
}

export function buildHardRouteOpportunitySearch(researchRows=[],targets=[],technicalInventory=[],hardStrategyRegistry={}, {maxRows=250,maxOperations=4,entries=[]}={}){
  const hardIpas=[...(hardStrategyRegistry?.segments||[])].map(row=>normalizeIPA(row?.ipa||'')).filter(Boolean);
  const hardIpaSet=new Set(hardIpas);
  const sourceRows=(researchRows||[]).filter(row=>hardIpaSet.has(normalizeIPA(row?.ipa||'')));
  const sourceIpaSet=new Set(sourceRows.map(row=>normalizeIPA(row?.ipa||'')));
  const missingHardSegments=hardIpas.filter(ipa=>!sourceIpaSet.has(ipa));
  if(missingHardSegments.length){
    throw new Error(`Hard-route search is missing registered source segments: ${missingHardSegments.join(', ')}`);
  }

  const sourceOpportunities=rankBrickOpportunities(sourceRows,targets,technicalInventory,{limit:sourceRows.length,maxOperations});
  const hardTargetKeys=new Set(sourceOpportunities.flatMap(row=>(row.usefulUnlockedTargets||[]).map(target=>target.key)));
  const hardTargets=(targets||[]).filter(target=>hardTargetKeys.has(targetKey(target)));

  let routeResearchRows=researchRows||[];
  let researchPoolMode='provided_research_rows';
  if((entries||[]).length&&hardTargets.length){
    const hardTargetSegments=classifySegmentInventory(buildPhoneticSegmentInventory(hardTargets,{minUnits:1,maxUnits:5}),technicalInventory,maxOperations);
    routeResearchRows=buildSegmentResearchQueue(hardTargetSegments,entries,{candidateLimit:8,maxSegments:maxRows});
    researchPoolMode='hard_target_segment_inventory';
  }
  const opportunities=rankBrickOpportunities(routeResearchRows,hardTargets,technicalInventory,{limit:maxRows,maxOperations});

  return {
    registeredSegmentCount:hardIpas.length,
    sourceOpportunityCount:sourceOpportunities.length,
    hardTargetCount:hardTargets.length,
    searchedResearchRowCount:Math.min(maxRows,routeResearchRows.length),
    researchPoolMode,
    sourceOpportunities,
    opportunities
  };
}
