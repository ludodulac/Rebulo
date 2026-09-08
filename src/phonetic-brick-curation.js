import {normalizeIPA} from './phonetic-engine.js';
import {analyzeTargetConstructibility} from './phonetic-brick-map.js';

function normalizedWord(value=''){
  return String(value||'').trim().toLocaleLowerCase('fr').normalize('NFC');
}

function candidateKey(word,ipa){
  return `${normalizedWord(word)}|${normalizeIPA(ipa)}`;
}

export function validatePhoneticBrickCandidateBank(bank={},entries=[]){
  const errors=[];
  const warnings=[];
  const exactLexique=new Set((entries||[]).map(entry=>candidateKey(entry.word,entry.ipa)));
  const seenSegments=new Set();
  for(const segment of bank?.segments||[]){
    const ipa=normalizeIPA(segment?.ipa||'');
    if(!ipa){errors.push('Segment sans IPA valide.');continue;}
    if(seenSegments.has(ipa))errors.push(`Segment dupliqué: /${ipa}/`);
    seenSegments.add(ipa);
    for(const candidate of segment?.candidates||[]){
      const label=String(candidate?.label||'').trim();
      if(!label){errors.push(`Candidat sans label pour /${ipa}/`);continue;}
      if(candidate.lexicalEvidence==='lexique_exact'&&!exactLexique.has(candidateKey(label,ipa))){
        errors.push(`Candidat ${label} non attesté avec la prononciation entière /${ipa}/ dans les entrées fournies.`);
      }
      if(candidate.researchDecision==='first_wave'&&candidate.spontaneousNamingRisk==='very_high'){
        warnings.push(`Candidat first_wave à risque de dénomination très élevé: ${label} /${ipa}/`);
      }
    }
  }
  for(const ipaRaw of bank?.firstWaveSegments||[]){
    const ipa=normalizeIPA(ipaRaw);
    const segment=(bank?.segments||[]).find(item=>normalizeIPA(item?.ipa||'')===ipa);
    if(!segment){errors.push(`Segment firstWave absent de la banque: /${ipa}/`);continue;}
    if(!(segment.candidates||[]).some(candidate=>candidate.researchDecision==='first_wave')){
      errors.push(`Segment firstWave sans candidat first_wave: /${ipa}/`);
    }
  }
  return {valid:errors.length===0,errors,warnings};
}

export function attachCuratedBrickEvidence(bank={},opportunities=[]){
  const byIpa=new Map((opportunities||[]).map(row=>[normalizeIPA(row?.ipa||''),row]));
  return (bank?.segments||[]).map(segment=>{
    const ipa=normalizeIPA(segment?.ipa||'');
    const opportunity=byIpa.get(ipa)||null;
    return {
      ...segment,
      ipa,
      coverageEvidence:opportunity?{
        totalUnlocked:Number(opportunity.totalUnlocked)||0,
        strictUnlocked:Number(opportunity.strictUnlocked)||0,
        generalUnlocked:Number(opportunity.generalUnlocked)||0,
        weightedGain:Number(opportunity.weightedGain)||0,
        examplesUnlocked:(opportunity.examplesUnlocked||[]).slice(0,8)
      }:null
    };
  });
}

export function simulateCuratedBrickWave(bank={},targets=[],lexicon=[],{maxOperations=4}={}){
  const selectedIpas=(bank?.firstWaveSegments||[]).map(normalizeIPA).filter(Boolean);
  const selectedSegments=(bank?.segments||[]).filter(segment=>selectedIpas.includes(normalizeIPA(segment?.ipa||'')));
  const virtualBricks=selectedSegments.map(segment=>{
    const ipa=normalizeIPA(segment.ipa);
    const candidate=(segment.candidates||[]).find(item=>item.researchDecision==='first_wave');
    return {
      id:`curated-research-${ipa}`,
      label:candidate?.label||`/${ipa}/`,
      ipa,
      active:true,
      strictEligible:true,
      researchOnly:true
    };
  });
  const baseline=analyzeTargetConstructibility(targets,lexicon,maxOperations);
  const expanded=analyzeTargetConstructibility(targets,[...(lexicon||[]),...virtualBricks],maxOperations);
  const delta={};
  for(const key of Object.keys(baseline.counts))delta[key]=(expanded.counts[key]||0)-(baseline.counts[key]||0);
  const baselinePlayable=(baseline.counts.whole_image||0)+(baseline.counts.image_composition||0)+(baseline.counts.image_plus_letter||0);
  const expandedPlayable=(expanded.counts.whole_image||0)+(expanded.counts.image_composition||0)+(expanded.counts.image_plus_letter||0);
  return {
    selectedSegments:selectedSegments.map(segment=>({
      ipa:normalizeIPA(segment.ipa),
      candidate:(segment.candidates||[]).find(item=>item.researchDecision==='first_wave')?.label||null
    })),
    baseline:baseline.counts,
    withResearchWave:expanded.counts,
    delta,
    newlyPlayable:expandedPlayable-baselinePlayable,
    caution:'Simulation phonétique uniquement : les briques virtuelles ne sont ni activées ni validées visuellement.'
  };
}
