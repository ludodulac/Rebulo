export const GENERAL_OPERATION_READINESS_LEVELS=Object.freeze([
  'research_only',
  'semantics_defined',
  'visual_cue_defined',
  'comprehension_tested',
  'authorized_general'
]);

const LEVEL_INDEX=new Map(GENERAL_OPERATION_READINESS_LEVELS.map((level,index)=>[level,index]));

export function isValidGeneralOperationReadinessLevel(level){return LEVEL_INDEX.has(String(level||''));}

export function compareGeneralOperationReadiness(a,b){
  if(!isValidGeneralOperationReadinessLevel(a)||!isValidGeneralOperationReadinessLevel(b))return null;
  return LEVEL_INDEX.get(a)-LEVEL_INDEX.get(b);
}

export function validateGeneralOperationReadinessRegistry(registry={}){
  const errors=[];
  if(registry?.schemaVersion!=='1.0')errors.push('schemaVersion must be 1.0');
  const entries=Array.isArray(registry?.entries)?registry.entries:[];
  const ids=new Set();
  for(const entry of entries){
    const id=String(entry?.id||'').trim();
    if(!id)errors.push('entry id is required');
    else if(ids.has(id))errors.push(`duplicate entry id: ${id}`);
    else ids.add(id);
    if(!String(entry?.operationType||'').trim())errors.push(`${id||'entry'} operationType is required`);
    if(!isValidGeneralOperationReadinessLevel(entry?.readiness))errors.push(`${id||'entry'} has invalid readiness`);
    if(entry?.strictCompatible!==false)errors.push(`${id||'entry'} must explicitly stay non-strict`);
    if(entry?.automaticActivation!==false)errors.push(`${id||'entry'} must disable automatic activation`);
    if(!String(entry?.semantics||'').trim())errors.push(`${id||'entry'} semantics note is required`);
    if(!String(entry?.nextGate||'').trim())errors.push(`${id||'entry'} nextGate is required`);
    if(entry?.readiness==='authorized_general'&&!String(entry?.authorizationEvidence||'').trim())errors.push(`${id||'entry'} authorized_general requires authorizationEvidence`);
  }
  return {valid:errors.length===0,errors};
}

export function readinessEntryForOperation(registry={},operation={}){
  const type=String(operation?.type||operation?.operationType||'').trim();
  if(!type)return null;
  const grapheme=String(operation?.grapheme||operation?.label||'').trim().toLocaleUpperCase('fr-FR');
  const entries=Array.isArray(registry?.entries)?registry.entries:[];
  const exact=entries.find(entry=>entry.operationType===type&&String(entry.grapheme||'').trim().toLocaleUpperCase('fr-FR')===grapheme&&grapheme);
  if(exact)return exact;
  return entries.find(entry=>entry.operationType===type&&entry.scope==='generic')||null;
}

export function operationReadiness(registry={},operation={}){
  const entry=readinessEntryForOperation(registry,operation);
  if(!entry)return {readiness:'research_only',authorized:false,entry:null,reason:'no_readiness_entry'};
  return {readiness:entry.readiness,authorized:entry.readiness==='authorized_general',entry,reason:entry.readiness==='authorized_general'?'explicit_general_authorization':'not_authorized_general'};
}

export function composedOperationReadiness(registry={},operations=[]){
  if(!Array.isArray(operations)||operations.length===0)return {readiness:'research_only',authorized:false,parts:[]};
  const parts=operations.map(operation=>operationReadiness(registry,operation));
  const level=Math.min(...parts.map(part=>LEVEL_INDEX.get(part.readiness)??0));
  const readiness=GENERAL_OPERATION_READINESS_LEVELS[level];
  return {readiness,authorized:parts.every(part=>part.authorized),parts};
}
