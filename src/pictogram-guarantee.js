export const PICTOGRAM_GUARANTEE_LEVELS=Object.freeze({
  GENERAL_ILLUSTRATION:'general_illustration',
  PHONETIC_STRUCTURED:'phonetic_structured',
  NAMING_REVIEW_PLANNED:'naming_review_planned',
  HUMAN_OBSERVED:'human_observed',
  CLINICALLY_VALIDATED:'clinically_validated'
});

const LEVEL_ORDER=Object.freeze([
  PICTOGRAM_GUARANTEE_LEVELS.GENERAL_ILLUSTRATION,
  PICTOGRAM_GUARANTEE_LEVELS.PHONETIC_STRUCTURED,
  PICTOGRAM_GUARANTEE_LEVELS.NAMING_REVIEW_PLANNED,
  PICTOGRAM_GUARANTEE_LEVELS.HUMAN_OBSERVED,
  PICTOGRAM_GUARANTEE_LEVELS.CLINICALLY_VALIDATED
]);

function normalize(value=''){return String(value||'').trim().normalize('NFC').toLocaleLowerCase('fr-FR');}
function hasAsset(item={}){return Boolean(item.image||item.asset);}
function hasPhoneticStructure(item={}){return Boolean(item.ipa||item.targetIpa)&&item.strictEligible!==false;}
function hasNamingPlan(review={}){return Boolean(review?.revision&&review?.targetIpa&&Array.isArray(review?.candidates)&&review.candidates.length);}
function hasHumanEvidence(review={}){
  return (review?.candidates||[]).some(candidate=>candidate?.namingTestStatus==='completed');
}
function hasClinicalValidation(item={},review={}){
  return item?.clinicalStatus==='validated'||item?.clinicalValidation==='validated'||review?.clinicalStatus==='validated'||review?.humanDecision==='clinical_validated';
}

export function derivePictogramGuarantees(item={},review=null){
  const levels=[];
  if(hasAsset(item))levels.push(PICTOGRAM_GUARANTEE_LEVELS.GENERAL_ILLUSTRATION);
  if(hasAsset(item)&&hasPhoneticStructure(item))levels.push(PICTOGRAM_GUARANTEE_LEVELS.PHONETIC_STRUCTURED);
  if(hasNamingPlan(review||{}))levels.push(PICTOGRAM_GUARANTEE_LEVELS.NAMING_REVIEW_PLANNED);
  if(hasHumanEvidence(review||{}))levels.push(PICTOGRAM_GUARANTEE_LEVELS.HUMAN_OBSERVED);
  if(hasClinicalValidation(item,review||{}))levels.push(PICTOGRAM_GUARANTEE_LEVELS.CLINICALLY_VALIDATED);
  return LEVEL_ORDER.filter(level=>levels.includes(level));
}

export function highestPictogramGuarantee(item={},review=null){
  return derivePictogramGuarantees(item,review).at(-1)||null;
}

export function denominationCandidates(item={},review=null){
  const target=String(item.label||review?.concept||'').trim();
  const candidates=[];
  if(target)candidates.push({label:target,kind:'target',evidence:'declared_target',context:'general',population:'unspecified'});
  const seen=new Set(candidates.map(candidate=>normalize(candidate.label)));
  for(const candidate of review?.candidates||[]){
    for(const risk of candidate?.namingRisks||[]){
      const key=normalize(risk);
      if(!key||seen.has(key))continue;
      seen.add(key);
      candidates.push({label:risk,kind:'alternative',evidence:'declared_naming_risk',context:'planned_blind_naming',population:'unspecified'});
    }
  }
  return candidates;
}

export function pictogramGuaranteeRecord(item={},review=null){
  return {
    id:item.id||review?.concept||null,
    label:item.label||review?.concept||null,
    asset:item.image||review?.candidates?.[0]?.asset||null,
    revision:item.artRevision||review?.revision||null,
    targetIpa:item.ipa||review?.targetIpa||null,
    active:item.active===true,
    guarantees:derivePictogramGuarantees(item,review),
    highestGuarantee:highestPictogramGuarantee(item,review),
    denominationCandidates:denominationCandidates(item,review),
    automaticClinicalClaim:false
  };
}
