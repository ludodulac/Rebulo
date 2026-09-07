import assert from 'node:assert/strict';
import {
  buildPhoneticSegmentInventory,
  classifySegmentInventory,
  analyzeTargetConstructibility,
  buildSegmentResearchQueue,
  rankBrickOpportunities,
  rankVisualResearchLeads
} from '../src/phonetic-brick-map.js';

const targets=[
  {target:'cinéma',targetIpa:'sinema',frequency:42,ageBandCandidate:7},
  {target:'K-huis',targetIpa:'kaɥi',frequency:8,ageBandCandidate:9},
  {target:'bakou',targetIpa:'baku',frequency:12,ageBandCandidate:7},
  {target:'kouba',targetIpa:'kuba',frequency:6,ageBandCandidate:9}
];

const lexicon=[
  {id:'scie',label:'scie',ipa:'/si/',active:true,strictEligible:true},
  {id:'nez',label:'nez',ipa:'/ne/',active:true,strictEligible:true},
  {id:'mat',label:'mât',ipa:'/ma/',active:true,strictEligible:true},
  {id:'huis',label:'huis',ipa:'/ɥi/',active:true,strictEligible:true},
  {id:'bas',label:'bas',ipa:'/ba/',active:true,strictEligible:true}
];

const inventory=buildPhoneticSegmentInventory(targets,{minUnits:1,maxUnits:3});
assert.ok(inventory.some(row=>row.ipa==='in'),'inventory must include reusable contiguous IPA sequences, not only linguistic syllables');
assert.ok(inventory.some(row=>row.ipa==='ku'));
const ku=inventory.find(row=>row.ipa==='ku');
assert.equal(ku.targetCount,2);

const classified=classifySegmentInventory(inventory,lexicon);
assert.equal(classified.find(row=>row.ipa==='ku').coverage.coverageType,'uncovered');

const coverage=analyzeTargetConstructibility(targets,lexicon);
assert.equal(coverage.counts.image_composition,1,'cinéma must be constructible with scie + nez + mât');
assert.equal(coverage.counts.image_plus_letter,1,'K + huis must remain an explicit enriched-mode construction');
assert.equal(coverage.counts.unresolved,2);

const lexicalEntries=[
  {word:'cou',lemma:'cou',ipa:'ku',frequency:42,pos:'NOM',syllableCount:1},
  {word:'coup',lemma:'coup',ipa:'ku',frequency:80,pos:'NOM',syllableCount:1},
  {word:'cul',lemma:'cul',ipa:'ky',frequency:55,pos:'NOM',syllableCount:1},
  {word:'coût',lemma:'coût',ipa:'ku',frequency:25,pos:'NOM',syllableCount:1}
];
const queue=buildSegmentResearchQueue(classified,lexicalEntries,{candidateLimit:8,maxSegments:200});
const kuResearch=queue.find(row=>row.ipa==='ku');
assert.ok(kuResearch);
assert.ok(kuResearch.wholeWordCandidates.some(candidate=>candidate.word==='cou'));
assert.ok(kuResearch.wholeWordCandidates.some(candidate=>candidate.word==='coup'));
assert.equal(kuResearch.wholeWordCandidates.some(candidate=>candidate.word==='cul'),false,'orthographic intuition must never override actual /ky/ pronunciation');
assert.ok(kuResearch.wholeWordCandidates.every(candidate=>candidate.phoneticStatus==='whole_pronunciation_exact'));
assert.ok(kuResearch.wholeWordCandidates.every(candidate=>candidate.activationState==='research_only'));

const opportunities=rankBrickOpportunities([kuResearch],targets,lexicon,{limit:10});
assert.equal(opportunities[0].ipa,'ku');
assert.equal(opportunities[0].strictUnlocked,2,'adding one exact /ku/ image brick should unlock both ba+ku and ku+ba');
assert.equal(opportunities[0].totalUnlocked,2);

const leads=rankVisualResearchLeads([
  {...opportunities[0]},
  {ipa:'k',unitCount:1,targetCount:50,totalFrequency:1000,minAgeBandCandidate:5,wholeWordCandidates:[],strictUnlocked:10,generalUnlocked:10,totalUnlocked:20,weightedGain:500,examplesUnlocked:['cas']}
]);
const kuLead=leads.find(row=>row.ipa==='ku');
const kLead=leads.find(row=>row.ipa==='k');
assert.equal(kuLead.researchRoute,'review_exact_lexical_candidates');
assert.ok(kuLead.plausibleLexicalCandidates.some(candidate=>candidate.word==='cou'));
assert.ok(kuLead.nounCandidateCount>=2);
assert.equal(kuLead.visualAssessment,'human_review_required');
assert.equal(kLead.researchRoute,'prefer_explicit_letter_or_other_visible_operation');
assert.ok(kuLead.researchPriorityScore>kLead.researchPriorityScore,'a reusable multi-unit segment with exact noun candidates should outrank a bare consonant fallback in this scenario');

console.log('Phonetic brick map: segment inventory, inverse exact candidates, enriched fallback, gain, and research routing passed.');
