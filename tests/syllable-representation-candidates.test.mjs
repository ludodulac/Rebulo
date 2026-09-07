import assert from 'node:assert/strict';
import {
  wholeWordRepresentationCandidates,
  buildRepresentationResearchQueue,
  representationResearchStats
} from '../src/syllable-representation-candidates.js';

const entries=[
  {word:'huis',lemma:'huis',ipa:'ɥi',pos:'NOM',frequency:2.1,syllableCount:1},
  {word:'Pâques',lemma:'Pâques',ipa:'pak',pos:'NOM',frequency:7.5,syllableCount:1},
  {word:'cuit',lemma:'cuire',ipa:'kɥi',pos:'ADJ',frequency:25,syllableCount:1},
  {word:'cuit',lemma:'cuire',ipa:'kɥi',pos:'VER',frequency:40,syllableCount:1},
  {word:'cuits',lemma:'cuire',ipa:'kɥi',pos:'ADJ',frequency:3,syllableCount:1},
  {word:'et',lemma:'et',ipa:'e',pos:'CON',frequency:9999,syllableCount:1}
];

const huis=wholeWordRepresentationCandidates('/ɥi/',entries);
assert.equal(huis.length,1);
assert.equal(huis[0].word,'huis');
assert.equal(huis[0].phoneticStatus,'whole_pronunciation_exact');
assert.equal(huis[0].visualStatus,'unreviewed');
assert.equal(huis[0].activationState,'research_only');

const paques=wholeWordRepresentationCandidates('/pak/',entries);
assert.equal(paques[0].word,'Pâques');
assert.equal(paques[0].pos,'NOM');

const cuit=wholeWordRepresentationCandidates('/kɥi/',entries);
assert.equal(cuit.length,1,'same lemma/IPA must not flood the research queue with inflections');
assert.equal(cuit[0].word,'cuit');
assert.equal(cuit[0].visualStatus,'unreviewed','phonetic exactness must never imply a usable image');

assert.deepEqual(wholeWordRepresentationCandidates('/e/',entries),[],'function words outside the research POS set are not visual candidates');

const queue=buildRepresentationResearchQueue([
  {ipa:'kɥi',targetCount:8,totalFrequency:200,minAgeBandCandidate:5,examples:['biscuit'],coverage:{coverageType:'uncovered'}},
  {ipa:'ɥi',targetCount:4,totalFrequency:50,minAgeBandCandidate:5,examples:['huile'],coverage:{coverageType:'uncovered'}},
  {ipa:'pak',targetCount:2,totalFrequency:20,minAgeBandCandidate:7,examples:['paquet'],coverage:{coverageType:'uncovered'}},
  {ipa:'si',targetCount:30,totalFrequency:800,minAgeBandCandidate:5,examples:['cinéma'],coverage:{coverageType:'whole_word'}}
],entries);

assert.deepEqual(queue.map(item=>item.ipa),['kɥi','ɥi','pak']);
assert.equal(queue[0].wholeWordCandidates[0].word,'cuit');
assert.equal(queue[1].wholeWordCandidates[0].word,'huis');
assert.equal(queue[2].wholeWordCandidates[0].word,'Pâques');
assert.deepEqual(representationResearchStats(queue),{gaps:3,gapsWithWholeWordCandidates:3,gapsWithoutWholeWordCandidates:0});

console.log('Syllable representation candidates: exact lexical matches remain research-only until visual review.');
