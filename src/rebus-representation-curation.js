import {normalizeIPA} from './phonetic-engine.js';

export function normalizeRepresentationLabel(value=''){
  return String(value||'').trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'").replace(/[^a-z0-9' -]+/g,'').trim();
}

function lexicalPos(value=''){return String(value||'').trim().toUpperCase().split(':')[0];}
function visibleLetterCount(value=''){return Array.from(normalizeRepresentationLabel(value).replace(/[' -]/g,'')).length;}

export function buildRejectedCandidateSet(curation={}){
  return new Set((curation.entries||[])
    .filter(item=>['reject_candidate','defer_candidate'].includes(item?.decision))
    .map(item=>`${normalizeIPA(item.ipa||'')}|${normalizeRepresentationLabel(item.candidate||'')}`));
}

export function buildExistingAssetIndex(items=[]){
  const byLabel=new Map();
  for(const item of items||[]){
    const label=normalizeRepresentationLabel(item?.label||item?.reading||'');
    const ipa=normalizeIPA(item?.ipa||'');
    if(!label||!item?.image)continue;
    const list=byLabel.get(label)||[];
    list.push({id:item.id||null,label:item.label||item.reading||'',ipa,image:item.image,source:item.source||item.assetSource||'existing_asset',active:item.active!==false,strictEligible:item.strictEligible!==false});
    byLabel.set(label,list);
  }
  return byLabel;
}

function candidateScore(row={},candidate={}){
  const targetGain=Math.log10(1+Math.max(0,Number(row.usefulTargetCount)||0))*220;
  const weightedGain=Math.log10(1+Math.max(0,Number(row.usefulWeightedGain)||0))*45;
  const schoolGain=Math.min(60,(Number(row.schoolTargetCount)||0)*3);
  const frequency=Math.log10(1+Math.max(0,Number(candidate.frequency)||0))*28;
  const nounBonus=lexicalPos(candidate.pos)==='NOM'?80:0;
  const oneSyllableBonus=(row.syllableSpans||[]).includes(1)?45:0;
  const twoSyllableBonus=(row.syllableSpans||[]).includes(2)?20:0;
  return Number((targetGain+weightedGain+schoolGain+frequency+nounBonus+oneSyllableBonus+twoSyllableBonus).toFixed(3));
}

function rowByIpa(audit={}){
  const map=new Map();
  for(const row of audit.usefulRows||[])map.set(normalizeIPA(row.ipa||''),row);
  return map;
}

function curatedPrototypeRows(audit={},curation={}){
  const useful=rowByIpa(audit);const rows=[];
  for(const entry of curation.entries||[]){
    if(entry?.decision!=='prototype_candidate')continue;
    const ipa=normalizeIPA(entry.ipa||'');const sourceRow=useful.get(ipa);if(!ipa||!sourceRow)continue;
    const candidates=[...(sourceRow.nounWords||[]),...(sourceRow.exactWords||[])];
    const exact=candidates.find(candidate=>normalizeRepresentationLabel(candidate.word)===normalizeRepresentationLabel(entry.candidate))||{};
    const preferredCandidate={word:entry.candidate,pos:exact.pos||'',frequency:Number(exact.frequency)||0,syllableCount:exact.syllableCount??null,visualRoute:'curated_prototype',visualConcept:entry.visualConcept||null,visualPlausibility:entry.visualPlausibility||null,spontaneousNamingRisk:entry.spontaneousNamingRisk||null,mainConfusions:entry.mainConfusions||[],existingExactAssets:[],conflictingAssets:[],requiresHumanNamingReview:true,automaticActivation:false};
    rows.push({ipa,usefulTargetCount:Number(sourceRow.usefulTargetCount)||0,usefulWeightedGain:Number(sourceRow.usefulWeightedGain)||0,schoolTargetCount:Number(sourceRow.schoolTargetCount)||0,syllableSpans:sourceRow.syllableSpans||[],usefulExamples:(sourceRow.usefulExamples||[]).slice(0,6),preferredCandidate,candidates:[preferredCandidate],priorityScore:10000+candidateScore(sourceRow,preferredCandidate),status:'curated_prototype_needs_naming_test',nextGate:entry.nextGate||'prototype_then_naming_test',caution:'Editorial prototype hypothesis only; it is not spontaneous-naming evidence and is never auto-activated.'});
  }
  return rows;
}

export function representationCurationCandidates(audit={},curation={},existingAssets=[],{limit=250}={}){
  const rejected=buildRejectedCandidateSet(curation);
  const assetIndex=buildExistingAssetIndex(existingAssets);
  const rows=curatedPrototypeRows(audit,curation);
  const prototypeIpas=new Set(rows.map(row=>row.ipa));
  const backlog=audit?.queues?.exactWordVisualBacklog||[];
  for(const row of backlog){
    const ipa=normalizeIPA(row.ipa||'');
    if(!ipa||prototypeIpas.has(ipa))continue;
    const lexical=[...(row.nounWords||[]),...(row.exactWords||[])];
    const seen=new Set();
    const candidates=[];
    for(const candidate of lexical){
      const label=normalizeRepresentationLabel(candidate?.word||'');
      if(!label||seen.has(label)||visibleLetterCount(label)<2)continue;
      seen.add(label);
      if(rejected.has(`${ipa}|${label}`))continue;
      const assets=assetIndex.get(label)||[];
      const exactAssets=assets.filter(asset=>normalizeIPA(asset.ipa)===ipa&&asset.active&&asset.strictEligible);
      const conflictingAssets=assets.filter(asset=>normalizeIPA(asset.ipa)!==ipa);
      const pos=lexicalPos(candidate.pos);
      const visualRoute=exactAssets.length?'existing_exact_asset':conflictingAssets.length?'asset_phonology_conflict':pos==='NOM'?'noun_lexical_precheck':'lexical_precheck';
      candidates.push({word:candidate.word,pos:candidate.pos||'',frequency:Number(candidate.frequency)||0,syllableCount:candidate.syllableCount??null,visualRoute,existingExactAssets:exactAssets,conflictingAssets,requiresHumanNamingReview:true,automaticActivation:false});
    }
    if(!candidates.length)continue;
    candidates.sort((a,b)=>candidateScore(row,b)-candidateScore(row,a)||b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));
    const preferred=candidates[0];
    rows.push({
      ipa,
      usefulTargetCount:Number(row.usefulTargetCount)||0,
      usefulWeightedGain:Number(row.usefulWeightedGain)||0,
      schoolTargetCount:Number(row.schoolTargetCount)||0,
      syllableSpans:row.syllableSpans||[],
      usefulExamples:(row.usefulExamples||[]).slice(0,6),
      preferredCandidate:preferred,
      candidates:candidates.slice(0,5),
      priorityScore:candidateScore(row,preferred),
      status:'lexical_precheck_before_visual_curation',
      nextGate:preferred.visualRoute==='existing_exact_asset'?'verify_asset_naming_before_activation':'human_concept_selection_before_drawing',
      caution:'Exact lexical evidence is not pictogram evidence. This row remains a lexical precheck until a visual concept is explicitly curated.'
    });
  }
  return rows.sort((a,b)=>b.priorityScore-a.priorityScore||b.usefulTargetCount-a.usefulTargetCount||a.ipa.localeCompare(b.ipa)).slice(0,limit);
}
