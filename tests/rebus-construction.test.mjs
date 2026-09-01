import assert from 'node:assert/strict';
import {
  REBUS_CAPABILITIES,
  REBUS_OPERATION_TYPES,
  buildStrictConstruction,
  buildWholeWordOperation,
  isOperationImplemented,
  operationDefinition,
  supportsConstructionCapability
} from '../src/rebus-construction.js';

const mer={id:'mer',label:'mer',reading:'mer',ipa:'/mɛʁ/',image:'assets/rebus/mer.svg'};
const scie={id:'scie',label:'scie',reading:'scie',ipa:'/si/',image:'assets/rebus/scie.svg'};

const operation=buildWholeWordOperation(mer);
assert.deepEqual(operation,{
  type:'whole_word',
  pieceId:'mer',
  label:'mer',
  reading:'mer',
  ipa:'/mɛʁ/',
  image:'assets/rebus/mer.svg'
});
assert.equal(buildWholeWordOperation({label:'mer'}),null);

assert.equal(isOperationImplemented(REBUS_OPERATION_TYPES.WHOLE_WORD),true);
assert.equal(operationDefinition(REBUS_OPERATION_TYPES.WHOLE_WORD).strictCompatible,true);
for(const type of [
  REBUS_OPERATION_TYPES.GRAPHEME,
  REBUS_OPERATION_TYPES.SPATIAL_RELATION,
  REBUS_OPERATION_TYPES.EXPLICIT_DELETION,
  REBUS_OPERATION_TYPES.EXPLICIT_SUBSTITUTION,
  REBUS_OPERATION_TYPES.REPETITION
]){
  assert.equal(isOperationImplemented(type),false,`${type} must remain declared but unavailable`);
}
assert.equal(operationDefinition('unknown'),null);

const merci=buildStrictConstruction([mer,scie],'/mɛʁsi/');
assert.ok(merci);
assert.equal(merci.mode,'strict');
assert.deepEqual(merci.operations.map(item=>item.type),['whole_word','whole_word']);
assert.equal(supportsConstructionCapability(merci,REBUS_CAPABILITIES.GENERAL),true);
assert.equal(supportsConstructionCapability(merci,REBUS_CAPABILITIES.PHONETIC_STRICT),true);
assert.equal(merci.validation.builtIpa,'mɛʁsi');
assert.equal(merci.validation.targetIpa,'mɛʁsi');

assert.equal(buildStrictConstruction([mer,scie],'/ʁebys/'),null);
assert.equal(buildStrictConstruction([], '/mɛʁsi/'),null);

console.log('Rebulo construction model: operation types and strict capabilities preserved.');
