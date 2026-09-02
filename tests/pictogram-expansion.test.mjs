import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildPhoneticExpansionOpportunities,buildPictogramExpansionPriorities,expansionPrioritySummary} from '../src/pictogram-expansion.js';

const [coverage,lexicon,shortlist,assets]=await Promise.all([
  readFile(new URL('../data/coverage-report.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/lexicon-seed.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/pictogram-expansion-shortlist.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/asset-sources.json',import.meta.url),'utf8').then(JSON.parse)
]);

const opportunities=buildPhoneticExpansionOpportunities(coverage,lexicon,{limit:100});
assert.ok(opportunities.length>0);
assert.ok(opportunities.every(item=>item.status==='phonetic_opportunity'));
assert.ok(opportunities.every((item,index)=>index===0||opportunities[index-1].weightedGain>=item.weightedGain));

const priorities=buildPictogramExpansionPriorities(coverage,lexicon,{limit:25});
assert.ok(priorities.length>0,'real coverage should expose pictogram research candidates');
assert.ok(priorities.every(item=>item.status==='research_candidate'));
assert.ok(priorities.every(item=>item.needsImageabilityReview===true));
assert.ok(priorities.every(item=>item.needsNamingReview===true));
assert.ok(priorities.every(item=>item.clinicalStatus==='not_reviewed'));

const knownIpas=new Set(lexicon.filter(item=>item.ipa).map(item=>String(item.ipa).replaceAll('/','')));
assert.ok(priorities.every(item=>!knownIpas.has(item.normalizedIpa)),'registered prototypes must leave the new-concept ranking even while inactive');

assert.equal(shortlist.status,'research_only');
assert.equal(shortlist.items.length,5);
for(const item of shortlist.items){
  const ipa=String(item.ipa||'').replaceAll('/','');
  if(item.activation==='prototype_registered'){
    const prototype=lexicon.find(entry=>String(entry.ipa||'').replaceAll('/','')===ipa&&entry.label===item.label);
    assert.ok(prototype,`${item.label} must exist in the lexicon once registered`);
    assert.equal(prototype.active,false,'research prototypes must not become active automatically');
    assert.equal(prototype.clinicalStatus,'naming_test_required');
    assert.ok(!priorities.some(candidate=>candidate.normalizedIpa===ipa),'registered prototypes must not be proposed again as new concepts');
  }else{
    assert.equal(item.status,'research_candidate');
    assert.equal(item.activation,'not_ready');
    const priority=priorities.find(candidate=>candidate.normalizedIpa===ipa);
    assert.ok(priority,`${item.label} must map to a measured coverage opportunity`);
    assert.ok(priority.exactNounCandidates.some(candidate=>String(candidate.word).toLowerCase()===String(item.label).toLowerCase()));
    assert.equal(item.unlockCount,priority.unlockCount);
  }
}

const pot=lexicon.find(item=>item.id==='pot');
const dos=lexicon.find(item=>item.id==='dos');
assert.equal(pot.prototypeStatus,'asset_available');
assert.equal(dos.prototypeStatus,'asset_pending');
assert.ok(assets.assets.some(asset=>asset.concept==='pot'&&asset.active===false&&asset.clinicalStatus==='naming_test_required'));
assert.ok(!assets.assets.some(asset=>asset.concept==='dos'),'dos must not claim an asset before a specific prototype exists');

const summary=expansionPrioritySummary(priorities);
assert.equal(summary.candidateCount,priorities.length);
assert.ok(summary.totalPotentialUnlocks>0);

console.log('PICTOGRAM_PROTOTYPES '+JSON.stringify({pot:{status:pot.prototypeStatus,active:pot.active},dos:{status:dos.prototypeStatus,active:dos.active}}));
