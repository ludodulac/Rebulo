import {rankDecompositions,segmentTargetWithLexicon,validateStrictRebus} from './phonetic-engine.js';
import {buildGeneralConstruction,buildGraphemeOperation,buildStrictConstruction,buildWholeWordOperation,REBUS_OPERATION_TYPES} from './rebus-construction.js';
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
  if(!validateStrictRebus(candidate).ok)return null;
  const construction=buildStrictConstruction(candidate.pieces,candidate.targetIpa);
  return construction?{...candidate,construction}:null;
}

function findLexiconPiece(operation,lexicon=[]){
  const id=operation?.pieceId||'';
  const label=operation?.label||'';
  return lexicon.find(piece=>piece.active!==false&&((id&&piece.id===id)||(label&&piece.label===label)))||null;
}

export function buildGeneralCreatorCandidate(target,lexicon=[]){
  if(!target||target.mode!=='general'||target.assets!=='ready'||!Array.isArray(target.operations)||target.operations.length===0)return null;
  const operations=[];
  const pieces=[];
  for(const spec of target.operations){
    if(spec?.type===REBUS_OPERATION_TYPES.WHOLE_WORD){
      const piece=findLexiconPiece(spec,lexicon);
      const operation=buildWholeWordOperation(piece||{});
      if(!operation||!piece?.image)return null;
      operations.push(operation);
      pieces.push({...piece,reading:piece.label,operationType:REBUS_OPERATION_TYPES.WHOLE_WORD});
      continue;
    }
    if(spec?.type===REBUS_OPERATION_TYPES.GRAPHEME){
      const operation=buildGraphemeOperation(spec.grapheme,spec.reading||'');
      if(!operation)return null;
      operations.push(operation);
      pieces.push({
        id:null,
        label:operation.grapheme,
        reading:operation.reading,
        grapheme:operation.grapheme,
        operationType:REBUS_OPERATION_TYPES.GRAPHEME
      });
      continue;
    }
    return null;
  }
  const construction=buildGeneralConstruction(operations);
  if(!construction||construction.mode!=='general')return null;
  return {
    answer:target.target,
    targetIpa:target.targetIpa||'',
    source:target.source||'manual-general',
    generated:false,
    pieces,
    therapyActivities:[],
    construction
  };
}
