import {normalizeIPA} from './phonetic-engine.js';
import {rankBrickOpportunities} from './phonetic-brick-map.js';

function targetKey(target={}){
  const word=String(target?.target||target?.word||'').trim().toLocaleLowerCase('fr');
  const ipa=normalizeIPA(target?.targetIpa||target?.ipa||'');
  return `${word}|${ipa}`;
}

export function buildHardRouteOpportunitySearch(researchRows=[],targets=[],technicalInventory=[],hardStrategyRegistry={}, {maxRows=250,maxOperations=4}={}){
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
  const opportunities=rankBrickOpportunities(researchRows,hardTargets,technicalInventory,{limit:maxRows,maxOperations});

  return {
    registeredSegmentCount:hardIpas.length,
    sourceOpportunityCount:sourceOpportunities.length,
    hardTargetCount:hardTargets.length,
    searchedResearchRowCount:Math.min(maxRows,(researchRows||[]).length),
    sourceOpportunities,
    opportunities
  };
}
