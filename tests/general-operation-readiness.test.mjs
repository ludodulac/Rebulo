import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateGeneralOperationReadinessRegistry,operationReadiness,composedOperationReadiness} from '../src/general-operation-readiness.js';

const registry=JSON.parse(fs.readFileSync(new URL('../data/general-operation-readiness.json',import.meta.url),'utf8'));
const validation=validateGeneralOperationReadinessRegistry(registry);
assert.equal(validation.valid,true,validation.errors.join('\n'));

const genericLetter=operationReadiness(registry,{type:'grapheme',grapheme:'A'});
assert.equal(genericLetter.readiness,'authorized_general');
assert.equal(genericLetter.authorized,true);

for(const [grapheme,ipa] of [['D','/d/'],['R','/ʁ/'],['L','/l/'],['N','/n/'],['GN','/ɲ/'],['Y','/j/']]){
  const result=operationReadiness(registry,{type:'grapheme_sound',grapheme,ipa});
  assert.equal(result.readiness,'visual_cue_defined',`${grapheme} sound cue should still require comprehension testing`);
  assert.equal(result.authorized,false,`${grapheme} sound cue must not auto-authorize general use`);
}

for(const grapheme of ['TR','MENT','TION','SION','IN','UN']){
  const result=operationReadiness(registry,{type:'contextual_grapheme_research',grapheme});
  assert.equal(result.readiness,'research_only',`${grapheme} must remain context-sensitive research`);
  assert.equal(result.authorized,false);
}

const composed=composedOperationReadiness(registry,[
  {type:'grapheme_sound',grapheme:'D',ipa:'/d/'},
  {type:'grapheme',grapheme:'I'},
  {type:'grapheme',grapheme:'T'}
]);
assert.equal(composed.readiness,'visual_cue_defined','/dite/ composition inherits its least mature visible operation');
assert.equal(composed.authorized,false,'a composition is not authorized while any part remains untested');

const unknown=operationReadiness(registry,{type:'grapheme_sound',grapheme:'Q',ipa:'/k/'});
assert.equal(unknown.readiness,'research_only');
assert.equal(unknown.authorized,false);

const bad=structuredClone(registry);bad.entries[0].automaticActivation=true;
assert.equal(validateGeneralOperationReadinessRegistry(bad).valid,false);

console.log('general operation readiness: documented, visually defined and authorized states stay distinct from strict mode.');
