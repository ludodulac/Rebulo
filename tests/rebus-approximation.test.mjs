import assert from 'node:assert/strict';
import fs from 'node:fs';
import {alignApproximateIPA,analyzeApproximation,findApproximateWholeWordCandidates,buildApproximateLexicalIndex,vowelSubstitutionWeight,consonantSubstitutionWeight} from '../src/rebus-approximation.js';
import {buildWholeWordCandidateIndex} from '../src/syllable-representation-candidates.js';

const policy=JSON.parse(fs.readFileSync('data/rebus-approximation-policy.json','utf8'));

const exact=analyzeApproximation('pat','pat',policy);
assert.equal(exact.tier,'exact');
assert.equal(exact.mode,'strict');
assert.equal(exact.strictEligible,true);
assert.equal(exact.clinicalDefaultEligible,false,'phonetic exactness must not imply clinical eligibility');
assert.equal(exact.approximationAllowedByDefaultInClinicalMode,false);
assert.equal(exact.clinicalEvidence,'none');
assert.equal(exact.editorialApproximationPercent,0);

const laitToLes=analyzeApproximation('lɛ','le',policy);
assert.equal(laitToLes.tier,'light');
assert.equal(laitToLes.mode,'general');
assert.equal(laitToLes.strictEligible,false);
assert.equal(laitToLes.clinicalDefaultEligible,false);
assert.equal(laitToLes.approximationAllowedByDefaultInClinicalMode,false);
assert.equal(laitToLes.clinicalEvidence,'none');
assert.equal(laitToLes.editCount,1);
assert.deepEqual(laitToLes.operations.map(operation=>operation.type),['substitution']);
assert.ok(laitToLes.editorialApproximationPercent>0&&laitToLes.editorialApproximationPercent<=20);

assert.ok(vowelSubstitutionWeight('ɛ','e',policy)<vowelSubstitutionWeight('a','i',policy),'near oral vowels must cost less than distant vowels');
assert.ok(vowelSubstitutionWeight('ɛ','e',policy)<vowelSubstitutionWeight('ɛ','ɛ̃',policy),'small aperture contrast must cost less than adding nasalization');
assert.ok(vowelSubstitutionWeight('ɛ̃','ɑ̃',policy)>=vowelSubstitutionWeight('ɛ','ɛ̃',policy),'unrelated nasal vowels must not be cheaper than oral/nasal counterparts');

const painToPa=analyzeApproximation('pɛ̃','pa',policy);
assert.equal(painToPa.tier,'too_far','pain must not be a light approximation for /pa/ just because only one vowel unit changes');
assert.equal(painToPa.eligible,false);

const mainToMan=analyzeApproximation('mɛ̃','mɑ̃',policy);
assert.equal(mainToMan.tier,'too_far','two distinct nasal vowels must not be treated as a light shortcut on a two-unit target');
assert.equal(mainToMan.eligible,false);

const seauToSi=analyzeApproximation('so','si',policy);
assert.equal(seauToSi.tier,'too_far','distant oral vowels on a short target must not pass the light budget');
assert.equal(seauToSi.eligible,false);

const schwaToE=analyzeApproximation('nə','ne',policy);
assert.equal(schwaToE.tier,'light','a schwa-neighbor substitution may remain a small magazine approximation when the rest is identical');

assert.ok(consonantSubstitutionWeight('p','b',policy)<consonantSubstitutionWeight('p','v',policy),'a pure voicing pair must cost less than an unrelated consonant change');
assert.ok(consonantSubstitutionWeight('f','v',policy)<consonantSubstitutionWeight('f','m',policy),'explicit fricative voicing pairs must remain cheaper than unrelated substitutions');

const paToBa=analyzeApproximation('pa','ba',policy);
assert.equal(paToBa.tier,'light','a single explicit voicing contrast may remain a small general-mode approximation');
assert.equal(paToBa.strictEligible,false);
assert.equal(paToBa.clinicalDefaultEligible,false);

const poireToVoir=analyzeApproximation('pwaʁ','vwaʁ',policy);
assert.equal(poireToVoir.tier,'too_far','poire must not be treated as a light approximation for voir: /p/→/v/ changes more than voicing');
assert.equal(poireToVoir.eligible,false);

const cerfToMere=analyzeApproximation('sɛʁ','mɛʁ',policy);
assert.equal(cerfToMere.tier,'too_far','cerf must not be treated as a light approximation for mère from one unrelated consonant substitution');
assert.equal(cerfToMere.eligible,false);

const consonantChange=alignApproximateIPA('pat','pak',policy);
assert.equal(consonantChange.editCount,1);
assert.ok(consonantChange.weightedCost>laitToLes.weightedCost,'unrelated consonant substitution should cost more than a near-vowel substitution');

const edgeDeletion=analyzeApproximation('paʁk','paʁ',policy);
assert.equal(edgeDeletion.tier,'light','a single edge deletion may remain a small general-mode approximation');
assert.equal(edgeDeletion.operations[0].type,'deletion');
assert.equal(edgeDeletion.operations[0].editPosition,'edge');

const internalDeletion=analyzeApproximation('pwaʁ','paʁ',policy);
assert.equal(internalDeletion.tier,'too_far','an internal glide deletion in a short chunk must not pass the light budget');
assert.equal(internalDeletion.eligible,false);
assert.equal(internalDeletion.operations[0].type,'deletion');
assert.equal(internalDeletion.operations[0].editPosition,'internal');

const edgeInsertion=analyzeApproximation('bwa','bwaʁ',policy);
assert.equal(edgeInsertion.tier,'light','a single edge insertion may remain a small general-mode approximation');
assert.equal(edgeInsertion.operations[0].type,'insertion');
assert.equal(edgeInsertion.operations[0].editPosition,'edge');

const internalInsertion=analyzeApproximation('sɛl','sjɛl',policy);
assert.equal(internalInsertion.tier,'too_far','an internal glide insertion in a short chunk must not pass the light budget');
assert.equal(internalInsertion.eligible,false);
assert.equal(internalInsertion.operations[0].type,'insertion');
assert.equal(internalInsertion.operations[0].editPosition,'internal');

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
  {word:'pain',lemma:'pain',ipa:'pɛ̃',pos:'NOM',frequency:150,syllableCount:1},
  {word:'pas',lemma:'pas',ipa:'pa',pos:'NOM',frequency:180,syllableCount:1},
  {word:'poire',lemma:'poire',ipa:'pwaʁ',pos:'NOM',frequency:70,syllableCount:1},
  {word:'parc',lemma:'parc',ipa:'paʁk',pos:'NOM',frequency:80,syllableCount:1},
  {word:'voir',lemma:'voir',ipa:'vwaʁ',pos:'VER',frequency:250,syllableCount:1},
  {word:'pré',lemma:'pré',ipa:'pʁe',pos:'NOM',frequency:20,syllableCount:1},
  {word:'près',lemma:'près',ipa:'pʁɛ',pos:'ADV',frequency:100,syllableCount:1}
];
const exactIndex=buildWholeWordCandidateIndex(entries);
const approximateIndex=buildApproximateLexicalIndex(exactIndex);
const candidates=findApproximateWholeWordCandidates('le',exactIndex,policy,{approximateIndex,limit:10});
assert.ok(candidates.some(candidate=>candidate.word==='lait'&&candidate.sourceIpa==='lɛ'));
assert.ok(candidates.every(candidate=>candidate.approximation.mode==='general'));
assert.ok(candidates.every(candidate=>candidate.approximation.strictEligible===false));
assert.ok(candidates.every(candidate=>candidate.approximation.clinicalDefaultEligible===false));
assert.ok(!candidates.some(candidate=>candidate.word==='les'),'exact candidates must not be returned as approximation candidates');
const paCandidates=findApproximateWholeWordCandidates('pa',exactIndex,policy,{approximateIndex,limit:10});
assert.ok(!paCandidates.some(candidate=>candidate.word==='pain'),'vowel-quality guard must remove pain from /pa/ approximation candidates');
const voirCandidates=findApproximateWholeWordCandidates('vwaʁ',exactIndex,policy,{approximateIndex,limit:10});
assert.ok(!voirCandidates.some(candidate=>candidate.word==='poire'),'consonant-quality guard must remove poire from /vwaʁ/ approximation candidates');
const parCandidates=findApproximateWholeWordCandidates('paʁ',exactIndex,policy,{approximateIndex,limit:10});
assert.ok(parCandidates.some(candidate=>candidate.word==='parc'),'edge-edit policy should retain parc as an approximation candidate for /paʁ/');
assert.ok(!parCandidates.some(candidate=>candidate.word==='poire'),'internal-edit policy should remove poire as an approximation candidate for /paʁ/');

console.log('rebus approximation: strict exactness stays separate from clinical evidence; editorial approximation safeguards remain intact');
