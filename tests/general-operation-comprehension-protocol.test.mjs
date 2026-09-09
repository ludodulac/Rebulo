import assert from 'node:assert/strict';
import fs from 'node:fs';

const protocol=JSON.parse(fs.readFileSync(new URL('../data/general-operation-comprehension-tests.json',import.meta.url),'utf8'));
const readiness=JSON.parse(fs.readFileSync(new URL('../data/general-operation-readiness.json',import.meta.url),'utf8'));

assert.equal(protocol.schemaVersion,'1.0');
assert.equal(protocol.status,'planned_human_comprehension_tests');
assert.equal(protocol.activationState,'inactive_until_human_review');
assert.deepEqual(protocol.results,[],'repository must not fabricate comprehension observations');
assert.equal(protocol.protocol.capture.firstSpontaneousResponse,true);
assert.equal(protocol.protocol.capture.interpretationVerbatim,true);
assert.equal(protocol.protocol.capture.anonymousOnly,true);
assert.equal(protocol.protocol.decisionGate.requiresHumanReview,true);
assert.equal(protocol.protocol.decisionGate.automaticPromotion,false);
assert.equal(protocol.protocol.decisionGate.clinicalValidation,false);
assert.ok(protocol.protocol.decisionGate.minimumDistinctParticipants>=3);

const readyEntries=readiness.entries.filter(entry=>entry.readiness==='visual_cue_defined');
const testedItems=protocol.sets.flatMap(set=>set.items.map(item=>({...item,operationType:set.operationType,status:set.status})));
assert.equal(testedItems.length,readyEntries.length,'every visual-cue-defined operation should have one planned comprehension item');

for(const entry of readyEntries){
  const item=testedItems.find(candidate=>candidate.operationType===entry.operationType&&candidate.grapheme===entry.grapheme&&candidate.ipa===entry.ipa);
  assert.ok(item,`${entry.id} needs a comprehension-test item`);
  assert.equal(item.status,'ready_for_human_comprehension_test');
  if(entry.operationType==='grapheme_sound')assert.equal(item.cue,'grapheme_with_sound_cue');
  if(entry.operationType==='contextual_grapheme'){
    assert.equal(item.cue,'grapheme_with_source_evidence');
    assert.ok(item.sourceExample?.word);
    assert.ok(item.sourceExample?.ipa);
    assert.ok(['prefix','suffix'].includes(item.sourceExample?.context));
  }
}

for(const entry of readiness.entries.filter(entry=>entry.readiness==='research_only')){
  assert.equal(testedItems.some(item=>item.grapheme===entry.grapheme),false,`${entry.grapheme} must not enter comprehension testing before semantics and visual cue exist`);
}

assert.equal(readiness.entries.some(entry=>entry.readiness==='comprehension_tested'),false,'planning tests must not promote readiness');

console.log(`general operation comprehension protocol: ${testedItems.length} visual-cue-defined operations are planned; no results or promotions are fabricated.`);
