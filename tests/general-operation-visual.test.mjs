import assert from 'node:assert/strict';
import {generalOperationVisual} from '../src/general-operation-visual.js';

const graphemeSound=generalOperationVisual({operationType:'grapheme_sound',grapheme:'D',ipa:'/d/',reading:'son d'});
assert.deepEqual(graphemeSound,{kind:'grapheme-sound',grapheme:'D',ipa:'/d/',reading:'son d',visual:'grapheme_with_sound_cue'});
assert.deepEqual(generalOperationVisual({operationType:'grapheme_sound',grapheme:'R',ipa:'/ʁ/'}),{kind:'grapheme-sound',grapheme:'R',ipa:'/ʁ/',reading:null,visual:'grapheme_with_sound_cue'});
assert.equal(generalOperationVisual({operationType:'grapheme_sound',grapheme:'D',ipa:''}),null);
assert.equal(generalOperationVisual({operationType:'grapheme_sound',grapheme:'',ipa:'/d/'}),null);

const contextual=generalOperationVisual({operationType:'contextual_grapheme',grapheme:'TION',ipa:'/sjɔ̃/',sourceWord:'nation',sourceIpa:'/nasjɔ̃/',context:'suffix_exact_word_and_ipa_evidence'});
assert.deepEqual(contextual,{kind:'contextual-grapheme',grapheme:'TION',ipa:'/sjɔ̃/',sourceWord:'nation',sourceIpa:'/nasjɔ̃/',context:'suffix_exact_word_and_ipa_evidence',visual:'grapheme_with_source_evidence'});
const tr=generalOperationVisual({operationType:'contextual_grapheme',grapheme:'TR',ipa:'/tʁ/',sourceWord:'train',sourceIpa:'/tʁɛ̃/',context:'prefix_exact_word_and_ipa_evidence'});
assert.equal(tr.kind,'contextual-grapheme');assert.equal(tr.sourceWord,'train');
assert.equal(generalOperationVisual({operationType:'contextual_grapheme',grapheme:'MENT',ipa:'/mɑ̃/',sourceWord:'rapidement',sourceIpa:'',context:'suffix_exact_word_and_ipa_evidence'}),null,'source evidence must be visible and complete');

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

console.log('General operation visuals: grapheme-sound and contextual source-evidence cues stay explicit alongside deletion, substitution and repetition.');
