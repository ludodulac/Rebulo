import assert from 'node:assert/strict';
import {
  strictSyllableCoverage,
  generalLetterSyllableCoverage,
  classifySyllableCoverage,
  analyzeSyllableInventoryCoverage
} from '../src/syllable-coverage.js';

const lexicon=[
  {id:'scie',label:'scie',ipa:'/si/',active:true},
  {id:'nez',label:'nez',ipa:'/ne/',active:true},
  {id:'mat',label:'mât',ipa:'/ma/',active:true},
  {id:'huis',label:'huis',ipa:'/ɥi/',active:true,clinicalStatus:'research_only'},
  {id:'inactive',label:'faux',ipa:'/fo/',active:false}
];

const whole=strictSyllableCoverage('/si/',lexicon);
assert.equal(whole.mode,'strict');
assert.equal(whole.coverageType,'whole_word');
assert.deepEqual(whole.operations.map(op=>op.pieceId),['scie']);

const composite=strictSyllableCoverage('/sinema/',lexicon);
assert.equal(composite.mode,'strict');
assert.equal(composite.coverageType,'composite_words');
assert.deepEqual(composite.operations.map(op=>op.pieceId),['scie','nez','mat']);

const explicitLetter=generalLetterSyllableCoverage('/kaɥi/',lexicon);
assert.equal(explicitLetter.mode,'general');
assert.equal(explicitLetter.coverageType,'explicit_grapheme');
assert.deepEqual(explicitLetter.operations.map(op=>op.type),['grapheme','whole_word']);
assert.equal(explicitLetter.operations[0].grapheme,'K');
assert.equal(explicitLetter.operations[1].pieceId,'huis');

assert.equal(classifySyllableCoverage('/fo/',lexicon).coverageType,'uncovered','inactive pieces must not count as coverage');
assert.equal(classifySyllableCoverage('/kɥi/',lexicon).coverageType,'uncovered','no hidden partial reading or arbitrary spelling fallback is allowed');

const report=analyzeSyllableInventoryCoverage([
  {ipa:'si',targetCount:3},
  {ipa:'sinema',targetCount:1},
  {ipa:'kaɥi',targetCount:1},
  {ipa:'kɥi',targetCount:2}
],lexicon);
assert.deepEqual(report.counts,{whole_word:1,composite_words:1,explicit_grapheme:1,uncovered:1});

console.log('Syllable coverage: strict whole/composite, explicit letter fallback and uncovered state passed.');
