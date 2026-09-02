import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildPictogramExpansionPriorities,expansionPrioritySummary} from '../src/pictogram-expansion.js';

const [coverage,lexicon]=await Promise.all([
  readFile(new URL('../data/coverage-report.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/lexicon-seed.json',import.meta.url),'utf8').then(JSON.parse)
]);

const priorities=buildPictogramExpansionPriorities(coverage,lexicon,{limit:25});
assert.ok(priorities.length>0,'real coverage should expose pictogram research candidates');
assert.ok(priorities.every(item=>item.status==='research_candidate'));
assert.ok(priorities.every(item=>item.needsImageabilityReview===true));
assert.ok(priorities.every(item=>item.needsNamingReview===true));
assert.ok(priorities.every(item=>item.clinicalStatus==='not_reviewed'));
assert.ok(priorities.every(item=>Array.isArray(item.exactNounCandidates)&&item.exactNounCandidates.length>0));
assert.ok(priorities.every((item,index)=>item.priority===index+1));
assert.ok(priorities.every((item,index)=>index===0||priorities[index-1].score>=item.score));

const knownIpas=new Set(lexicon.filter(item=>item.ipa).map(item=>String(item.ipa).replaceAll('/','')));
assert.ok(priorities.every(item=>!knownIpas.has(item.normalizedIpa)),'sounds already represented in the lexicon, including blocked prototypes, must not be proposed as new concepts');
assert.ok(priorities.every(item=>String(item.suggestedLabel).length>=2));

const summary=expansionPrioritySummary(priorities);
assert.equal(summary.candidateCount,priorities.length);
assert.equal(summary.top.length,Math.min(10,priorities.length));
assert.ok(summary.totalPotentialUnlocks>0);

console.log('PICTOGRAM_EXPANSION_PRIORITIES '+JSON.stringify(summary));
