import {normalizeIPA} from './phonetic-engine.js';

function normalizeLabel(value=''){
  return String(value||'').trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'").replace(/[^a-z0-9']+/g,'');
}
function posFamily(value=''){return String(value||'').trim().toUpperCase().split(':')[0];}

export function buildKnownAssetIndex({seed=[],openLibraries=[],researchAssets=[]}={}){
  const byLabel=new Map();
  const add=(label,item)=>{
    const key=normalizeLabel(label);if(!key)return;
    const list=byLabel.get(key)||[];list.push(item);byLabel.set(key,list);
  };
  for(const item of seed||[]){
    if(item?.active===false||!item?.image)continue;
    add(item.label||item.id,{assetKind:'active_seed',label:item.label||item.id,ipa:normalizeIPA(item.ipa||''),image:item.image,strictEligible:item.strictEligible!==false,clinicalStatus:item.clinicalStatus||'unreviewed'});
  }
  for(const library of openLibraries||[]){
    for(const item of library||[]){
      if(item?.active===false||!item?.image)continue;
      add(item.label||item.id,{assetKind:'open_library',label:item.label||item.id,ipa:normalizeIPA(item.ipa||''),image:item.image,strictEligible:item.strictEligible!==false,clinicalStatus:item.clinicalStatus||'unreviewed'});
    }
  }
  for(const asset of researchAssets||[]){
    const inferred=normalizeLabel(asset.inferredLabel||'');if(!inferred)continue;
    add(inferred,{assetKind:'research_filename_match',label:asset.inferredLabel,path:asset.path,strictEligible:false,clinicalStatus:'unreviewed'});
  }
  return byLabel;
}

function assetsForCandidate(candidate,assetIndex,targetIpa){
  const key=normalizeLabel(candidate.word||'');
  return (assetIndex.get(key)||[]).map(item=>({...item,candidateLabelMatch:true,registeredPhoneticMatch:Boolean(item.ipa&&normalizeIPA(item.ipa)===normalizeIPA(targetIpa))}));
}

function viable(candidate={}){return !['visual_route_rejected','visual_route_deferred'].includes(candidate.proofStatus);}
function curatedPositive(candidate={}){return candidate.proofStatus==='visual_hypothesis_curated';}
function lexicalFlags(candidate={}){
  const word=normalizeLabel(candidate.word||'');
  const pos=posFamily(candidate.pos||'');
  const frequency=Number(candidate.frequency)||0;
  const singleCharacter=word.length===1;
  const functionLikePos=['ADJ','ADV','ART','CON','DET','PRE','PRO'].includes(pos);
  const lowFrequency=frequency>0&&frequency<1;
  const noun=pos==='NOM';
  return {singleCharacter,functionLikePos,lowFrequency,noun};
}
function weakPictogramLead(candidate={}){
  const flags=candidate.descriptiveFlags||lexicalFlags(candidate);
  return flags.singleCharacter||flags.functionLikePos||(flags.lowFrequency&&!candidate.knownAssets?.length&&!curatedPositive(candidate));
}

export function classifyExpansionRow(row={},assetIndex=new Map()){
  const exactCandidates=(row.exactCandidates||[]).map(candidate=>{
    const knownAssets=assetsForCandidate(candidate,assetIndex,row.ipa);
    return {...candidate,knownAssets,descriptiveFlags:lexicalFlags(candidate)};
  });
  const viableExact=exactCandidates.filter(viable);
  const existingAssetCandidates=exactCandidates.filter(candidate=>candidate.knownAssets.length>0);
  const registeredPhoneticAssetCandidates=exactCandidates.filter(candidate=>candidate.knownAssets.some(asset=>asset.registeredPhoneticMatch));
  const curated=exactCandidates.filter(curatedPositive);
  const rejectedOrDeferred=exactCandidates.filter(candidate=>!viable(candidate));
  const visibleConventions=row.visibleConventions||[];
  const approximations=row.approximateCandidates||[];
  const allKnownExactRoutesRejected=exactCandidates.length>0&&viableExact.length===0;
  const conventionDominatesKnownLexicalLeads=Boolean(visibleConventions.length&&!curated.length&&viableExact.length&&viableExact.every(weakPictogramLead));

  let lane='insufficient_information';
  if(existingAssetCandidates.length)lane='asset_existing_to_review';
  else if(visibleConventions.length&&(allKnownExactRoutesRejected||conventionDominatesKnownLexicalLeads))lane='visible_convention_preferable';
  else if(exactCandidates.length>1)lane='multiple_exact_homophones_to_compare';
  else if(viableExact.length)lane='exact_image_candidate_precheck';
  else if(approximations.length)lane='approximation_only_after_rejected_exacts';

  return {
    ipa:row.ipa,
    syllableSpans:row.syllableSpans||[],
    usefulTargetCount:Number(row.usefulTargetCount)||0,
    usefulWeightedGain:Number(row.usefulWeightedGain)||0,
    schoolTargetCount:Number(row.schoolTargetCount)||0,
    usefulExamples:(row.usefulExamples||[]).slice(0,6),
    exactCandidateCount:Number(row.exactCandidateCount)||exactCandidates.length,
    retainedExactCandidateCount:exactCandidates.length,
    additionalExactCandidateCount:Math.max(0,(Number(row.exactCandidateCount)||exactCandidates.length)-exactCandidates.length),
    multipleExactHomophones:(Number(row.exactCandidateCount)||exactCandidates.length)>1,
    exactCandidates,
    curatedVisualHypothesisCount:curated.length,
    visibleConventions,
    approximateCandidates:approximations,
    existingAssetCandidateCount:existingAssetCandidates.length,
    registeredPhoneticAssetCandidateCount:registeredPhoneticAssetCandidates.length,
    likelyNeedsNewAsset:Boolean(viableExact.length&&!existingAssetCandidates.length&&!visibleConventions.length),
    highKnownVisualOrLexicalRisk:Boolean(rejectedOrDeferred.length||exactCandidates.some(candidate=>['high','very_high','medium_high'].includes(candidate.namingRisk))),
    informationInsufficient:Boolean(!curated.length&&!existingAssetCandidates.length&&!visibleConventions.length),
    twoSyllableFirstClass:Boolean((row.syllableSpans||[]).includes(2)),
    lane,
    proofStatus:{
      phoneticExactness:'exact_candidates_attested',
      generalRebusApproximation:approximations.length?'available_separately':'none_listed',
      lexicalRelevance:'not_human_validated',
      drawableConcept:curated.length?'curated_hypothesis_only':'unknown',
      spontaneousNamability:'unknown_unless_human_observation_exists',
      orthophonicValidation:'none'
    },
    nextDecision:lane==='asset_existing_to_review'?'inspect_existing_asset_then_naming_gate':lane==='visible_convention_preferable'?'prefer_explicit_convention_unless_better_exact_route_is_curated':lane==='multiple_exact_homophones_to_compare'?'compare_semantic_and_visual_routes_before_drawing':lane==='exact_image_candidate_precheck'?'human_concept_precheck_before_new_asset':lane==='approximation_only_after_rejected_exacts'?'general_rebus_editorial_review_only':'gather_more_semantic_or_visual_evidence',
    automaticActivation:false
  };
}

function priorityCompare(a,b){
  if(a.usefulTargetCount!==b.usefulTargetCount)return b.usefulTargetCount-a.usefulTargetCount;
  if(a.usefulWeightedGain!==b.usefulWeightedGain)return b.usefulWeightedGain-a.usefulWeightedGain;
  if(a.schoolTargetCount!==b.schoolTargetCount)return b.schoolTargetCount-a.schoolTargetCount;
  return String(a.ipa).localeCompare(String(b.ipa));
}

export function buildRepresentationExpansionQueue(rows=[],assetIndex=new Map(),{globalLimit=800,twoSyllableReserve=400}={}){
  const classified=(rows||[]).map(row=>classifyExpansionRow(row,assetIndex));
  const selected=[];const seen=new Set();
  const add=row=>{if(!row||seen.has(row.ipa))return;seen.add(row.ipa);selected.push(row);};
  [...classified].sort(priorityCompare).slice(0,globalLimit).forEach(add);
  [...classified].filter(row=>row.twoSyllableFirstClass).sort(priorityCompare).slice(0,twoSyllableReserve).forEach(add);
  selected.sort(priorityCompare);
  return selected;
}

export function buildExpansionSubqueues(rows=[]){
  const sorted=[...rows].sort(priorityCompare);
  const take=(predicate,limit=120)=>sorted.filter(predicate).slice(0,limit).map(row=>row.ipa);
  return {
    existingAssetReview:take(row=>row.lane==='asset_existing_to_review',80),
    multipleExactHomophones:take(row=>row.lane==='multiple_exact_homophones_to_compare',160),
    visibleConventionPreferable:take(row=>row.lane==='visible_convention_preferable',80),
    exactImagePrecheck:take(row=>row.lane==='exact_image_candidate_precheck',160),
    twoSyllableFirstClass:take(row=>row.twoSyllableFirstClass,160),
    likelyNewAsset:take(row=>row.likelyNeedsNewAsset,160),
    knownRisk:take(row=>row.highKnownVisualOrLexicalRisk,100),
    approximationOnly:take(row=>row.lane==='approximation_only_after_rejected_exacts',80),
    insufficientInformation:take(row=>row.informationInsufficient,160)
  };
}

export function summarizeExpansionQueue(rows=[]){
  const laneCounts={};for(const row of rows)laneCounts[row.lane]=(laneCounts[row.lane]||0)+1;
  return {
    soundCount:rows.length,
    twoSyllableSoundCount:rows.filter(row=>row.twoSyllableFirstClass).length,
    multipleExactHomophoneSoundCount:rows.filter(row=>row.multipleExactHomophones).length,
    existingAssetSoundCount:rows.filter(row=>row.existingAssetCandidateCount>0).length,
    registeredPhoneticAssetSoundCount:rows.filter(row=>row.registeredPhoneticAssetCandidateCount>0).length,
    visibleConventionSoundCount:rows.filter(row=>row.visibleConventions.length>0).length,
    likelyNewAssetSoundCount:rows.filter(row=>row.likelyNeedsNewAsset).length,
    highKnownRiskSoundCount:rows.filter(row=>row.highKnownVisualOrLexicalRisk).length,
    approximationAvailableSoundCount:rows.filter(row=>row.approximateCandidates.length>0).length,
    informationInsufficientSoundCount:rows.filter(row=>row.informationInsufficient).length,
    laneCounts
  };
}

export const REPRESENTATION_EXPANSION_POLICY=Object.freeze({
  status:'research_mapping_only',
  ranking:'Yield fields only order the review queue; they never prove visual quality, namability or clinical suitability.',
  longWindows:'Two-syllable windows receive an explicit reserve and are not penalized for length.',
  homophones:'Several exact homophones are retained when available; exactCandidateCount records when more candidates exist than the retained audit sample.',
  assets:'Exact-label asset matches are inspection leads. Research filename matches do not claim a registered pronunciation or spontaneous naming.',
  conventions:'An explicit convention can be marked preferable only when current exact lexical leads are rejected or descriptively weak pictogram leads; this is a review lane, not a truth score.',
  unknowns:'visualPotential and namingRisk remain unknown unless explicit curation or human evidence supplies them.',
  proof:'phonetic exactness != ludic approximation != lexical obviousness != drawable concept != spontaneous namability != orthophonic validation'
});
