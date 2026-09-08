import {normalizeIPA} from './phonetic-engine.js';

const ALLOWED_STRATEGIES=new Set(['alternate_segmentation_first','scene_comparison','scene_comparison_for_older_users','alternate_segmentation_preferred','alternate_segmentation_required']);
const AUTHORIZED_FALLBACK_STATUSES=new Set(['contextual_grapheme_rule_not_yet_authorized','grapheme_cluster_general_mode_research_only']);

export function validateHardSegmentStrategies(registry={}){
  const errors=[],warnings=[],seen=new Set();
  if(registry?.status!=='research_only')errors.push('Le registre des segments difficiles doit rester research_only.');
  for(const row of registry?.segments||[]){
    const ipa=normalizeIPA(row?.ipa||'');
    if(!ipa){errors.push('Segment difficile sans IPA valide.');continue;}
    if(seen.has(ipa))errors.push(`Segment difficile dupliqué: /${ipa}/`);seen.add(ipa);
    if(!ALLOWED_STRATEGIES.has(row.strategy))errors.push(`Stratégie inconnue pour /${ipa}/: ${row.strategy}`);
    if((row.visibleFallbackResearch||[]).length&&!AUTHORIZED_FALLBACK_STATUSES.has(row.fallbackStatus))errors.push(`Fallback visible non borné pour /${ipa}/.`);
    if((row.visibleFallbackResearch||[]).length&&String(row.fallbackStatus).includes('research')===false&&String(row.fallbackStatus).includes('not_yet_authorized')===false)errors.push(`Fallback de /${ipa}/ présenté comme autorisé trop tôt.`);
    if(!(row.nextGate||'').trim())errors.push(`Segment /${ipa}/ sans prochaine étape.`);
    if(row.strategy.startsWith('scene_')&&!(row.visualHypotheses||[]).length)errors.push(`Scène /${ipa}/ sans hypothèse visuelle.`);
    if(row.strategy.includes('alternate_segmentation')&&!(row.lexicalAssessment||'').trim())warnings.push(`Segment /${ipa}/ sans diagnostic lexical.`);
  }
  const di=(registry?.segments||[]).find(row=>normalizeIPA(row?.ipa||'')==='di');
  const dReject=(di?.rejectedFallbacks||[]).find(item=>item.label==='D');
  if(!dReject||!String(dReject.reason||'').includes('/de/'))errors.push('Le registre doit expliciter que D=/de/ et ne peut pas produire /di/.');
  return {valid:errors.length===0,errors,warnings};
}

export function hardSegmentStrategySummary(registry={}){
  const counts={scene:0,alternate:0,visibleFallbackResearch:0};
  for(const row of registry?.segments||[]){if(String(row.strategy||'').startsWith('scene_'))counts.scene++;if(String(row.strategy||'').includes('alternate_segmentation'))counts.alternate++;if((row.visibleFallbackResearch||[]).length)counts.visibleFallbackResearch++;}
  return {segmentCount:(registry?.segments||[]).length,...counts};
}

export function attachHardSegmentStrategies(rows=[],registry={}){
  const byIpa=new Map((registry?.segments||[]).map(item=>[normalizeIPA(item.ipa),item]));
  return (rows||[]).map(row=>{const strategy=byIpa.get(normalizeIPA(row?.ipa||''));return strategy?{...row,hardSegmentStrategy:strategy}:row;});
}
