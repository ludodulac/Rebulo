import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCreatorTargets} from '../src/creator-catalog.js';
import {buildCreatorCandidate} from '../src/creator-runtime.js';
import {selectTherapyActivity} from '../src/therapy-activities.js';
import {normalizeWorksheetSet,worksheetActivity} from '../src/pdf-export.js';

const lexicon=JSON.parse(fs.readFileSync('data/lexicon-seed.json','utf8'));
const definitions=JSON.parse(fs.readFileSync('data/therapy-targets.json','utf8')).targets;

const [generated]=buildCreatorTargets({constructible:[{
  word:'merci',ipa:'mɛʁsi',frequency:100,syllableCount:2,syllabification:'mɛʁ.si',decomposition:['mer','scie']
}]});
const candidate=buildCreatorCandidate(generated,lexicon,definitions);
const activity=selectTherapyActivity(candidate.therapyActivities,'syllable-identification');
assert.ok(activity,'source-exact multisyllabic targets must expose syllable identification');
assert.equal(activity.promptPosition,'initial');
assert.equal(activity.expectedResponse,'mɛʁ');
assert.match(activity.childInstruction,/première syllabe/);
assert.match(activity.proInstruction,/syllabe initiale/);
assert.match(activity.proInstruction,/\/mɛʁ\//);
assert.doesNotMatch(activity.proInstruction,/pièces du rébus comme découpage.*réponse attendue.*pièces/i);

const [worksheet]=normalizeWorksheetSet([{...candidate,activity}]);
const pro=worksheetActivity(worksheet.activity,'pro');
assert.equal(pro.label,'Identification syllabique');
assert.match(pro.instruction,/\/mɛʁ\//,'session/PDF metadata must retain the exact expected initial syllable');

const monosyllabic=buildCreatorCandidate({...generated,syllableCount:1,syllables:['mɛʁsi'],syllabificationStatus:'source_exact'},lexicon,definitions);
assert.equal(monosyllabic.therapyActivities.some(item=>item.id==='syllable-identification'),false,'monosyllables must not expose identification');
const countOnly=buildCreatorCandidate({...generated,syllables:[],syllabificationStatus:'needs_source_review'},lexicon,definitions);
assert.equal(countOnly.therapyActivities.some(item=>item.id==='syllable-identification'),false,'syllableCount alone must never expose identification');

console.log('source-exact syllable identification runtime: initial prompt, exact response, session/PDF propagation and safety gates ok');
