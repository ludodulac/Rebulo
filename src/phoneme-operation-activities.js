import {splitIPAUnits,normalizeIPA} from './phonetic-engine.js';

function validSubstitution(operation={}){
  if(operation?.activityId!=='phoneme-substitution'||!operation?.operationId||!operation?.sourceWord)return false;
  const units=splitIPAUnits(operation.sourceIpa||'');
  if(!units.length||units[operation.replaceIndex]!==operation.fromPhoneme||!operation.toPhoneme)return false;
  const next=[...units];next[operation.replaceIndex]=operation.toPhoneme;
  return normalizeIPA(next.join(''))===normalizeIPA(operation.expectedIpa||'')&&Boolean(operation.source);
}

function validDeletion(operation={}){
  if(operation?.activityId!=='phoneme-deletion'||!operation?.operationId||!operation?.sourceWord)return false;
  const units=splitIPAUnits(operation.sourceIpa||'');
  if(!units.length||units[operation.removeIndex]!==operation.removePhoneme)return false;
  const next=[...units.slice(0,operation.removeIndex),...units.slice(operation.removeIndex+1)];
  return normalizeIPA(next.join(''))===normalizeIPA(operation.expectedIpa||'')&&Boolean(operation.source);
}

export function buildPhonemeOperationActivities(operations=[]){
  return (operations||[]).flatMap(operation=>{
    if(validSubstitution(operation)){
      return [{
        id:`phoneme-substitution:${operation.operationId}`,
        activityId:'phoneme-substitution',
        sourceWord:operation.sourceWord,
        sourceIpa:normalizeIPA(operation.sourceIpa),
        operationIndex:operation.replaceIndex,
        fromPhoneme:operation.fromPhoneme,
        toPhoneme:operation.toPhoneme,
        expectedWord:operation.expectedWord||'',
        expectedResponse:normalizeIPA(operation.expectedIpa),
        childInstruction:`Dis « ${operation.sourceWord} ». Remplace le son /${operation.fromPhoneme}/ par /${operation.toPhoneme}/. Quel mot obtiens-tu ?`,
        proInstruction:`Substitution phonémique à l’index ${operation.replaceIndex} : /${operation.fromPhoneme}/ → /${operation.toPhoneme}/ dans « ${operation.sourceWord} ». Réponse attendue : ${operation.expectedWord?`« ${operation.expectedWord} » `:''}/${normalizeIPA(operation.expectedIpa)}/.`,
        source:operation.source
      }];
    }
    if(validDeletion(operation)){
      return [{
        id:`phoneme-deletion:${operation.operationId}`,
        activityId:'phoneme-deletion',
        sourceWord:operation.sourceWord,
        sourceIpa:normalizeIPA(operation.sourceIpa),
        operationIndex:operation.removeIndex,
        removePhoneme:operation.removePhoneme,
        expectedWord:operation.expectedWord||'',
        expectedResponse:normalizeIPA(operation.expectedIpa),
        childInstruction:`Dis « ${operation.sourceWord} ». Enlève le son /${operation.removePhoneme}/. Que reste-t-il ?`,
        proInstruction:`Suppression phonémique à l’index ${operation.removeIndex} : retirer /${operation.removePhoneme}/ de « ${operation.sourceWord} ». Réponse attendue : ${operation.expectedWord?`« ${operation.expectedWord} » `:''}/${normalizeIPA(operation.expectedIpa)}/.`,
        source:operation.source
      }];
    }
    return [];
  });
}
