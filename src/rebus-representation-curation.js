import {normalizeIPA} from './phonetic-engine.js';

export function normalizeRepresentationLabel(value=''){
  return String(value||'').trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'").replace(/[^a-z0-9' -]+/g,'').trim();
}

function lexicalPos(value=''){return String(value||'').trim().toUpperCase().split(':')[0];}

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
  const nounBonus=lexicalPos(candidate.pos)==='NOM'?120:0;
  const oneSyllableBonus=(row.syllableSpans||[]).includes(1)?45:0;
  const twoSyllableBonus=(row.syllableSpans||[]).includes(2)?20:0;
  return Number((targetGain+weightedGain+schoolGain+frequency+nounBonus+oneSyllableBonus+twoSyllableBonus).toFixed(3));
}

export function representationCurationCandidates(audit={},curation={},existingAssets=[],{limit=250}={}){
  const rejected=buildRejectedCandidateSet(curation);
  const assetIndex=buildExistingAssetIndex(existingAssets);
  const backlog=audit?.queues?.exactWordVisualBacklog||[];
  const rows=[];
  for(const row of backlog){
    const ipa=normalizeIPA(row.ipa||'');
    if(!ipa)continue;
    const lexical=[...(row.nounWords||[]),...(row.exactWords||[])];
    const seen=new Set();
    const candidates=[];
    for(const candidate of lexical){
      const label=normalizeRepresentationLabel(candidate?.word||'');
      if(!label||seen.has(label))continue;
      seen.add(label);
      if(rejected.has(`${ipa}|${label}`))continue;
      const assets=assetIndex.get(label)||[];
      const exactAssets=assets.filter(asset=>normalizeIPA(asset.ipa)===ipa&&asset.active&&asset.strictEligible);
      const conflictingAssets=assets.filter(asset=>normalizeIPA(asset.ipa)!==ipa);
      const pos=lexicalPos(candidate.pos);
      const visualRoute=exactAssets.length?'existing_exact_asset':pos==='NOM'?'noun_visual_review':conflictingAssets.length?'asset_phonology_conflict':'lexical_visual_review';
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
      status:'needs_human_visual_curation',
      nextGate:preferred.visualRoute==='existing_exact_asset'?'verify_asset_naming_before_activation':'select_visual_concept_then_naming_test',
      caution:'Exact lexical evidence is not pictogram evidence. No candidate is activated by this queue.'
    });
  }
  return rows.sort((a,b)=>b.priorityScore-a.priorityScore||b.usefulTargetCount-a.usefulTargetCount||a.ipa.localeCompare(b.ipa)).slice(0,limit);
}
