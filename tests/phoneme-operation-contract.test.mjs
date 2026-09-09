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

const minimalPairContract=JSON.parse(fs.readFileSync('data/minimal-pair-contract.json','utf8'));
assert.equal(minimalPairContract.activationPolicy,'explicit_relations_only');
assert.equal(minimalPairContract.activityId,'minimal-pairs');
const isMinimalPair=({leftIpa,rightIpa,differenceIndex,leftPhoneme,rightPhoneme})=>{
  const left=splitIPAUnits(leftIpa);const right=splitIPAUnits(rightIpa);
  if(!left.length||left.length!==right.length)return false;
  const differences=left.map((unit,index)=>unit===right[index]?null:index).filter(index=>index!==null);
  return differences.length===1&&differences[0]===differenceIndex&&left[differenceIndex]===leftPhoneme&&right[differenceIndex]===rightPhoneme;
};
assert.equal(isMinimalPair({leftIpa:'pa',rightIpa:'ba',differenceIndex:0,leftPhoneme:'p',rightPhoneme:'b'}),true);
assert.equal(isMinimalPair({leftIpa:'pa',rightIpa:'bu',differenceIndex:0,leftPhoneme:'p',rightPhoneme:'b'}),false,'two phoneme differences are not a minimal pair');
assert.equal(isMinimalPair({leftIpa:'pa',rightIpa:'ba',differenceIndex:1,leftPhoneme:'a',rightPhoneme:'a'}),false,'declared index must be the unique contrast');

const lexicon=JSON.parse(fs.readFileSync('data/lexicon-seed.json','utf8'));
const byLabel=new Map(lexicon.map(item=>[item.label,item]));
const bank=JSON.parse(fs.readFileSync('data/minimal-pair-relations.json','utf8'));
assert.equal(bank.clinicalValidation,'not_claimed');
assert.ok(bank.relations.length>=3,'seed bank should contain several explicit relations');
for(const relation of bank.relations){
  assert.equal(isMinimalPair(relation),true,`${relation.relationId} must satisfy the exact one-phoneme contrast`);
  const left=byLabel.get(relation.leftWord);const right=byLabel.get(relation.rightWord);
  assert.ok(left&&right,`${relation.relationId} must reference labels already present in the active lexicon seed`);
  assert.equal(normalizeIPA(left.ipa),normalizeIPA(relation.leftIpa));
  assert.equal(normalizeIPA(right.ipa),normalizeIPA(relation.rightIpa));
  assert.equal(relation.source,'data/lexicon-seed.json');
}

console.log('phoneme contracts: indexed operations and explicit minimal-pair bank are controllable and grounded in the active lexicon seed');
