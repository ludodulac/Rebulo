import {validateStrictRebus} from './phonetic-engine.js';

export const REBUS_OPERATION_TYPES=Object.freeze({
  WHOLE_WORD:'whole_word',
  GRAPHEME:'grapheme',
  SPATIAL_RELATION:'spatial_relation',
  EXPLICIT_DELETION:'explicit_deletion',
  EXPLICIT_SUBSTITUTION:'explicit_substitution',
  REPETITION:'repetition'
});

export const REBUS_CAPABILITIES=Object.freeze({
  GENERAL:'general',
  PHONETIC_STRICT:'phonetic_strict'
});

export const SPATIAL_RELATIONS=Object.freeze({
  UNDER:Object.freeze({relation:'under',reading:'sous',ipa:'/su/'})
});

const OPERATION_DEFINITIONS=Object.freeze({
  [REBUS_OPERATION_TYPES.WHOLE_WORD]:Object.freeze({type:REBUS_OPERATION_TYPES.WHOLE_WORD,implemented:true,strictCompatible:true}),
  [REBUS_OPERATION_TYPES.GRAPHEME]:Object.freeze({type:REBUS_OPERATION_TYPES.GRAPHEME,implemented:true,strictCompatible:false}),
  [REBUS_OPERATION_TYPES.SPATIAL_RELATION]:Object.freeze({type:REBUS_OPERATION_TYPES.SPATIAL_RELATION,implemented:true,strictCompatible:false}),
  [REBUS_OPERATION_TYPES.EXPLICIT_DELETION]:Object.freeze({type:REBUS_OPERATION_TYPES.EXPLICIT_DELETION,implemented:true,strictCompatible:false}),
  [REBUS_OPERATION_TYPES.EXPLICIT_SUBSTITUTION]:Object.freeze({type:REBUS_OPERATION_TYPES.EXPLICIT_SUBSTITUTION,implemented:false,strictCompatible:false}),
  [REBUS_OPERATION_TYPES.REPETITION]:Object.freeze({type:REBUS_OPERATION_TYPES.REPETITION,implemented:false,strictCompatible:false})
});

export function operationDefinition(type){return OPERATION_DEFINITIONS[type]||null;}
export function isOperationImplemented(type){return operationDefinition(type)?.implemented===true;}

export function buildWholeWordOperation(piece={}){
  if(!piece?.label||!piece?.ipa)return null;
  return {type:REBUS_OPERATION_TYPES.WHOLE_WORD,pieceId:piece.id||null,label:piece.label,reading:piece.reading||piece.label,ipa:piece.ipa,image:piece.image||null};
}

export function buildGraphemeOperation(grapheme,reading=''){
  if(typeof grapheme!=='string')return null;
  const value=grapheme.trim();
  if(!value)return null;
  const explicitReading=typeof reading==='string'&&reading.trim()?reading.trim():value;
  return {type:REBUS_OPERATION_TYPES.GRAPHEME,grapheme:value,reading:explicitReading};
}

export function buildSpatialRelationOperation(relation){
  const definition=Object.values(SPATIAL_RELATIONS).find(item=>item.relation===relation);
  if(!definition)return null;
  return {type:REBUS_OPERATION_TYPES.SPATIAL_RELATION,relation:definition.relation,reading:definition.reading};
}

export function buildExplicitDeletionOperation(piece={},options={}){
  const whole=buildWholeWordOperation(piece);
  if(!whole||!whole.image)return null;
  const keep=String(options?.keep||'').trim();
  const remove=String(options?.remove||'').trim();
  if(!keep||!remove||keep===remove)return null;
  return {type:REBUS_OPERATION_TYPES.EXPLICIT_DELETION,pieceId:whole.pieceId,label:whole.label,reading:keep,sourceReading:whole.reading,keep,remove,image:whole.image,visual:options?.visual==='half'?'half':'cross_out'};
}

export function buildGeneralConstruction(operations=[]){
  if(!Array.isArray(operations)||operations.length===0)return null;
  if(operations.some(operation=>!operation||!isOperationImplemented(operation.type)))return null;
  const strictCompatible=operations.every(operation=>operationDefinition(operation.type)?.strictCompatible===true);
  return {mode:strictCompatible?'strict_candidate':'general',operations:operations.map(operation=>({...operation})),capabilities:[REBUS_CAPABILITIES.GENERAL]};
}

export function buildStrictConstruction(pieces=[],targetIpa=''){
  if(!Array.isArray(pieces)||pieces.length===0)return null;
  const operations=pieces.map(buildWholeWordOperation);
  if(operations.some(operation=>!operation))return null;
  const validation=validateStrictRebus({pieces,targetIpa});
  if(!validation.ok)return null;
  return {mode:'strict',operations,capabilities:[REBUS_CAPABILITIES.GENERAL,REBUS_CAPABILITIES.PHONETIC_STRICT],validation:{reason:validation.reason,builtIpa:validation.builtIpa,targetIpa:validation.targetIpa}};
}

export function supportsConstructionCapability(construction,capability){return Array.isArray(construction?.capabilities)&&construction.capabilities.includes(capability);}
