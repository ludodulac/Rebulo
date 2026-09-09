import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildRelationalTherapyCatalog} from '../src/relational-therapy-catalog.js';
import {attachCreatorRelationalActivities} from '../src/relational-creator-exposure.js';
import {buildCreatorCandidate} from '../src/creator-runtime.js';
import {normalizeWorksheetSet} from '../src/pdf-export.js';
import {buildSessionSharePayload,serializeSessionShare,deserializeSessionShare,resolveSharedSession} from '../src/session-share.js';
import {sessionAnswerMatches,sessionExpectedAnswer,safeSessionHint} from '../src/session-runner.js';

const corpus=JSON.parse(fs.readFileSync('data/corpus-pilot.json','utf8')).items;
const lexicon=JSON.parse(fs.readFileSync('data/lexicon-seed.json','utf8'));
const therapy=JSON.parse(fs.readFileSync('data/therapy-targets.json','utf8')).targets;
const rhymeBank=JSON.parse(fs.readFileSync('data/rhyme-relations.json','utf8'));
const relationalCatalog=buildRelationalTherapyCatalog({rhymeRelations:rhymeBank.relations});

const strictReady=corpus.filter(item=>item.mode==='strict'&&item.assets==='ready');
const enriched=strictReady.map(item=>attachCreatorRelationalActivities(item,relationalCatalog));
const exposed=enriched.filter(item=>item.relationalActivities?.length);
assert.deepEqual(exposed.map(item=>item.target).sort(),['parapluie','parasol'],'the first pilot must stay limited to creator targets with an explicitly declared usable source piece');
for(const target of exposed){
  assert.ok(target.relationalActivities.every(activity=>activity.activityId==='rhyme-matching'),'no other relational activity type is exposed in this pilot');
  assert.ok(target.relationalActivities.every(activity=>activity.technicalValidation==='phonological_contract'));
  assert.ok(target.relationalActivities.every(activity=>activity.pedagogicalValidation==='not_evaluated'),'technical validity must not be presented as pedagogical validation');
}

const parapluie=enriched.find(item=>item.target==='parapluie');
const candidate=buildCreatorCandidate(parapluie,lexicon,therapy);
const activity=candidate.therapyActivities.find(item=>item.activityId==='rhyme-matching');
assert.ok(activity,'creator must discover the controlled rhyme matching activity');
assert.equal(activity.focusWord,'pas');
assert.equal(activity.label,'Trouver une rime avec « pas »');
assert.equal(activity.description.includes('mot-image déclaré'),true,'the professional must be able to understand why the activity was proposed');
assert.equal(activity.childInstruction,'Quel mot rime avec « pas » : tas ou pie ?');
assert.equal(activity.sessionExpectedResponse,'tas');

const [queued]=normalizeWorksheetSet([{...candidate,activity}]);
assert.equal(queued.activity.id,activity.id,'adding to a session must retain the exact relational activity identity');
const payload=buildSessionSharePayload([queued],{hint:true,solution:true});
assert.equal(payload.v,2);assert.equal(payload.rounds[0].activity,'rhyme-matchingpas');assert.equal(payload.rounds[0].activityLabel,activity.label);
const reopenedPayload=deserializeSessionShare(serializeSessionShare(payload));
const currentCorpus=enriched;
const reopened=resolveSharedSession(reopenedPayload,{corpus:currentCorpus,buildCandidate:target=>buildCreatorCandidate(target,lexicon,therapy)});
assert.equal(reopened.allUsable,true);assert.equal(reopened.items.length,1);
const round=reopened.items[0];
assert.equal(round.activity.id,activity.id,'reopened session must resolve the same controlled activity');
assert.equal(sessionExpectedAnswer(round),'tas');
assert.equal(sessionAnswerMatches('tas',round),true,'session must validate the relational expected word, not the rebus answer');
assert.equal(sessionAnswerMatches('parapluie',round),false);
assert.equal(safeSessionHint(round),'Choisis parmi : tas ou pie.');

const catalogWithoutPilot=currentCorpus.map(item=>item.target==='parapluie'?{...item,relationalActivities:[]}:item);
const unavailable=resolveSharedSession(reopenedPayload,{corpus:catalogWithoutPilot,buildCandidate:target=>buildCreatorCandidate(target,lexicon,therapy)});
assert.equal(unavailable.items.length,0);assert.equal(unavailable.unavailable.length,1);
assert.equal(unavailable.unavailable[0].reason,'activity_unavailable');
assert.equal(unavailable.unavailable[0].descriptor.targetLabel,'parapluie');
assert.equal(unavailable.unavailable[0].descriptor.activityLabel,'Trouver une rime avec « pas »','reopened session must remain intelligible when relational data disappears');

const pieMatching=relationalCatalog.rhymeMatching.find(item=>item.targetWord==='pie');
assert.equal(pieMatching,undefined,'pie has no controlled matching set yet: absence of enough explicit choices is an acceptable product result');
assert.equal(rhymeBank.clinicalValidation,'not_claimed');

console.log('relational creator/session flow: creator discovery, queue, save, reopen, use and later unavailability are controlled');
