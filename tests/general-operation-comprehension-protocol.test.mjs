import assert from 'node:assert/strict';
import fs from 'node:fs';
import {comprehensionItems,createComprehensionSession,recordComprehensionObservation,comprehensionSessionExport,orderedComprehensionItems} from '../src/general-operation-comprehension-session.js';

const protocol=JSON.parse(fs.readFileSync(new URL('../data/general-operation-comprehension-tests.json',import.meta.url),'utf8'));
const readiness=JSON.parse(fs.readFileSync(new URL('../data/general-operation-readiness.json',import.meta.url),'utf8'));
const html=fs.readFileSync(new URL('../general-operation-comprehension-test.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../general-operation-comprehension-test.js',import.meta.url),'utf8');

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
assert.equal(testedItems.length,10);

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

const flat=comprehensionItems(protocol);assert.equal(flat.length,10);assert.equal(new Set(flat.map(item=>item.id)).size,10);
assert.deepEqual(orderedComprehensionItems(flat,'forward').map(item=>item.id),flat.map(item=>item.id));
assert.deepEqual(orderedComprehensionItems(flat,'reverse').map(item=>item.id),[...flat].reverse().map(item=>item.id));
const session=createComprehensionSession(protocol,{sessionCode:' OP 01! ',orderMode:'forward'});
assert.ok(session);assert.equal(session.sessionCode,'OP01');assert.equal(session.itemIds.length,10);assert.deepEqual(session.observations,[]);
let observed=recordComprehensionObservation(session,flat[0],{interpretationVerbatim:'ça ajoute le son d',hesitation:false,noResponse:false,misreading:false});assert.ok(observed);
observed=recordComprehensionObservation(observed,flat[1],{interpretationVerbatim:'',hesitation:true,noResponse:true,misreading:true});assert.ok(observed);assert.equal(observed.observations[1].interpretationVerbatim,'');
assert.equal(recordComprehensionObservation(observed,flat[0],{interpretationVerbatim:'duplicate'}),null,'one session must not record the same item twice');
const exported=comprehensionSessionExport(observed);assert.ok(exported);assert.equal(exported.kind,'general_operation_comprehension_observations');assert.equal(exported.sessionCode,'OP01');assert.equal(exported.observations.length,2);assert.match(exported.researchNotice,/No automatic promotion, authorization, or clinical validation/);assert.equal('participantName' in exported,false);

assert.match(html,/Passation locale et anonyme/);assert.match(html,/Qu’est-ce que tu comprends que ce symbole ajoute au rébus/);assert.match(html,/Ne saisis aucun nom, âge, diagnostic/);assert.match(html,/ne promeut aucune opération/i);
assert.match(js,/general-operation-comprehension-tests\.json/);assert.match(js,/sessionCode:anonymousSessionCode\(\),orderMode:'random'/);assert.match(js,/comprehensionSessionExport/);assert.match(js,/source\.textContent=`\$\{item\.sourceExample\.word\}  \$\{item\.sourceExample\.ipa\}`/,'contextual cue should expose declared source evidence');
assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\([^)]*method\s*:\s*['"]POST/i,'runner must stay local and explicit-export only');
assert.doesNotMatch(js,/comprehension_tested|authorized_general|clinical_approved/,'runner must not contain promotion paths');

console.log(`general operation comprehension protocol: ${testedItems.length} operations are technically passable; no results or promotions are fabricated.`);
