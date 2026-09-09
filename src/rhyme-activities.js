import {normalizeIPA} from './phonetic-engine.js';

function validRelation(relation={}){
  if(!relation?.relationId||!relation?.targetWord||!relation?.candidateWord)return false;
  if(!['rhyme','non_rhyme'].includes(relation.relationship))return false;
  if(typeof relation.expectedResponse!=='boolean')return false;
  if(relation.expectedResponse!==(relation.relationship==='rhyme'))return false;
  if(!normalizeIPA(relation.targetIpa)||!normalizeIPA(relation.candidateIpa))return false;
  if(!relation?.evidence?.source)return false;
  if(relation.relationship==='rhyme'){
    const rime=normalizeIPA(relation?.evidence?.sharedRimeIpa||'');
    if(!rime)return false;
    if(!normalizeIPA(relation.targetIpa).endsWith(rime)||!normalizeIPA(relation.candidateIpa).endsWith(rime))return false;
  }
  return true;
}

export function buildRhymeJudgments(relations=[]){
  return (relations||[]).filter(validRelation).map(relation=>({
    id:`rhyme-judgment:${relation.relationId}`,
    activityId:'rhyme-judgment',
    targetWord:relation.targetWord,
    candidateWord:relation.candidateWord,
    targetIpa:normalizeIPA(relation.targetIpa),
    candidateIpa:normalizeIPA(relation.candidateIpa),
    expectedResponse:relation.expectedResponse,
    childInstruction:`Est-ce que « ${relation.targetWord} » et « ${relation.candidateWord} » riment ?`,
    proInstruction:`Faire juger explicitement la relation de rime entre « ${relation.targetWord} » et « ${relation.candidateWord} ». Réponse attendue : ${relation.expectedResponse?'oui':'non'}.`,
    evidence:relation.evidence
  }));
}

export function buildRhymeMatching(relations=[],targetWord=''){
  const normalizedTarget=String(targetWord||'').trim().toLowerCase();
  if(!normalizedTarget)return null;
  const candidates=(relations||[]).filter(validRelation).filter(relation=>String(relation.targetWord||'').trim().toLowerCase()===normalizedTarget);
  if(candidates.length<2)return null;
  const rhymes=candidates.filter(relation=>relation.relationship==='rhyme');
  if(rhymes.length!==1)return null;
  const expected=rhymes[0];
  return {
    id:`rhyme-matching:${normalizedTarget}`,
    activityId:'rhyme-matching',
    targetWord:expected.targetWord,
    targetIpa:normalizeIPA(expected.targetIpa),
    choices:candidates.map(relation=>({word:relation.candidateWord,ipa:normalizeIPA(relation.candidateIpa),relationship:relation.relationship})),
    expectedResponse:expected.candidateWord,
    childInstruction:`Quel mot rime avec « ${expected.targetWord} » ?`,
    proInstruction:`Présenter les choix explicitement déclarés pour « ${expected.targetWord} » et demander celui qui rime. Réponse attendue : « ${expected.candidateWord} ».`
  };
}
