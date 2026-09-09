import assert from 'node:assert/strict';
import fs from 'node:fs';
import {splitIPAUnits,normalizeIPA} from '../src/phonetic-engine.js';

const contract=JSON.parse(fs.readFileSync('data/phoneme-operation-contract.json','utf8'));
assert.equal(contract.activationPolicy,'explicit_operations_only');
assert.deepEqual(contract.activities,['phoneme-deletion','phoneme-substitution']);
assert.equal(contract.sharedRequirements.operationIndexRequired,true);
assert.equal(contract.sharedRequirements.expectedResponseRequired,true);
assert.equal(contract.sharedRequirements.orthographicInferenceForbidden,true);
assert.equal(contract.sharedRequirements.rebusPieceInferenceForbidden,true);

const deletion=({sourceIpa,removeIndex,removePhoneme,expectedIpa})=>{
  const units=splitIPAUnits(sourceIpa);
  if(units[removeIndex]!==removePhoneme)return false;
  return normalizeIPA([...units.slice(0,removeIndex),...units.slice(removeIndex+1)].join(''))===normalizeIPA(expectedIpa);
};
const substitution=({sourceIpa,replaceIndex,fromPhoneme,toPhoneme,expectedIpa})=>{
  const units=splitIPAUnits(sourceIpa);
  if(units[replaceIndex]!==fromPhoneme)return false;
  const next=[...units];next[replaceIndex]=toPhoneme;
  return normalizeIPA(next.join(''))===normalizeIPA(expectedIpa);
};

assert.equal(deletion({sourceIpa:'pla',removeIndex:0,removePhoneme:'p',expectedIpa:'la'}),true);
assert.equal(deletion({sourceIpa:'pla',removeIndex:1,removePhoneme:'p',expectedIpa:'la'}),false,'wrong index must be rejected');
assert.equal(substitution({sourceIpa:'pa',replaceIndex:0,fromPhoneme:'p',toPhoneme:'b',expectedIpa:'ba'}),true);
assert.equal(substitution({sourceIpa:'pa',replaceIndex:0,fromPhoneme:'p',toPhoneme:'b',expectedIpa:'pa'}),false,'unchanged expected response must be rejected');

console.log('phoneme operation contract: indexed deletion/substitution and exact expected IPA are controllable');
