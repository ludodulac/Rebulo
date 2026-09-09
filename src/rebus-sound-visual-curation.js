import {normalizeIPA} from './phonetic-engine.js';
import {wholeWordRepresentationCandidates} from './syllable-representation-candidates.js';

export const SOUND_VISUAL_DECISIONS=Object.freeze(['prototype_candidate','reject_candidate','defer_candidate']);

function normalizeLabel(value=''){
  return String(value||'').trim().toLocaleLowerCase('fr').replace(/[’]/g,"'").normalize('NFC');
}

export function buildSoundVisualCurationRegistry(dataset={}){
  const byIpa=new Map();
  for(const raw of dataset?.entries||[]){
    const ipa=normalizeIPA(raw?.ipa||'');
    const candidate=String(raw?.candidate||'').trim();
    if(!ipa||!candidate)continue;
    const entry={...raw,ipa,candidate};
    if(!byIpa.has(ipa))byIpa.set(ipa,[]);
    byIpa.get(ipa).push(entry);
  }
  return byIpa;
}

export function visualCurationForSound(ipa='',candidates=[],registry=new Map()){
  const target=normalizeIPA(ipa);
  const decisions=registry.get(target)||[];
  const byCandidate=new Map(decisions.map(item=>[normalizeLabel(item.candidate),item]));
  const annotated=(candidates||[]).map(candidate=>{
    const decision=byCandidate.get(normalizeLabel(candidate.word))||null;
    return decision?{...candidate,visualCuration:decision.decision,visualCurationEvidence:decision}:{...candidate,visualCuration:'unreviewed'};
  });
  const prototypeCandidates=annotated.filter(item=>item.visualCuration==='prototype_candidate');
  const rejectedCandidates=annotated.filter(item=>item.visualCuration==='reject_candidate');
  const deferredCandidates=annotated.filter(item=>item.visualCuration==='defer_candidate');
  const eligibleCandidates=annotated.filter(item=>item.visualCuration!=='reject_candidate').sort((a,b)=>{
    const rank=value=>value==='prototype_candidate'?0:value==='unreviewed'?1:2;
    return rank(a.visualCuration)-rank(b.visualCuration)||b.frequency-a.frequency||a.word.localeCompare(b.word,'fr');
  });
  return {decisions,annotated,prototypeCandidates,rejectedCandidates,deferredCandidates,eligibleCandidates};
}

export function validateSoundVisualCuration(dataset={},lexicalCandidateIndex=new Map()){
  const errors=[];
  const warnings=[];
  const seen=new Set();
  for(const [index,entry] of (dataset?.entries||[]).entries()){
    const prefix=`entries[${index}]`;
    const ipa=normalizeIPA(entry?.ipa||'');
    const candidate=String(entry?.candidate||'').trim();
    if(!ipa)errors.push(`${prefix}: ipa requis`);
    if(!candidate)errors.push(`${prefix}: candidate requis`);
    if(!SOUND_VISUAL_DECISIONS.includes(entry?.decision))errors.push(`${prefix}: décision inconnue ${entry?.decision}`);
    const key=`${ipa}|${normalizeLabel(candidate)}`;
    if(seen.has(key))errors.push(`${prefix}: décision dupliquée pour ${candidate} /${ipa}/`);
    seen.add(key);
    if(!ipa||!candidate)continue;
    const exact=wholeWordRepresentationCandidates(ipa,lexicalCandidateIndex,0);
    if(!exact.some(item=>normalizeLabel(item.word)===normalizeLabel(candidate)))errors.push(`${prefix}: ${candidate} n'est pas attesté comme mot entier exact pour /${ipa}/ dans le lexique courant`);
    if(entry.decision==='prototype_candidate'&&!entry.visualConcept)errors.push(`${prefix}: visualConcept requis pour prototype_candidate`);
    if(entry.decision==='prototype_candidate'&&!entry.nextGate)warnings.push(`${prefix}: prototype sans nextGate explicite`);
  }
  return {valid:errors.length===0,errors,warnings,entryCount:(dataset?.entries||[]).length};
}
