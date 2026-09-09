import assert from 'node:assert/strict';
import {buildSessionSharePayload,serializeSessionShare,deserializeSessionShare,createSessionShareUrl,readSessionShareFromUrl,resolveSharedSession} from '../src/session-share.js';
import {resolveSessionEntries,summarizeSessionResolution} from '../src/session-resolution.js';

const items=[
  {answer:'cinéma',activity:{id:'oral-to-written',label:'Du son vers l’écrit'}},
  {answer:'merci',activity:{id:'syllable-blending',label:'Fusion syllabique'}}
];
const payload=buildSessionSharePayload(items,{hint:true,solution:false});
assert.deepEqual(payload,{v:2,rounds:[
  {target:'cinema',activity:'oral-to-written',targetLabel:'cinéma',activityLabel:'Du son vers l’écrit'},
  {target:'merci',activity:'syllable-blending',targetLabel:'merci',activityLabel:'Fusion syllabique'}
],help:{hint:true,solution:false}});
const encoded=serializeSessionShare(payload);assert.ok(encoded&&!encoded.includes('='));assert.deepEqual(deserializeSessionShare(encoded),payload);
assert.equal(deserializeSessionShare('not-valid'),null);
assert.equal(deserializeSessionShare(serializeSessionShare({...payload,v:99})),null);
assert.equal(buildSessionSharePayload([],{}),null);
const url=createSessionShareUrl(items,{hint:false,solution:true},{href:'https://rebulo.example/app?foo=bar'});assert.match(url,/foo=bar/);assert.deepEqual(readSessionShareFromUrl({href:url}).help,{hint:false,solution:true});
assert.equal(url.includes('patient'),false);assert.equal(url.includes('date'),false);

const corpus=[{target:'cinéma',mode:'strict',assets:'ready'},{target:'merci',mode:'strict',assets:'ready'}];
const candidateFor=target=>({answer:target.target,pieces:[{image:'x.svg'}],therapyActivities:target.target==='cinéma'?[{id:'oral-to-written',label:'Du son vers l’écrit'}]:[
  {id:'syllable-blending',label:'Fusion syllabique'},
  {id:'syllable-identification',label:'Identification syllabique — première syllabe',promptPosition:'initial',expectedResponse:'mɛʁ'},
  {id:'syllable-identification-final',label:'Identification syllabique — dernière syllabe',promptPosition:'final',expectedResponse:'si'}
]});
const resolved=resolveSharedSession(payload,{corpus,buildCandidate:candidateFor});
assert.equal(resolved.items.length,2);assert.equal(resolved.unavailable.length,0);assert.equal(resolved.allUsable,true);
assert.equal(resolved.items[0].answer,'cinéma');assert.equal(resolved.items[0].activity.id,'oral-to-written');assert.deepEqual(resolved.help,{hint:true,solution:false});

const finalVariantPayload=buildSessionSharePayload([{answer:'merci',activity:{id:'syllable-identification-final',label:'Identification syllabique — dernière syllabe'}}],{});
assert.equal(finalVariantPayload.rounds[0].activity,'syllable-identification-final','final position must have a stable shareable activity reference');
const finalVariantResolved=resolveSharedSession(finalVariantPayload,{corpus,buildCandidate:candidateFor});
assert.equal(finalVariantResolved.items.length,1);
assert.equal(finalVariantResolved.items[0].activity.id,'syllable-identification-final');
assert.equal(finalVariantResolved.items[0].activity.promptPosition,'final');
assert.equal(finalVariantResolved.items[0].activity.expectedResponse,'si');

const missingTargetPayload=buildSessionSharePayload([{answer:'inconnu',activity:{id:'oral-to-written',label:'Du son vers l’écrit'}}],{});
const missingTarget=resolveSharedSession(missingTargetPayload,{corpus,buildCandidate:candidateFor});
assert.equal(missingTarget.items.length,0);assert.equal(missingTarget.unavailable.length,1);assert.equal(missingTarget.unavailable[0].reason,'target_unavailable');
assert.equal(missingTarget.unavailable[0].descriptor.targetLabel,'inconnu','saved target label must survive catalog drift');

const missingActivityPayload=buildSessionSharePayload([{answer:'cinéma',activity:{id:'unknown',label:'Activité retirée'}}],{});
const missingActivity=resolveSharedSession(missingActivityPayload,{corpus,buildCandidate:candidateFor});
assert.equal(missingActivity.items.length,0);assert.equal(missingActivity.unavailable.length,1);assert.equal(missingActivity.unavailable[0].reason,'activity_unavailable');
assert.equal(missingActivity.unavailable[0].descriptor.activityLabel,'Activité retirée','saved activity label must remain intelligible');

const currentQueue=resolveSessionEntries([{answer:'cinéma',activityLabel:'Du son vers l’écrit'},{answer:'merci',activityLabel:'Activité disparue'}],{corpus,buildCandidate:candidateFor});
const currentSummary=summarizeSessionResolution(currentQueue);
assert.equal(currentSummary.entries.length,2,'unavailable queue rows must not be filtered out');
assert.equal(currentSummary.items.length,1);assert.equal(currentSummary.unavailable.length,1);assert.equal(currentSummary.unavailable[0].reason,'activity_unavailable');

const legacy={v:1,rounds:[{target:'cinema',activity:'oral-to-written'}],help:{hint:true,solution:false}};
const legacyEncoded=serializeSessionShare(legacy);assert.ok(legacyEncoded);const legacyResolved=resolveSharedSession(deserializeSessionShare(legacyEncoded),{corpus,buildCandidate:candidateFor});assert.equal(legacyResolved.items.length,1,'v1 links must remain readable');

assert.equal(resolveSharedSession({...payload,rounds:[...payload.rounds,payload.rounds[0],payload.rounds[0],payload.rounds[0],payload.rounds[0]]},{corpus,buildCandidate:candidateFor}),null);
console.log('session share tests: saved descriptors and final syllable variants survive sharing and catalog drift');
