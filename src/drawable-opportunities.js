import {normalizeIPA} from './phonetic-engine.js';

function normalizedWord(value=''){
  return String(value).trim().toLocaleLowerCase('fr').replace(/[.]+$/,'');
}

export function isDrawableNamingCandidate(candidate={}){
  const word=normalizedWord(candidate.word);
  if(!word||word.length<2)return false;
  if(/[’']/u.test(word)||/^[a-z]$/iu.test(word))return false;
  return true;
}

export function buildDrawableOpportunityShortlist(opportunities=[],curatedItems=[],{limit=30}={}){
  // Important: lexical scoring alone never decides that a word is drawable.
  // Only concepts already admitted to the human research shortlist can enter this queue.
  const curatedByIpa=new Map();
  for(const item of curatedItems||[]){
    const ipa=normalizeIPA(item.ipa||'');
    if(ipa)curatedByIpa.set(ipa,item);
  }
  const out=[];
  for(const opportunity of opportunities||[]){
    const ipa=normalizeIPA(opportunity.ipa||'');
    const curated=curatedByIpa.get(ipa);
    if(!ipa||!curated)continue;
    const candidates=(opportunity.namingCandidates||[]).filter(isDrawableNamingCandidate);
    const preferred=candidates.find(x=>normalizedWord(x.word)===normalizedWord(curated.label))||null;
    out.push({ipa,label:curated.label,targetCount:Number(opportunity.targetCount)||0,frequencySum:Number(opportunity.frequencySum)||0,examples:(opportunity.examples||[]).slice(0,5),lexicalCandidates:candidates.slice(0,5),exactLabelAttested:Boolean(preferred),curationStatus:curated.status||'research_candidate',activation:curated.activation||'not_ready',selectionReason:curated.selectionReason||'',namingRisk:curated.namingRisk||'Dénomination spontanée non vérifiée.',assetStatus:curated.assetStatus||'unreviewed',nextGate:curated.nextGate||'human_drawability_review'});
  }
  return out.sort((a,b)=>b.targetCount-a.targetCount||b.frequencySum-a.frequencySum||a.label.localeCompare(b.label,'fr')).slice(0,limit);
}

export function buildExpansionCurationLeads(opportunities=[],activeItems=[],{limit=20}={}){
  const activeIpas=new Set((activeItems||[]).filter(item=>item?.active!==false).map(item=>normalizeIPA(item?.ipa||'')).filter(Boolean));
  const leads=[];
  for(const opportunity of opportunities||[]){
    const ipa=normalizeIPA(opportunity?.ipa||'');
    if(!ipa||activeIpas.has(ipa))continue;
    const lexicalCandidates=(opportunity.namingCandidates||[]).filter(isDrawableNamingCandidate).slice(0,5);
    if(!lexicalCandidates.length)continue;
    leads.push({
      ipa,
      targetCount:Number(opportunity.targetCount)||0,
      frequencySum:Number(opportunity.frequencySum)||0,
      lexicalCandidates,
      examples:(opportunity.examples||[]).slice(0,5),
      status:'needs_human_curation',
      activation:'not_ready',
      proposedLabel:null,
      nextGate:'human_concept_and_drawability_review',
      caution:'Ces mots sont seulement des homophones entiers attestés. Aucun n’est déclaré pictogramme, stable ou activable automatiquement.'
    });
  }
  return leads.sort((a,b)=>b.targetCount-a.targetCount||b.frequencySum-a.frequencySum||a.ipa.localeCompare(b.ipa)).slice(0,limit);
}
