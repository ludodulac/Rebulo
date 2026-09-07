import assert from 'node:assert/strict';
import {
  sourceSyllables,
  ageBandCandidateForEntry,
  buildTargetVocabulary,
  buildSyllableInventory,
  targetVocabularyStats
} from '../src/target-vocabulary.js';

assert.deepEqual(sourceSyllables('mɛʁ.si'),['mɛʁ','si']);
assert.deepEqual(sourceSyllables('/si.ne.ma/'),['si','ne','ma']);
assert.deepEqual(sourceSyllables(''),[]);

assert.equal(ageBandCandidateForEntry({word:'chat',lemma:'chat',ipa:'ʃa',frequency:120,syllableCount:1,pos:'NOM'}),5);
assert.equal(ageBandCandidateForEntry({word:'cinéma',lemma:'cinéma',ipa:'sinema',frequency:42.1,syllableCount:3,pos:'NOM'}),7);
assert.equal(ageBandCandidateForEntry({word:'extraordinaire',lemma:'extraordinaire',ipa:'ɛkstʁaɔʁdinɛʁ',frequency:12,syllableCount:5,pos:'ADJ'}),12);
assert.equal(ageBandCandidateForEntry({word:'le',lemma:'le',ipa:'lə',frequency:10000,syllableCount:1,pos:'ART:def'}),null);
assert.equal(ageBandCandidateForEntry({word:'rare',lemma:'rare',ipa:'ʁaʁ',frequency:0.1,syllableCount:1,pos:'ADJ'}),null);

const targets=buildTargetVocabulary([
  {word:'chats',lemma:'chat',ipa:'ʃa',frequency:150,syllableCount:1,syllabification:'ʃa',pos:'NOM'},
  {word:'chat',lemma:'chat',ipa:'ʃa',frequency:120,syllableCount:1,syllabification:'ʃa',pos:'NOM'},
  {word:'cinéma',lemma:'cinéma',ipa:'sinema',frequency:42.1,syllableCount:3,syllabification:'si.ne.ma',pos:'NOM'},
  {word:'merci',lemma:'merci',ipa:'mɛʁsi',frequency:1030,syllableCount:2,syllabification:'mɛʁ.si',pos:'ONO'},
  {word:'maison',lemma:'maison',ipa:'mɛzɔ̃',frequency:80,syllableCount:2,syllabification:'',pos:'NOM'},
  {word:'bizarre',lemma:'bizarre',ipa:'bizaʁ',frequency:4,syllableCount:2,syllabification:'bi.zaʁ.ə',pos:'ADJ'},
  {word:'la',lemma:'le',ipa:'la',frequency:9999,syllableCount:1,syllabification:'la',pos:'ART:def'}
]);

assert.equal(targets.filter(item=>item.lemma==='chat').length,1);
assert.equal(targets.find(item=>item.lemma==='chat').target,'chat','lemma form must be preferred over a more frequent inflected form');
assert.equal(targets.find(item=>item.target==='cinéma').ageBandCandidate,7);
assert.equal(targets.find(item=>item.target==='merci').ageStatus,'heuristic_preselection');
assert.equal(targets.find(item=>item.target==='maison').syllabificationStatus,'needs_source_review');
assert.equal(targets.find(item=>item.target==='bizarre').syllabificationStatus,'needs_source_review');
assert.equal(targets.some(item=>item.target==='la'),false);

const inventory=buildSyllableInventory(targets);
assert.equal(inventory.some(item=>item.ipa==='mɛzɔ̃'),false,'missing source syllabification must never be invented');
assert.equal(inventory.some(item=>item.ipa==='bi'),false,'mismatched source syllabification must be held for review');
const si=inventory.find(item=>item.ipa==='si');
assert.equal(si.targetCount,2);
assert.ok(si.examples.includes('cinéma'));
assert.ok(si.examples.includes('merci'));
assert.equal(si.minAgeBandCandidate,5);

const stats=targetVocabularyStats(targets);
assert.equal(stats.total,5);
assert.equal(stats.sourceExactSyllabification,3);
assert.equal(stats.needsSourceReview,2);
assert.ok(stats.ageBands['5']>=1);
assert.ok(stats.ageBands['7']>=1);

console.log('Target vocabulary: heuristic age preselection and source-only syllable inventory passed.');
