import {normalizeIPA} from './phonetic-engine.js';
import {analyzeTargetConstructibility} from './phonetic-brick-map.js';

function normalizedWord(value=''){return String(value||'').trim().toLocaleLowerCase('fr').normalize('NFC');}
function candidateKey(word,ipa){return `${normalizedWord(word)}|${normalizeIPA(ipa)}`;}
const VISUAL_SCORE={high:1,medium_high:.82,medium:.62,low:.25,not_applicable:.5};
const NAMING_SCORE={low:1,low_medium:.88,medium:.7,medium_high:.5,high:.28,very_high:.08,not_applicable:.5};
function ageAccessibilityScore(candidate={}){const age=Number(candidate?.suggestedAgeFloor);if(!Number.isFinite(age))return .5;if(age<=5)return 1;if(age<=7)return .9;if(age<=9)return .75;if(age<=12)return .55;return .4;}
export function candidateResearchQuality(candidate={}){
  const visual=VISUAL_SCORE[candidate.visualPlausibility]??.5,naming=NAMING_SCORE[candidate.spontaneousNamingRisk]??.5,age=ageAccessibilityScore(candidate);
  const rejected=['reject_visual_priority'].includes(candidate.researchDecision)?0.15:1;
  const score=Math.round(100*(0.35*visual+0.45*naming+0.20*age)*rejected);
  return {score,visualComponent:visual,namingComponent:naming,ageAccessibilityComponent:age,status:'heuristic_research_only'};
}

export function validatePhoneticBrickCandidateBank(bank={},entries=[]){
  const errors=[],warnings=[],exactLexique=new Set((entries||[]).map(entry=>candidateKey(entry.word,entry.ipa))),seenSegments=new Set();
  for(const segment of bank?.segments||[]){const ipa=normalizeIPA(segment?.ipa||'');if(!ipa){errors.push('Segment sans IPA valide.');continue;}if(seenSegments.has(ipa))errors.push(`Segment dupliqué: /${ipa}/`);seenSegments.add(ipa);for(const candidate of segment?.candidates||[]){const label=String(candidate?.label||'').trim();if(!label){errors.push(`Candidat sans label pour /${ipa}/`);continue;}if(candidate.lexicalEvidence==='lexique_exact'&&!exactLexique.has(candidateKey(label,ipa)))errors.push(`Candidat ${label} non attesté avec la prononciation entière /${ipa}/ dans les entrées fournies.`);if(candidate.researchDecision==='first_wave'&&candidate.spontaneousNamingRisk==='very_high')warnings.push(`Candidat first_wave à risque de dénomination très élevé: ${label} /${ipa}/`);}}
  for(const ipaRaw of bank?.firstWaveSegments||[]){const ipa=normalizeIPA(ipaRaw),segment=(bank?.segments||[]).find(item=>normalizeIPA(item?.ipa||'')===ipa);if(!segment){errors.push(`Segment firstWave absent de la banque: /${ipa}/`);continue;}if(!(segment.candidates||[]).some(candidate=>candidate.researchDecision==='first_wave'))errors.push(`Segment firstWave sans candidat first_wave: /${ipa}/`);}
  return {valid:errors.length===0,errors,warnings};
}

export function attachCuratedBrickEvidence(bank={},opportunities=[]){
  const byIpa=new Map((opportunities||[]).map(row=>[normalizeIPA(row?.ipa||''),row]));
  return (bank?.segments||[]).map(segment=>{
    const ipa=normalizeIPA(segment?.ipa||''),opportunity=byIpa.get(ipa)||null;
    const candidates=(segment.candidates||[]).map(candidate=>({...candidate,researchQuality:candidateResearchQuality(candidate)}));
    const bestCandidate=[...candidates].filter(c=>c.researchDecision!=='reject_visual_priority').sort((a,b)=>b.researchQuality.score-a.researchQuality.score)[0]||null;
    const coverageEvidence=opportunity?{totalUnlocked:Number(opportunity.totalUnlocked)||0,strictUnlocked:Number(opportunity.strictUnlocked)||0,generalUnlocked:Number(opportunity.generalUnlocked)||0,weightedGain:Number(opportunity.weightedGain)||0,usefulUnlocked:Number(opportunity.usefulUnlocked)||0,usefulWeightedGain:Number(opportunity.usefulWeightedGain)||0,examplesUnlocked:(opportunity.examplesUnlocked||[]).slice(0,8),usefulExamplesUnlocked:(opportunity.usefulExamplesUnlocked||[]).slice(0,8)}:null;
    const usefulBase=(coverageEvidence?.usefulUnlocked||0)*12+Math.log10(Math.max(1,coverageEvidence?.usefulWeightedGain||0))*20;
    const curationPriorityScore=Number((usefulBase*((bestCandidate?.researchQuality?.score||35)/100)).toFixed(3));
    return {...segment,ipa,candidates,bestResearchCandidate:bestCandidate?bestCandidate.label:null,coverageEvidence,curationPriorityScore,curationPriorityStatus:'heuristic_research_only'};
  }).sort((a,b)=>b.curationPriorityScore-a.curationPriorityScore||a.ipa.localeCompare(b.ipa));
}

export function simulateCuratedBrickWave(bank={},targets=[],lexicon=[],{maxOperations=4}={}){
  const selectedIpas=(bank?.firstWaveSegments||[]).map(normalizeIPA).filter(Boolean),selectedSegments=(bank?.segments||[]).filter(segment=>selectedIpas.includes(normalizeIPA(segment?.ipa||''))),virtualBricks=selectedSegments.map(segment=>{const ipa=normalizeIPA(segment.ipa),candidate=(segment.candidates||[]).find(item=>item.researchDecision==='first_wave');return {id:`curated-research-${ipa}`,label:candidate?.label||`/${ipa}/`,ipa,active:true,strictEligible:true,researchOnly:true};});
  const baseline=analyzeTargetConstructibility(targets,lexicon,maxOperations),expanded=analyzeTargetConstructibility(targets,[...(lexicon||[]),...virtualBricks],maxOperations),delta={};for(const key of Object.keys(baseline.counts))delta[key]=(expanded.counts[key]||0)-(baseline.counts[key]||0);const baselinePlayable=(baseline.counts.whole_image||0)+(baseline.counts.image_composition||0)+(baseline.counts.image_plus_letter||0),expandedPlayable=(expanded.counts.whole_image||0)+(expanded.counts.image_composition||0)+(expanded.counts.image_plus_letter||0);
  return {selectedSegments:selectedSegments.map(segment=>({ipa:normalizeIPA(segment.ipa),candidate:(segment.candidates||[]).find(item=>item.researchDecision==='first_wave')?.label||null})),baseline:baseline.counts,withResearchWave:expanded.counts,delta,newlyPlayable:expandedPlayable-baselinePlayable,caution:'Simulation phonétique uniquement : les briques virtuelles ne sont ni activées ni validées visuellement.'};
}
