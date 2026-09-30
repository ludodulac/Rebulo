import fs from 'node:fs';

const schemaPath=new URL('../data/rebulo-canonical-state.schema.json',import.meta.url);
const registryPath=new URL('../data/rebulo-canonical-state.json',import.meta.url);

const schema=JSON.parse(fs.readFileSync(schemaPath,'utf8'));
const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));

function resolveRef(ref){
  if(!ref.startsWith('#/'))throw new Error(`Unsupported schema ref: ${ref}`);
  return ref.slice(2).split('/').reduce((value,key)=>value[key.replace(/~1/g,'/').replace(/~0/g,'~')],schema);
}

function isType(value,type){
  if(type==='null')return value===null;
  if(type==='array')return Array.isArray(value);
  if(type==='object')return value!==null&&typeof value==='object'&&!Array.isArray(value);
  if(type==='integer')return Number.isInteger(value);
  if(type==='number')return typeof value==='number'&&Number.isFinite(value);
  return typeof value===type;
}

function validate(value,node,path='$'){
  const errors=[];
  if(!node||typeof node!=='object')return errors;

  if(node.$ref)errors.push(...validate(value,resolveRef(node.$ref),path));

  if(node.type){
    const types=Array.isArray(node.type)?node.type:[node.type];
    if(!types.some(type=>isType(value,type))){
      errors.push(`${path}: expected type ${types.join('|')}`);
      return errors;
    }
  }

  if(Object.prototype.hasOwnProperty.call(node,'const')&&JSON.stringify(value)!==JSON.stringify(node.const)){
    errors.push(`${path}: const mismatch`);
  }

  if(node.enum&&!node.enum.some(option=>JSON.stringify(option)===JSON.stringify(value))){
    errors.push(`${path}: enum mismatch`);
  }

  if(typeof value==='string'){
    if(node.minLength!=null&&value.length<node.minLength)errors.push(`${path}: minLength`);
    if(node.pattern&&!(new RegExp(node.pattern)).test(value))errors.push(`${path}: pattern mismatch`);
    if(node.format==='date-time'&&Number.isNaN(Date.parse(value)))errors.push(`${path}: invalid date-time`);
  }

  if(typeof value==='number'&&node.minimum!=null&&value<node.minimum){
    errors.push(`${path}: minimum ${node.minimum}`);
  }

  if(Array.isArray(value)&&node.items){
    value.forEach((item,index)=>errors.push(...validate(item,node.items,`${path}[${index}]`)));
  }

  if(value!==null&&typeof value==='object'&&!Array.isArray(value)){
    for(const key of node.required||[]){
      if(!Object.prototype.hasOwnProperty.call(value,key))errors.push(`${path}: missing ${key}`);
    }
    for(const [key,child] of Object.entries(node.properties||{})){
      if(Object.prototype.hasOwnProperty.call(value,key))errors.push(...validate(value[key],child,`${path}.${key}`));
    }
    if(node.additionalProperties===false&&node.properties){
      for(const key of Object.keys(value)){
        if(!Object.prototype.hasOwnProperty.call(node.properties,key))errors.push(`${path}: unexpected property ${key}`);
      }
    }
  }

  for(const child of node.allOf||[])errors.push(...validate(value,child,path));

  if(node.anyOf){
    const branches=node.anyOf.map(child=>validate(value,child,path));
    if(!branches.some(branch=>branch.length===0))errors.push(`${path}: anyOf failed`);
  }

  if(node.if&&validate(value,node.if,path).length===0&&node.then){
    errors.push(...validate(value,node.then,path));
  }

  return errors;
}

const schemaErrors=validate(registry,schema);
if(schemaErrors.length){
  console.error(JSON.stringify({schema_validation:'FAIL',errors:schemaErrors},null,2));
  process.exit(1);
}

const ids=registry.representations.map(record=>record.concept_id);
const duplicateConceptIds=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
if(duplicateConceptIds.length){
  console.error(JSON.stringify({schema_validation:'PASS',duplicate_concept_ids:duplicateConceptIds},null,2));
  process.exit(2);
}

const driveCandidateIds=registry.representations.flatMap(record=>
  record.provenance
    .filter(entry=>entry.source_type==='DRIVE_CANDIDATE')
    .map(entry=>entry.source_id)
);
const uniqueDriveCandidateIds=[...new Set(driveCandidateIds)];
const candidateRecords=registry.representations.filter(record=>record.graphic_status==='CANDIDATE');
const duplicateConcepts=registry.representations
  .filter(record=>record.provenance.filter(entry=>entry.source_type==='DRIVE_CANDIDATE').length>1)
  .map(record=>record.concept_id);

const counters={
  registry_representation_count:registry.representations.length,
  drive_candidate_file_count:uniqueDriveCandidateIds.length,
  candidate_concept_count:candidateRecords.length,
  duplicate_candidate_file_count:uniqueDriveCandidateIds.length-
    registry.representations.filter(record=>record.provenance.some(entry=>entry.source_type==='DRIVE_CANDIDATE')).length,
  human_validated_count:registry.representations.filter(record=>
    record.visual_validation.status==='PASS'&&record.naming_validation.status==='PASS'
  ).length,
  runtime_active_count:registry.representations.filter(record=>
    record.runtime_active===true&&record.runtime_status==='RUNTIME_ACTIVE'
  ).length
};

console.log(JSON.stringify({
  schema_validation:'PASS',
  duplicate_concept_ids:[],
  duplicate_concepts:duplicateConcepts,
  counters
},null,2));
