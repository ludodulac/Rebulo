import assert from 'node:assert/strict';
import {buildPhoneticSegmentInventory,classifySegmentInventory,analyzeTargetConstructibility,buildSegmentResearchQueue,rankBrickOpportunities,rankVisualResearchLeads,buildAlternativeSegmentStrategies} from '../src/phonetic-brick-map.js';
import {buildHardRouteOpportunitySearch} from '../src/hard-route-opportunity-search.js';
import {buildSyllableWindowInventory,buildPhraseSyllableWindows,buildOverlappingPhonemeWindows,phonemeEditDistance} from '../src/rebus-sound-catalog.js';
const targets=[{target:'cinéma',targetIpa:'sinema',frequency:42,ageBandCandidate:7,rebuloUtilityTier:'child_common'},{target:'K-huis',targetIpa:'kaɥi',frequency:8,ageBandCandidate:9,rebuloUtilityTier:'school_common'},{target:'bakou',targetIpa:'baku',frequency:12,ageBandCandidate:7,rebuloUtilityTier:'school_common'},{target:'kouba',targetIpa:'kuba',frequency:6,ageBandCandidate:9,rebuloUtilityTier:'teen_adult_common'}];
const lexicon=[{id:'scie',label:'scie',ipa:'/si/',active:true,strictEligible:true},{id:'nez',label:'nez',ipa:'/ne/',active:true,strictEligible:true},{id:'mat',label:'mât',ipa:'/ma/',active:true,strictEligible:true},{id:'huis',label:'huis',ipa:'/ɥi/',active:true,strictEligible:true},{id:'bas',label:'bas',ipa:'/ba/',active:true,strictEligible:true}];
const inventory=buildPhoneticSegmentInventory(targets,{minUnits:1,maxUnits:3});assert.ok(inventory.some(r=>r.ipa==='in'));assert.ok(inventory.some(r=>r.ipa==='ku'));assert.equal(inventory.find(r=>r.ipa==='ku').targetCount,2);
const classified=classifySegmentInventory(inventory,lexicon);assert.equal(classified.find(r=>r.ipa==='ku').coverage.coverageType,'uncovered');const coverage=analyzeTargetConstructibility(targets,lexicon);assert.equal(coverage.counts.image_composition,1);assert.equal(coverage.counts.image_plus_letter,1);assert.equal(coverage.counts.unresolved,2);
const lexicalEntries=[{word:'cou',lemma:'cou',ipa:'ku',frequency:42,pos:'NOM',syllableCount:1},{word:'coup',lemma:'coup',ipa:'ku',frequency:80,pos:'NOM',syllableCount:1},{word:'cul',lemma:'cul',ipa:'ky',frequency:55,pos:'NOM',syllableCount:1},{word:'coût',lemma:'coût',ipa:'ku',frequency:25,pos:'NOM',syllableCount:1}];const queue=buildSegmentResearchQueue(classified,lexicalEntries,{candidateLimit:8,maxSegments:200}),kuResearch=queue.find(r=>r.ipa==='ku');assert.ok(kuResearch.wholeWordCandidates.some(c=>c.word==='cou'));assert.ok(kuResearch.wholeWordCandidates.some(c=>c.word==='coup'));assert.equal(kuResearch.wholeWordCandidates.some(c=>c.word==='cul'),false);assert.ok(kuResearch.wholeWordCandidates.every(c=>c.phoneticStatus==='whole_pronunciation_exact'));
const opportunities=rankBrickOpportunities([kuResearch],targets,lexicon,{limit:10});assert.equal(opportunities[0].strictUnlocked,2);assert.equal(opportunities[0].usefulUnlocked,2);assert.equal(opportunities[0].usefulUnlockedTargets.length,2);assert.ok(opportunities[0].usefulWeightedGain>0);
const sharedTarget={key:'mot|moti',word:'mot',targetIpa:'moti'};const leads=rankVisualResearchLeads([{...opportunities[0]},{ipa:'k',unitCount:1,targetCount:50,totalFrequency:1000,minAgeBandCandidate:5,wholeWordCandidates:[],strictUnlocked:10,generalUnlocked:10,totalUnlocked:20,weightedGain:500,usefulUnlocked:0,usefulWeightedGain:0,usefulUnlockedTargets:[],examplesUnlocked:['cas']},{ipa:'tʁ',unitCount:2,wholeWordCandidates:[],strictUnlocked:3,generalUnlocked:0,totalUnlocked:3,weightedGain:20,usefulUnlocked:1,usefulWeightedGain:20,usefulUnlockedTargets:[sharedTarget]},{ipa:'ɔʁ',unitCount:2,wholeWordCandidates:[{word:'or',pos:'NOM',frequency:30}],strictUnlocked:2,generalUnlocked:0,totalUnlocked:2,weightedGain:15,usefulUnlocked:1,usefulWeightedGain:15,usefulUnlockedTargets:[sharedTarget]}]);const kuLead=leads.find(r=>r.ipa==='ku'),kLead=leads.find(r=>r.ipa==='k');assert.equal(kuLead.researchRoute,'review_exact_lexical_candidates');assert.ok(kuLead.plausibleLexicalCandidates.some(c=>c.word==='cou'));assert.equal(kuLead.priorityObjective,'rebulo_useful_coverage_first_global_coverage_secondary');assert.equal(kLead.researchRoute,'prefer_explicit_letter_or_other_visible_operation');assert.ok(kuLead.researchPriorityScore>kLead.researchPriorityScore);
const strategies=buildAlternativeSegmentStrategies(leads);const tr=strategies.find(row=>row.ipa==='tʁ');assert.equal(tr.strategyState,'alternate_one_brick_routes_found');assert.equal(tr.alternativeSegments[0].ipa,'ɔʁ');assert.equal(tr.alternativeSegments[0].naturalCandidate,'or');assert.deepEqual(tr.alternativeSegments[0].sharedExamples,['mot']);

const hardSearchTargets=[{target:'abc',targetIpa:'abc',frequency:10,ageBandCandidate:7,rebuloUtilityTier:'child_common'},{target:'hors-sujet',targetIpa:'zo',frequency:20,ageBandCandidate:7,rebuloUtilityTier:'child_common'}];
const hardSearchInventory=[{id:'a',label:'A-test',ipa:'a',active:true,strictEligible:true},{id:'c',label:'C-test',ipa:'c',active:true,strictEligible:true}];
const hardSearchRows=[
  {ipa:'b',unitCount:1,wholeWordCandidates:[]},
  {ipa:'x',unitCount:1,wholeWordCandidates:[]},
  {ipa:'y',unitCount:1,wholeWordCandidates:[{word:'y-test',pos:'NOM',frequency:1}]}
];
const hardLexicalEntries=[{word:'bc-test',lemma:'bc-test',ipa:'bc',frequency:3,pos:'NOM',syllableCount:1}];
const targetedHardSearch=buildHardRouteOpportunitySearch(hardSearchRows,hardSearchTargets,hardSearchInventory,{segments:[{ipa:'b'}]},{maxRows:20,maxOperations:4,entries:hardLexicalEntries});
assert.equal(targetedHardSearch.registeredSegmentCount,1);
assert.equal(targetedHardSearch.sourceOpportunityCount,1);
assert.equal(targetedHardSearch.hardTargetCount,1,'hard-route search must be restricted to targets actually unlocked by registered hard segments');
assert.equal(targetedHardSearch.researchPoolMode,'hard_target_segment_inventory');
assert.ok(targetedHardSearch.opportunities.some(row=>row.ipa==='bc'),'targeted hard-word inventory must discover locally relevant segments absent from the global research rows');
assert.ok(targetedHardSearch.opportunities.find(row=>row.ipa==='bc').wholeWordCandidates.some(candidate=>candidate.word==='bc-test'));
assert.equal(targetedHardSearch.sourceOpportunities[0].usefulUnlockedTargets[0].word,'abc');
const fallbackHardSearch=buildHardRouteOpportunitySearch(hardSearchRows,hardSearchTargets,hardSearchInventory,{segments:[{ipa:'b'}]},{maxRows:3,maxOperations:4});
assert.equal(fallbackHardSearch.researchPoolMode,'provided_research_rows');
assert.equal(fallbackHardSearch.searchedResearchRowCount,3);
assert.equal(fallbackHardSearch.opportunities.length,3,'compatibility fallback may still inspect provided rows');
assert.ok(fallbackHardSearch.opportunities.some(row=>row.ipa==='y'));
assert.throws(()=>buildHardRouteOpportunitySearch(hardSearchRows,hardSearchTargets,hardSearchInventory,{segments:[{ipa:'missing'}]},{maxRows:3}),/missing registered source segments/);

const sourceWindows=buildSyllableWindowInventory([{word:'merci',ipa:'mɛʁsi',syllabification:'mɛʁ.si'}]);
assert.ok(sourceWindows.some(row=>row.ipa==='mɛʁsi'&&row.syllableSpans.includes(2)),'exact two-syllable windows must be retained');
const phraseWindows=buildPhraseSyllableWindows([{word:'cuit',syllables:['kɥi']},{word:'hier',syllables:['jɛʁ']}]);
assert.ok(phraseWindows.some(row=>row.ipa==='kɥijɛʁ'&&row.crossesWordBoundary),'two-syllable windows must cross word boundaries for magazine-style routes such as cuillère');
const shiftedWindows=buildOverlappingPhonemeWindows('ɛlnəsɔ̃pakɥitlepat',{minUnits:2,maxUnits:4});
assert.ok(new Set(shiftedWindows.map(row=>row.startUnit)).size>4,'sound exploration must also slide across syllable and word boundaries');
assert.equal(phonemeEditDistance('lɛ','le').distance,1,'approximate magazine-style substitutions must remain explicitly measurable');

console.log('Phonetic brick map: useful coverage, exact candidates, automatic alternatives, hard-target-local route search and overlapping sound windows passed.');
