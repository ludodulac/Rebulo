import assert from 'node:assert/strict';
import {generalOperationVisual} from '../src/general-operation-visual.js';

const half=generalOperationVisual({operationType:'explicit_deletion',image:'yoyo.svg',label:'yo-yo',sourceReading:'yo-yo',keep:'premier yo',remove:'second yo',reading:'yo',visual:'half'});
assert.deepEqual(half,{kind:'deletion-half',image:'yoyo.svg',label:'yo-yo',reading:'yo',sourceReading:'yo-yo',keep:'premier yo',remove:'second yo'});
const crossed=generalOperationVisual({operationType:'explicit_deletion',image:'yoyo.svg',label:'yo-yo',sourceReading:'yo-yo',keep:'premier yo',remove:'second yo',reading:'yo',visual:'cross_out'});
assert.equal(crossed.kind,'deletion-cross-out');

const substitution=generalOperationVisual({operationType:'explicit_substitution',image:'yoyo.svg',label:'yo-yo',sourceReading:'yo-yo',replace:'second yo',replacement:'la',reading:'yola',visual:'cross_out_replace'});
assert.equal(substitution.kind,'substitution');
assert.equal(substitution.replace,'second yo');
assert.equal(substitution.replacement,'la');
assert.equal(generalOperationVisual({...substitution,operationType:'explicit_substitution',visual:'hidden'}),null);

const repetition=generalOperationVisual({operationType:'repetition',image:'mer.svg',label:'mer',sourceReading:'mer',count:4,reading:'mer mer mer mer'});
assert.equal(repetition.kind,'repetition');
assert.equal(repetition.count,4);
for(const count of [1,2.5,7])assert.equal(generalOperationVisual({operationType:'repetition',image:'mer.svg',label:'mer',sourceReading:'mer',count,reading:'mer'}),null);

assert.equal(generalOperationVisual({operationType:'whole_word',image:'mer.svg'}),null);
assert.equal(generalOperationVisual({operationType:'explicit_deletion',image:'yoyo.svg',sourceReading:'yo-yo',reading:'yo'}),null);
assert.equal(generalOperationVisual({operationType:'repetition',image:'',sourceReading:'mer',count:2,reading:'mer mer'}),null);

console.log('General operation visuals: deletion, substitution and repetition expose explicit render models.');
