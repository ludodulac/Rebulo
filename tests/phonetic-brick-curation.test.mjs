import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  validatePhoneticBrickCandidateBank,
  attachCuratedBrickEvidence,
  simulateCuratedBrickWave
} from '../src/phonetic-brick-curation.js';

const bank=JSON.parse(fs.readFileSync('data/phonetic-brick-candidates.json','utf8'));
const entries=[
  {word:'haie',ipa:'ɛ'},
  {word:'hey',ipa:'ɛ'},
  {word:'oie',ipa:'wa'},
  {word:'ouah',ipa:'wa'},
  {word:'or',ipa:'ɔʁ'},
  {word:'ore',ipa:'ɔʁ'},
  {word:'tee',ipa:'ti'},
  {word:'tie',ipa:'ti'},
  {word:'anse',ipa:'ɑ̃s'},
  {word:'hanse',ipa:'ɑ̃s'},
  {word:'as',ipa:'as'},
  {word:'asse',ipa:'as'},
  {word:'heure',ipa:'œʁ'},
  {word:'heurt',ipa:'œʁ'},
  {word:'art',ipa:'aʁ'},
  {word:'are',ipa:'aʁ'},
  {word:'halle',ipa:'al'},
  {word:'rot',ipa:'ʁo'},
  {word:'scion',ipa:'sjɔ̃'},
  {word:'dit',ipa:'di'},
  {word:'ré',ipa:'ʁe'},
  {word:'con',ipa:'kɔ̃'}
];

const validation=validatePhoneticBrickCandidateBank(bank,entries);
assert.equal(validation.valid,true,validation.errors.join('\n'));
assert.equal(validation.errors.length,0);
assert.equal(bank.firstWaveSegments.length,6);
assert.ok(bank.segments.find(item=>item.ipa==='ɛ').candidates.some(item=>item.label==='haie'&&item.researchDecision==='first_wave'));
assert.ok(bank.segments.find(item=>item.ipa==='sjɔ̃').candidates.every(item=>item.researchDecision!=='first_wave'));
assert.equal(bank.segments.find(item=>item.ipa==='kɔ̃').recommendedRoute,'alternate_segmentation');

const badBank=structuredClone(bank);
badBank.segments.find(item=>item.ipa==='wa').candidates[0].label='oiesse';
const badValidation=validatePhoneticBrickCandidateBank(badBank,entries);
assert.equal(badValidation.valid,false);
assert.ok(badValidation.errors.some(message=>message.includes('oiesse')));

const evidence=attachCuratedBrickEvidence(bank,[
  {ipa:'ɛ',totalUnlocked:20,strictUnlocked:9,generalUnlocked:11,weightedGain:146.5,examplesUnlocked:['intérêt']},
  {ipa:'wa',totalUnlocked:5,strictUnlocked:5,generalUnlocked:0,weightedGain:10,examplesUnlocked:['oie']}
]);
assert.equal(evidence.find(item=>item.ipa==='ɛ').coverageEvidence.totalUnlocked,20);
assert.equal(evidence.find(item=>item.ipa==='wa').coverageEvidence.strictUnlocked,5);
assert.equal(evidence.find(item=>item.ipa==='ɔʁ').coverageEvidence,null);

const targets=bank.firstWaveSegments.map((ipa,index)=>({
  target:`cible-${index}`,
  targetIpa:`ma${ipa}`,
  frequency:10,
  ageBandCandidate:9
}));
const lexicon=[{id:'mat',label:'mât',ipa:'ma',active:true,strictEligible:true}];
const simulation=simulateCuratedBrickWave(bank,targets,lexicon);
assert.equal(simulation.selectedSegments.length,6);
assert.equal(simulation.newlyPlayable,6);
assert.equal(simulation.withResearchWave.image_composition,6);
assert.equal(simulation.baseline.unresolved,6);

console.log('Phonetic brick curation: exact evidence, explicit rejects, and cumulative first-wave simulation passed.');
