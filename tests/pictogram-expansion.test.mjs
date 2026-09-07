import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildPhoneticExpansionOpportunities,buildPictogramExpansionPriorities,expansionPrioritySummary} from '../src/pictogram-expansion.js';

const [coverage,lexicon,shortlist,assets,productivity]=await Promise.all([
  readFile(new URL('../data/coverage-report.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/lexicon-seed.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/pictogram-expansion-shortlist.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/asset-sources.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/phonetic-productivity-report.json',import.meta.url),'utf8').then(JSON.parse)
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
assert.ok(priorities.every(item=>!knownIpas.has(item.normalizedIpa)),'registered or active concepts must leave the new-concept ranking');

assert.equal(shortlist.status,'mixed_research_and_general');
assert.equal(shortlist.items.length,6);
for(const item of shortlist.items){
  const ipa=String(item.ipa||'').replaceAll('/','');
  if(item.activation==='general_active'){
    const entry=lexicon.find(candidate=>String(candidate.ipa||'').replaceAll('/','')===ipa&&candidate.label===item.label);
    assert.ok(entry,`${item.label} must exist in the lexicon once explicitly approved`);
    assert.equal(entry.active,true,`${item.label} must be active for general generation`);
    assert.equal(entry.clinicalStatus,item.clinicalStatus);
    const asset=assets.assets.find(candidate=>candidate.path===entry.image);
    assert.ok(asset,`${item.label} must have a documented production asset`);
    assert.equal(asset.active,true);
    assert.equal(asset.clinicalStatus,item.clinicalStatus);
    assert.ok(!priorities.some(candidate=>candidate.normalizedIpa===ipa));
  }else{
    assert.equal(item.status,'research_candidate');
    assert.equal(item.activation,'not_ready');
    const lead=(productivity.expansionCurationLeads||[]).find(candidate=>String(candidate.ipa||'').replaceAll('/','')===ipa);
    assert.ok(lead,`${item.label} must map to a fresh curation lead`);
    assert.ok(lead.lexicalCandidates.some(candidate=>String(candidate.word).toLowerCase()===String(item.label).toLowerCase()));
    assert.equal(item.unlockCount,lead.targetCount);
    assert.equal(item.assetStatus,'not_created');
  }
}

const nid=shortlist.items.find(item=>item.label==='nid');
assert.ok(nid);
assert.equal(nid.ipa,'/ni/');
assert.equal(nid.unlockCount,103);
assert.equal(nid.nextGate,'visual_prototype_then_naming_review');

for(const id of ['pot','dos','raie','terre','tas']){
  const entry=lexicon.find(item=>item.id===id);
  assert.equal(entry.prototypeStatus,'general_owner_approved');
  assert.equal(entry.active,true);
  assert.ok(['unreviewed','naming_test_required'].includes(entry.clinicalStatus));
}
assert.equal(lexicon.find(item=>item.id==='tas').artRevision,'tas-comic-v1');
const historicalPot=assets.assets.find(asset=>asset.path==='assets/research/pot-openmoji-1fab4.svg');
assert.ok(historicalPot);
assert.equal(historicalPot.active,false);
assert.equal(historicalPot.lifecycleStatus,'historical');
assert.equal(historicalPot.artRevision,'pot-openmoji-1fab4-v1');

const summary=expansionPrioritySummary(priorities);
assert.equal(summary.candidateCount,priorities.length);
assert.ok(summary.totalPotentialUnlocks>0);

console.log('PICTOGRAM_GENERAL_ACTIVATION '+JSON.stringify(Object.fromEntries(['pot','dos','raie','terre','tas'].map(id=>[id,lexicon.find(item=>item.id===id).active]))));
