import {rankDecompositions,segmentTargetWithLexicon,validateStrictRebus} from './phonetic-engine.js';
import {buildTherapyActivities} from './therapy-activities.js';

export function buildCreatorCandidate(target,lexicon=[],therapyDefinitions=[]){
  if(!target||target.mode!=='strict'||target.assets!=='ready'||!target.targetIpa)return null;
  const pieces=rankDecompositions(segmentTargetWithLexicon(target.targetIpa,lexicon,4))[0]||null;
  if(!pieces)return null;
  const candidate={
    answer:target.target,
    targetIpa:target.targetIpa,
    syllableCount:Number.isInteger(target.syllableCount)&&target.syllableCount>0?target.syllableCount:null,
    source:target.source||'',
    generated:Boolean(target.generated),
    pieces:pieces.map(piece=>({...piece,reading:piece.label})),
    therapyActivities:buildTherapyActivities(target,therapyDefinitions)
  };
  return validateStrictRebus(candidate).ok?candidate:null;
}
