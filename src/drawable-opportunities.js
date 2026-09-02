import {normalizeIPA} from './phonetic-engine.js';

const DEFAULT_STOP_WORDS=new Set(['a','à','ai','aie','as','au','aux','c','c\'','ces','con','cons','d','d\'','eh','en','es','est','et','hon','l','l\'','n','n\'','oh','on','ont','qu','qu\'','ré','rez','s','s\'','ses','t','t\'','ta','tes']);

function normalizedWord(value=''){
  return String(value).trim().toLocaleLowerCase('fr').replace(/[.]+$/,'');
}

export function isDrawableNamingCandidate(candidate={}){
  const word=normalizedWord(candidate.word);
  if(!word||word.length<2||DEFAULT_STOP_WORDS.has(word))return false;
  if(/[’']/u.test(word)||/^[a-z]$/iu.test(word))return false;
  return true;
}

export function buildDrawableOpportunityShortlist(opportunities=[],curatedItems=[],{limit=30}={}){
  const curatedByIpa=new Map();
  for(const item of curatedItems||[]){
    const ipa=normalizeIPA(item.ipa||'');
    if(ipa)curatedByIpa.set(ipa,item);
  }
  const out=[];
  for(const opportunity of opportunities||[]){
    const ipa=normalizeIPA(opportunity.ipa||'');
    if(!ipa)continue;
    const curated=curatedByIpa.get(ipa)||null;
    const candidates=(opportunity.namingCandidates||[]).filter(isDrawableNamingCandidate);
    const preferred=curated?.label?candidates.find(x=>normalizedWord(x.word)===normalizedWord(curated.label)):null;
    const namingCandidate=preferred||candidates[0]||null;
    if(!namingCandidate&&!curated)continue;
    out.push({
      ipa,
      label:curated?.label||namingCandidate?.word||'',
      targetCount:Number(opportunity.targetCount)||0,
      frequencySum:Number(opportunity.frequencySum)||0,
      examples:(opportunity.examples||[]).slice(0,5),
      lexicalCandidates:candidates.slice(0,5),
      curationStatus:curated?.status||'lexical_candidate',
      activation:curated?.activation||'not_ready',
      selectionReason:curated?.selectionReason||'Candidat lexical mot-entier à examiner pour imageabilité et stabilité de dénomination.',
      namingRisk:curated?.namingRisk||'Dénomination spontanée non vérifiée.',
      assetStatus:curated?.assetStatus||'unreviewed',
      nextGate:curated?.nextGate||'human_drawability_review'
    });
  }
  return out.sort((a,b)=>b.targetCount-a.targetCount||b.frequencySum-a.frequencySum||a.label.localeCompare(b.label,'fr')).slice(0,limit);
}
