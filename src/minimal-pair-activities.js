import {splitIPAUnits,normalizeIPA} from './phonetic-engine.js';

function validMinimalPair(relation={}){
  if(!relation?.relationId||!relation?.leftWord||!relation?.rightWord)return false;
  const left=splitIPAUnits(relation.leftIpa||'');
  const right=splitIPAUnits(relation.rightIpa||'');
  if(!left.length||left.length!==right.length)return false;
  const differences=left.map((unit,index)=>unit===right[index]?null:index).filter(index=>index!==null);
  if(differences.length!==1||differences[0]!==relation.differenceIndex)return false;
  return left[relation.differenceIndex]===relation.leftPhoneme&&right[relation.differenceIndex]===relation.rightPhoneme&&Boolean(relation.source);
}

export function buildMinimalPairActivities(relations=[]){
  return (relations||[]).filter(validMinimalPair).map(relation=>({
    id:`minimal-pairs:${relation.relationId}`,
    activityId:'minimal-pairs',
    leftWord:relation.leftWord,
    leftIpa:normalizeIPA(relation.leftIpa),
    rightWord:relation.rightWord,
    rightIpa:normalizeIPA(relation.rightIpa),
    differenceIndex:relation.differenceIndex,
    expectedResponse:[relation.leftPhoneme,relation.rightPhoneme],
    childInstruction:`Écoute « ${relation.leftWord} » puis « ${relation.rightWord} ». Quel son change ?`,
    proInstruction:`Faire discriminer l’unique contraste phonémique entre « ${relation.leftWord} » et « ${relation.rightWord} ». Contraste attendu à l’index ${relation.differenceIndex} : /${relation.leftPhoneme}/ → /${relation.rightPhoneme}/.`,
    source:relation.source
  }));
}
