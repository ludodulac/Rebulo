import assert from 'node:assert/strict';
import {
  REBUS_CAPABILITIES,
  REBUS_OPERATION_TYPES,
  buildExplicitDeletionOperation,
  buildExplicitSubstitutionOperation,
  buildGeneralConstruction,
  buildGraphemeOperation,
  buildRepetitionOperation,
  buildSpatialRelationOperation,
  buildStrictConstruction,
  buildWholeWordOperation,
  isOperationImplemented,
  operationDefinition,
  supportsConstructionCapability
} from '../src/rebus-construction.js';

const mer={id:'mer',label:'mer',reading:'mer',ipa:'/mɛʁ/',image:'assets/rebus/mer.svg'};
const scie={id:'scie',label:'scie',reading:'scie',ipa:'/si/',image:'assets/rebus/scie.svg'};
const chat={id:'chat',label:'chat',reading:'chat',ipa:'/ʃa/',image:'assets/rebus/chat.svg'};
const yoyo={id:'yoyo',label:'yo-yo',reading:'yo-yo',ipa:'/jojo/',image:'openmoji-yoyo.svg'};

const operation=buildWholeWordOperation(mer);
assert.deepEqual(operation,{type:'whole_word',pieceId:'mer',label:'mer',reading:'mer',ipa:'/mɛʁ/',image:'assets/rebus/mer.svg'});
assert.equal(buildWholeWordOperation({label:'mer'}),null);

assert.equal(isOperationImplemented(REBUS_OPERATION_TYPES.WHOLE_WORD),true);
assert.equal(operationDefinition(REBUS_OPERATION_TYPES.WHOLE_WORD).strictCompatible,true);
assert.equal(isOperationImplemented(REBUS_OPERATION_TYPES.GRAPHEME),true);
assert.equal(operationDefinition(REBUS_OPERATION_TYPES.GRAPHEME).strictCompatible,false);
assert.equal(isOperationImplemented(REBUS_OPERATION_TYPES.SPATIAL_RELATION),true);
assert.equal(operationDefinition(REBUS_OPERATION_TYPES.SPATIAL_RELATION).strictCompatible,false);
assert.equal(isOperationImplemented(REBUS_OPERATION_TYPES.EXPLICIT_DELETION),true);
assert.equal(operationDefinition(REBUS_OPERATION_TYPES.EXPLICIT_DELETION).strictCompatible,false);
assert.equal(isOperationImplemented(REBUS_OPERATION_TYPES.EXPLICIT_SUBSTITUTION),true);
assert.equal(operationDefinition(REBUS_OPERATION_TYPES.EXPLICIT_SUBSTITUTION).strictCompatible,false);
assert.equal(isOperationImplemented(REBUS_OPERATION_TYPES.REPETITION),true);
assert.equal(operationDefinition(REBUS_OPERATION_TYPES.REPETITION).strictCompatible,false);
assert.equal(operationDefinition('unknown'),null);

const grapheme=buildGraphemeOperation(' R ','air');
assert.deepEqual(grapheme,{type:'grapheme',grapheme:'R',reading:'air'});
assert.deepEqual(buildGraphemeOperation('K'),{type:'grapheme',grapheme:'K',reading:'K'});
assert.equal(buildGraphemeOperation('   '),null);
assert.equal(buildGraphemeOperation(null),null);

const under=buildSpatialRelationOperation('under');
assert.deepEqual(under,{type:'spatial_relation',relation:'under',reading:'sous'});
assert.equal(buildSpatialRelationOperation('above'),null);
assert.equal(buildSpatialRelationOperation(''),null);

const halfYoyo=buildExplicitDeletionOperation(yoyo,{keep:'premier yo',remove:'second yo',reading:'yo',visual:'half'});
assert.ok(halfYoyo);
assert.equal(halfYoyo.type,'explicit_deletion');
assert.equal(halfYoyo.sourceReading,'yo-yo');
assert.equal(halfYoyo.reading,'yo');
assert.equal(halfYoyo.keep,'premier yo');
assert.equal(halfYoyo.remove,'second yo');
assert.equal(halfYoyo.visual,'half');
assert.equal(buildExplicitDeletionOperation(yoyo,{keep:'premier yo',remove:'second yo',reading:'yo'}).visual,'cross_out');
assert.equal(buildExplicitDeletionOperation({...yoyo,image:''},{keep:'premier yo',remove:'second yo',reading:'yo'}),null);
assert.equal(buildExplicitDeletionOperation(yoyo,{keep:'',remove:'second yo',reading:'yo'}),null);
assert.equal(buildExplicitDeletionOperation(yoyo,{keep:'yo',remove:'yo',reading:'yo'}),null,'deletion must identify distinct visible parts');

const substitution=buildExplicitSubstitutionOperation(chat,{replace:'CH',replacement:'R',reading:'rat',visual:'cross_out_replace'});
assert.ok(substitution);
assert.equal(substitution.type,'explicit_substitution');
assert.equal(substitution.sourceReading,'chat');
assert.equal(substitution.replace,'CH');
assert.equal(substitution.replacement,'R');
assert.equal(substitution.reading,'rat');
assert.equal(substitution.visual,'cross_out_replace');
assert.equal(buildExplicitSubstitutionOperation({...chat,image:''},{replace:'CH',replacement:'R',reading:'rat',visual:'swap'}),null);
for(const options of [
  {replacement:'R',reading:'rat',visual:'swap'},
  {replace:'CH',reading:'rat',visual:'swap'},
  {replace:'CH',replacement:'R',visual:'swap'},
  {replace:'CH',replacement:'R',reading:'rat'},
  {replace:'CH',replacement:'ch',reading:'chat',visual:'swap'},
  {replace:'ZZ',replacement:'R',reading:'rat',visual:'swap'},
  {replace:'CH',replacement:'R',reading:'rit',visual:'swap'},
  {replace:'CH',replacement:'R',reading:'rat',visual:'hidden'}
]){
  assert.equal(buildExplicitSubstitutionOperation(chat,options),null,'substitution must be complete, unique, visibly specified and produce its declared reading');
}
assert.equal(buildExplicitSubstitutionOperation(yoyo,{replace:'yo',replacement:'la',reading:'la-yo',visual:'swap'}),null,'ambiguous repeated source fragments cannot be substituted implicitly');

const repeated=buildRepetitionOperation(mer,{count:3,reading:'mer mer mer'});
assert.ok(repeated);
assert.equal(repeated.type,'repetition');
assert.equal(repeated.sourceReading,'mer');
assert.equal(repeated.count,3);
assert.equal(repeated.reading,'mer mer mer');
assert.equal(repeated.visual,'copies');
for(const options of [{count:1,reading:'mer'},{count:2,reading:''},{count:2.5,reading:'mer mer'},{count:7,reading:'mer mer'}]){
  assert.equal(buildRepetitionOperation(mer,options),null,'repetition must have a bounded visible count and documented reading');
}
assert.equal(buildRepetitionOperation({...mer,image:''},{count:2,reading:'mer mer'}),null);

const mixed=buildGeneralConstruction([operation,grapheme]);
assert.ok(mixed);
assert.equal(mixed.mode,'general');
assert.deepEqual(mixed.operations.map(item=>item.type),['whole_word','grapheme']);
assert.equal(supportsConstructionCapability(mixed,REBUS_CAPABILITIES.GENERAL),true);
assert.equal(supportsConstructionCapability(mixed,REBUS_CAPABILITIES.PHONETIC_STRICT),false);
const spatial=buildGeneralConstruction([under,operation]);
assert.ok(spatial);
assert.equal(spatial.mode,'general');
assert.deepEqual(spatial.operations.map(item=>item.type),['spatial_relation','whole_word']);
assert.equal(supportsConstructionCapability(spatial,REBUS_CAPABILITIES.PHONETIC_STRICT),false);
for(const generalOnly of [halfYoyo,substitution,repeated]){
  const construction=buildGeneralConstruction([generalOnly]);
  assert.ok(construction);
  assert.equal(construction.mode,'general');
  assert.equal(supportsConstructionCapability(construction,REBUS_CAPABILITIES.PHONETIC_STRICT),false);
}
assert.equal(buildGeneralConstruction([]),null);

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

console.log('Rebulo construction model: explicit deletion, semantically checked substitution and repetition stay visible and general-only.');
