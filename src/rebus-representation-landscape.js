import {normalizeIPA} from './phonetic-engine.js';

const RISK_RANK=Object.freeze({low:0,low_medium:1,medium:2,medium_high:3,high:4,very_high:5,unknown:9});
const VISUAL_RANK=Object.freeze({high:0,medium_high:1,medium:2,low_medium:3,low:4,very_low:5,unknown:9});

function normalizedLabel(value=''){
  return String(value||'').trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'");
}
function posFamily(value=''){return String(value||'').trim().toUpperCase().split(':')[0];}
function frequencyBand(value=0){const n=Number(value)||0;return n>=100?'high':n>=20?'medium':n>0?'low':'unknown';}

export function buildCurationEvidenceIndex(curation={}){
  const map=new Map();
  for(const item of curation.entries||[]){
    const ipa=normalizeIPA(item?.ipa||'');
    const label=normalizedLabel(item?.candidate||'');
    if(!ipa||!label)continue;
    map.set(`${ipa}|${label}`,item);
  }
  return map;
}

export function buildConventionIndex(conventions={}){
  const map=new Map();
  for(const item of conventions.entries||[]){
    const ipa=normalizeIPA(item?.ipa||'');
    if(!ipa)continue;
    const list=map.get(ipa)||[];
    list.push({kind:item.kind||'visible_convention',label:item.label||item.symbol||'',status:item.status||'research',source:'rebus_visible_conventions'});
    map.set(ipa,list);
  }
  return map;
}

export function lexicalCandidateEvidence(candidate={},ipa='',curationIndex=new Map()){
  const key=`${normalizeIPA(ipa)}|${normalizedLabel(candidate.word||candidate.label||'')}`;
  const curation=curationIndex.get(key)||null;
  const decision=curation?.decision||null;
  const representationType=decision==='prototype_candidate'?'curated_visual_hypothesis':decision==='reject_candidate'?'rejected_visual_route':decision==='defer_candidate'?'deferred_visual_route':'exact_lexical_candidate';
  const proofStatus=decision==='prototype_candidate'?'visual_hypothesis_curated':decision==='reject_candidate'?'visual_route_rejected':decision==='defer_candidate'?'visual_route_deferred':'lexical_exact_only';
  return {
    word:candidate.word||candidate.label||'',
    pos:candidate.pos||'',
    frequency:Number(candidate.frequency)||0,
    frequencyBand:frequencyBand(candidate.frequency),
    syllableCount:candidate.syllableCount??null,
    exactPhoneticMatch:true,
    representationType,
    proofStatus,
    noun:posFamily(candidate.pos)==='NOM',
    visualPotential:curation?.visualPlausibility||'unknown',
    namingRisk:curation?.spontaneousNamingRisk||'unknown',
    mainConfusions:curation?.mainConfusions||[],
    nextGate:curation?.nextGate||(decision?'review_existing_editorial_decision':'human_concept_precheck'),
    automaticActivation:false,
    clinicalEvidence:'none'
  };
}

export function approximateCandidateEvidence(candidate={}){
  const approximation=candidate.approximation||{};
  return {
    word:candidate.word||'',
    pos:candidate.pos||'',
    frequency:Number(candidate.frequency)||0,
    frequencyBand:frequencyBand(candidate.frequency),
    sourceIpa:normalizeIPA(candidate.sourceIpa||''),
    targetIpa:normalizeIPA(candidate.targetIpa||''),
    exactPhoneticMatch:false,
    representationType:'approximate_lexical_candidate',
    proofStatus:'general_rebus_approximation_only',
    approximationTier:approximation.tier||null,
    editorialApproximationPercent:approximation.editorialApproximationPercent??null,
    editOperations:approximation.operations||[],
    visualPotential:'unknown',
    namingRisk:'unknown',
    automaticActivation:false,
    strictEligible:false,
    clinicalEvidence:'none'
  };
}

function candidateSort(a,b){
  const aCurated=a.proofStatus==='visual_hypothesis_curated'?1:0,bCurated=b.proofStatus==='visual_hypothesis_curated'?1:0;
  if(aCurated!==bCurated)return bCurated-aCurated;
  const aRejected=['visual_route_rejected','visual_route_deferred'].includes(a.proofStatus)?1:0,bRejected=['visual_route_rejected','visual_route_deferred'].includes(b.proofStatus)?1:0;
  if(aRejected!==bRejected)return aRejected-bRejected;
  const av=VISUAL_RANK[a.visualPotential]??9,bv=VISUAL_RANK[b.visualPotential]??9;if(av!==bv)return av-bv;
  const ar=RISK_RANK[a.namingRisk]??9,br=RISK_RANK[b.namingRisk]??9;if(ar!==br)return ar-br;
  if(a.noun!==b.noun)return Number(b.noun)-Number(a.noun);
  if(a.frequency!==b.frequency)return b.frequency-a.frequency;
  return String(a.word).localeCompare(String(b.word),'fr');
}

export function representationLandscapeRows(backlog=[],curation={},conventions={},approximationByIpa=new Map(),{candidateLimit=8}={}){
  const curationIndex=buildCurationEvidenceIndex(curation);
  const conventionIndex=buildConventionIndex(conventions);
  const rows=[];
  for(const row of backlog||[]){
    const ipa=normalizeIPA(row?.ipa||'');if(!ipa)continue;
    const raw=[...(row.nounWords||[]),...(row.exactWords||[])];
    const seen=new Set();const exactCandidates=[];
    for(const candidate of raw){
      const label=normalizedLabel(candidate?.word||'');if(!label||seen.has(label))continue;seen.add(label);
      exactCandidates.push(lexicalCandidateEvidence(candidate,ipa,curationIndex));
    }
    exactCandidates.sort(candidateSort);
    const approximations=(approximationByIpa.get(ipa)||[]).map(approximateCandidateEvidence);
    const visibleConventions=conventionIndex.get(ipa)||[];
    const curated=exactCandidates.filter(candidate=>candidate.proofStatus==='visual_hypothesis_curated');
    const viableExact=exactCandidates.filter(candidate=>!['visual_route_rejected','visual_route_deferred'].includes(candidate.proofStatus));
    const syllableSpans=row.syllableSpans||[];
    const longWindow=syllyllablePotential(syllableSpans,exactCandidates);
    rows.push({
      ipa,
      syllableSpans,
      usefulTargetCount:Number(row.usefulTargetCount)||0,
      usefulWeightedGain:Number(row.usefulWeightedGain)||0,
      schoolTargetCount:Number(row.schoolTargetCount)||0,
      usefulExamples:(row.usefulExamples||[]).slice(0,6),
      exactCandidateCount:exactCandidates.length,
      viableExactCandidateCount:viableExact.length,
      curatedVisualHypothesisCount:curated.length,
      visibleConventionCount:visibleConventions.length,
      approximateCandidateCount:approximations.length,
      exactCandidates:exactCandidates.slice(0,candidateLimit),
      visibleConventions,
      approximateCandidates:approximations.slice(0,5),
      longWindowPotential:longWindow,
      evidenceStatus:curated.length?'curated_visual_hypothesis_available':visibleConventions.length?'visible_convention_available':viableExact.length?'exact_lexical_candidates_need_visual_evidence':approximations.length?'approximation_only':'difficult_sound',
      nextGate:curated.length?'prototype_or_naming_test':viableExact.length?'human_visual_precheck':visibleConventions.length?'planner_composition_test':approximations.length?'general_rebus_editorial_review':'seek_new_representation_type',
      automaticActivation:false,
      clinicalEvidence:'none'
    });
  }
  return rows.sort((a,b)=>{
    const ae=a.curatedVisualHypothesisCount>0?1:0,be=b.curatedVisualHypothesisCount>0?1:0;if(ae!==be)return be-ae;
    if(a.usefulTargetCount!==b.usefulTargetCount)return b.usefulTargetCount-a.usefulTargetCount;
    if(a.usefulWeightedGain!==b.usefulWeightedGain)return b.usefulWeightedGain-a.usefulWeightedGain;
    return a.ipa.localeCompare(b.ipa);
  });
}

function syllyllablePotential(syllableSpans=[],candidates=[]){
  const hasTwo=(syllableSpans||[]).includes(2);
  if(!hasTwo)return {coversTwoSyllables:false,status:'not_two_syllable_window'};
  const best=candidates.find(candidate=>!['visual_route_rejected','visual_route_deferred'].includes(candidate.proofStatus))||null;
  return {
    coversTwoSyllables:true,
    status:best?'two_syllable_candidate_exists':'two_syllable_sound_needs_representation',
    candidate:best?.word||null,
    note:'Une pièce de deux syllabes reste concurrente avec plusieurs petites pièces; elle ne doit pas être pénalisée du seul fait de sa longueur.'
  };
}
