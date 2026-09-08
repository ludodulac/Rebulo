import {normalizeIPA} from './phonetic-engine.js';

const ALLOWED_STRATEGIES=new Set(['alternate_segmentation_first','scene_comparison','scene_comparison_for_older_users','alternate_segmentation_preferred','alternate_segmentation_required']);
const AUTHORIZED_FALLBACK_STATUSES=new Set(['contextual_grapheme_rule_not_yet_authorized','grapheme_cluster_general_mode_research_only','grapheme_sound_general_mode_research_only']);
const COMPOSED_OPERATION_TYPES=new Set(['whole_word','grapheme','grapheme_sound']);

function validateVisibleFallbacks(row,sourceIpa,errors){
  for(const fallback of row.visibleFallbackResearch||[]){
    if(typeof fallback==='string'){
      if(!fallback.trim())errors.push(`Fallback visible vide pour /${sourceIpa}/.`);
      continue;
    }
    if(!fallback||typeof fallback!=='object'){
      errors.push(`Fallback visible invalide pour /${sourceIpa}/.`);
      continue;
    }
    const label=String(fallback.label||'').trim();
    const targetIpa=normalizeIPA(fallback.ipa||'');
    if(!label||!targetIpa)errors.push(`Fallback graphème-son incomplet pour /${sourceIpa}/.`);
    if(fallback.operationType!=='grapheme_sound')errors.push(`Fallback IPA ciblé de /${sourceIpa}/ sans operationType grapheme_sound.`);
    if(!String(fallback.status||'').includes('research_only'))errors.push(`Fallback graphème-son /${targetIpa||'?'} / présenté comme autorisé trop tôt.`);
  }
}

function validateComposedFallbacks(row,sourceIpa,errors){
  const seen=new Set();
  for(const composition of row.composedFallbackResearch||[]){
    const targetIpa=normalizeIPA(composition?.ipa||'');
    const operations=Array.isArray(composition?.operations)?composition.operations:[];
    if(!targetIpa){errors.push(`Composition sans IPA cible pour /${sourceIpa}/.`);continue;}
    if(seen.has(targetIpa))errors.push(`Composition dupliquée pour /${targetIpa}/ depuis /${sourceIpa}/.`);seen.add(targetIpa);
    if(!String(composition?.status||'').includes('research_only'))errors.push(`Composition /${targetIpa}/ présentée comme autorisée trop tôt.`);
    if(operations.length<2)errors.push(`Composition /${targetIpa}/ doit exposer au moins deux opérations.`);
    let built='';
    for(const operation of operations){
      const type=String(operation?.type||'');
      const label=String(operation?.label||'').trim();
      const ipa=normalizeIPA(operation?.ipa||'');
      if(!COMPOSED_OPERATION_TYPES.has(type)||!label||!ipa)errors.push(`Opération invalide dans la composition /${targetIpa}/.`);
      built+=ipa;
    }
    if(built!==targetIpa)errors.push(`Composition /${targetIpa}/ reconstruit /${built||'?'}/.`);
    if(!(composition?.nextGate||'').trim())errors.push(`Composition /${targetIpa}/ sans prochaine étape.`);
  }
}

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
    validateVisibleFallbacks(row,ipa,errors);
    validateComposedFallbacks(row,ipa,errors);
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
  const counts={scene:0,alternate:0,visibleFallbackResearch:0,composedFallbackResearch:0};
  for(const row of registry?.segments||[]){if(String(row.strategy||'').startsWith('scene_'))counts.scene++;if(String(row.strategy||'').includes('alternate_segmentation'))counts.alternate++;if((row.visibleFallbackResearch||[]).length)counts.visibleFallbackResearch++;counts.composedFallbackResearch+=(row.composedFallbackResearch||[]).length;}
  return {segmentCount:(registry?.segments||[]).length,...counts};
}

export function attachHardSegmentStrategies(rows=[],registry={}){
  const byIpa=new Map((registry?.segments||[]).map(item=>[normalizeIPA(item.ipa),item]));
  return (rows||[]).map(row=>{const strategy=byIpa.get(normalizeIPA(row?.ipa||''));return strategy?{...row,hardSegmentStrategy:strategy}:row;});
}
