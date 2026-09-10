import assert from 'node:assert/strict';
import fs from 'node:fs';
import {alignApproximateIPA,analyzeApproximation,findApproximateWholeWordCandidates,buildApproximateLexicalIndex} from '../src/rebus-approximation.js';
import {buildWholeWordCandidateIndex} from '../src/syllable-representation-candidates.js';

const policy=JSON.parse(fs.readFileSync('data/rebus-approximation-policy.json','utf8'));

const exact=analyzeApproximation('pat','pat',policy);
assert.equal(exact.tier,'exact');
assert.equal(exact.mode,'strict');
assert.equal(exact.strictEligible,true);
assert.equal(exact.clinicalDefaultEligible,true);
assert.equal(exact.editorialApproximationPercent,0);

const laitToLes=analyzeApproximation('lɛ','le',policy);
assert.equal(laitToLes.tier,'light');
assert.equal(laitToLes.mode,'general');
assert.equal(laitToLes.strictEligible,false);
assert.equal(laitToLes.clinicalDefaultEligible,false);
assert.equal(laitToLes.editCount,1);
assert.deepEqual(laitToLes.operations.map(operation=>operation.type),['substitution']);
assert.ok(laitToLes.editorialApproximationPercent>0&&laitToLes.editorialApproximationPercent<=20);

const consonantChange=alignApproximateIPA('pat','pak',policy);
assert.equal(consonantChange.editCount,1);
assert.ok(consonantChange.weightedCost>laitToLes.weightedCost,'consonant substitution should cost more than a within-vowel substitution');

const insertion=analyzeApproximation('pa','pat',policy);
assert.equal(insertion.strictEligible,false);
assert.equal(insertion.operations.length,1);
assert.equal(insertion.operations[0].type,'insertion');

const tooShort=analyzeApproximation('a','i',policy);
assert.equal(tooShort.eligible,false,'single-phoneme substitutions must not become magazine shortcuts');
assert.equal(tooShort.tier,'too_far');

const tooFar=analyzeApproximation('papa','kiki',policy);
assert.equal(tooFar.eligible,false);
assert.equal(tooFar.tier,'too_far');

const entries=[
  {word:'lait',lemma:'lait',ipa:'lɛ',pos:'NOM',frequency:90,syllableCount:1},
  {word:'les',lemma:'le',ipa:'le',pos:'ADJ',frequency:200,syllableCount:1},
  {word:'pré',lemma:'pré',ipa:'pʁe',pos:'NOM',frequency:20,syllableCount:1},
  {word:'près',lemma:'près',ipa:'pʁɛ',pos:'ADV',frequency:100,syllableCount:1}
];
const exactIndex=buildWholeWordCandidateIndex(entries);
const approximateIndex=buildApproximateLexicalIndex(exactIndex);
const candidates=findApproximateWholeWordCandidates('le',exactIndex,policy,{approximateIndex,limit:10});
assert.ok(candidates.some(candidate=>candidate.word==='lait'&&candidate.sourceIpa==='lɛ'));
assert.ok(candidates.every(candidate=>candidate.approximation.mode==='general'));
assert.ok(candidates.every(candidate=>candidate.approximation.strictEligible===false));
assert.ok(!candidates.some(candidate=>candidate.word==='les'),'exact candidates must not be returned as approximation candidates');

console.log('rebus approximation: exact isolation, weighted edits, short-segment guard and approximate lexical lookup');
