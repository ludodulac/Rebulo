import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildPhoneticExpansionOpportunities,buildPictogramExpansionPriorities,expansionPrioritySummary} from '../src/pictogram-expansion.js';

const [coverage,lexicon,shortlist]=await Promise.all([
  readFile(new URL('../data/coverage-report.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/lexicon-seed.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/pictogram-expansion-shortlist.json',import.meta.url),'utf8').then(JSON.parse)
]);

const opportunities=buildPhoneticExpansionOpportunities(coverage,lexicon,{limit:100});
assert.ok(opportunities.length>0);
assert.ok(opportunities.every(item=>item.status==='phonetic_opportunity'));
assert.ok(opportunities.every((item,index)=>index===0||opportunities[index-1].weightedGain>=item.weightedGain));

const priorities=buildPictogramExpansionPriorities(coverage,lexicon,{limit:25});
assert.ok(priorities.length>0,'real coverage should expose pictogram research candidates');
assert.ok(priorities.length<=opportunities.length);
assert.ok(priorities.every(item=>item.status==='research_candidate'));
assert.ok(priorities.every(item=>item.needsImageabilityReview===true));
assert.ok(priorities.every(item=>item.needsNamingReview===true));
assert.ok(priorities.every(item=>item.clinicalStatus==='not_reviewed'));
assert.ok(priorities.every(item=>Array.isArray(item.exactNounCandidates)&&item.exactNounCandidates.length>0));
assert.ok(priorities.every((item,index)=>item.priority===index+1));
assert.ok(priorities.every((item,index)=>index===0||priorities[index-1].score>=item.score));

const knownIpas=new Set(lexicon.filter(item=>item.ipa).map(item=>String(item.ipa).replaceAll('/','')));
assert.ok(priorities.every(item=>!knownIpas.has(item.normalizedIpa)),'sounds already represented in the lexicon, including blocked prototypes, must not be proposed as new concepts');
assert.ok(priorities.every(item=>/^[a-zà-ÿ-]+$/i.test(String(item.suggestedLabel))));

assert.equal(shortlist.status,'research_only');
assert.ok(Array.isArray(shortlist.items)&&shortlist.items.length===5);
for(const item of shortlist.items){
  assert.equal(item.status,'research_candidate');
  assert.equal(item.activation,'not_ready');
  const ipa=String(item.ipa||'').replaceAll('/','');
  assert.ok(!knownIpas.has(ipa),'shortlist must not duplicate an existing or blocked lexicon concept');
  const priority=priorities.find(candidate=>candidate.normalizedIpa===ipa);
  assert.ok(priority,`${item.label} must map to a measured coverage opportunity`);
  assert.ok(priority.exactNounCandidates.some(candidate=>String(candidate.word).toLowerCase()===String(item.label).toLowerCase()),`${item.label} must be an exact noun candidate for ${item.ipa}`);
  assert.equal(item.unlockCount,priority.unlockCount);
}

const summary=expansionPrioritySummary(priorities);
assert.equal(summary.candidateCount,priorities.length);
assert.equal(summary.top.length,Math.min(25,priorities.length));
assert.ok(summary.totalPotentialUnlocks>0);

console.log('PHONETIC_EXPANSION_OPPORTUNITIES '+JSON.stringify({count:opportunities.length,top:opportunities.slice(0,10)}));
console.log('PICTOGRAM_EXPANSION_PRIORITIES '+JSON.stringify(summary));
console.log('PICTOGRAM_RESEARCH_SHORTLIST '+JSON.stringify(shortlist.items.map(item=>({label:item.label,ipa:item.ipa,unlockCount:item.unlockCount}))));
