import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCreatorTargets,mergeCreatorTargets} from '../src/creator-catalog.js';
import {buildCreatorCandidate} from '../src/creator-runtime.js';
import {selectTherapyActivity} from '../src/therapy-activities.js';
import {normalizeWorksheetSet,worksheetActivity} from '../src/pdf-export.js';

const lexicon=JSON.parse(fs.readFileSync('data/lexicon-seed.json','utf8'));
const definitions=JSON.parse(fs.readFileSync('data/therapy-targets.json','utf8')).targets;

const [generated]=buildCreatorTargets({constructible:[{
  word:'merci',ipa:'mɛʁsi',frequency:100,syllableCount:2,syllabification:'mɛʁ.si',decomposition:['mer','scie']
}]});
assert.ok(generated.therapy.includes('syllable-segmentation'),'source-exact generated targets must expose syllable segmentation');
assert.equal(generated.therapy.includes('syllable-blending'),false,'source syllables must not reactivate historical piece blending');

const candidate=buildCreatorCandidate(generated,lexicon,definitions);
const activity=selectTherapyActivity(candidate.therapyActivities,'syllable-segmentation');
assert.ok(activity,'source-exact segmentation must be selectable');
assert.deepEqual(activity.expectedResponse,['mɛʁ','si']);
assert.match(activity.childInstruction,/sépare-le en syllabes/);
assert.match(activity.proInstruction,/frontières syllabiques source validées/);
assert.match(activity.proInstruction,/\/mɛʁ\/ \+ \/si\//);
assert.doesNotMatch(activity.proInstruction,/nom entier de chaque image/);

const identification=selectTherapyActivity(candidate.therapyActivities,'syllable-identification');
assert.ok(identification,'source-exact multisyllabic targets must expose syllable identification');
assert.equal(identification.promptPosition,'initial');
assert.equal(identification.expectedResponse,'mɛʁ');
assert.match(identification.childInstruction,/première syllabe/);
assert.match(identification.proInstruction,/syllabe initiale/);
assert.match(identification.proInstruction,/\/mɛʁ\//);

const [worksheet]=normalizeWorksheetSet([{...candidate,activity}]);
const pro=worksheetActivity(worksheet.activity,'pro');
assert.equal(pro.label,'Segmentation syllabique');
assert.match(pro.instruction,/\/mɛʁ\/ \+ \/si\//,'session/PDF metadata must retain the controlled expected segmentation');
const [identificationWorksheet]=normalizeWorksheetSet([{...candidate,activity:identification}]);
const identificationPro=worksheetActivity(identificationWorksheet.activity,'pro');
assert.equal(identificationPro.label,'Identification syllabique');
assert.match(identificationPro.instruction,/\/mɛʁ\//,'session/PDF metadata must retain the exact expected initial syllable');

const [unsafe]=buildCreatorTargets({constructible:[{
  word:'cinéma',ipa:'sinema',frequency:50,syllableCount:3,syllabification:null,decomposition:['scie','nez','mat']
}]});
assert.equal(unsafe.therapy.includes('syllable-segmentation'),false,'count alone must never activate syllable segmentation');

const manual={target:'merci',targetIpa:'/mɛʁsi/',mode:'strict',assets:'ready',therapy:['denomination','syllable-blending','oral-to-written']};
const [merged]=mergeCreatorTargets([manual],[generated]);
assert.deepEqual(merged.syllables,['mɛʁ','si']);
assert.ok(merged.therapy.includes('syllable-segmentation'),'compatible manual pilots may receive the source-exact segmentation activity');
assert.ok(merged.therapy.includes('syllable-blending'),'historical manual blending remains preserved as a separate activity');
const mergedCandidate=buildCreatorCandidate(merged,lexicon,definitions);
assert.ok(mergedCandidate.therapyActivities.some(item=>item.id==='syllable-identification'),'compatible manual pilots receive identification only at runtime from exact source units');

const noSourceCandidate=buildCreatorCandidate({...generated,syllables:[],syllabificationStatus:'needs_source_review'},lexicon,definitions);
assert.equal(noSourceCandidate.therapyActivities.some(item=>item.id==='syllable-segmentation'),false,'runtime must refuse segmentation when source-exact units disappear');
assert.equal(noSourceCandidate.therapyActivities.some(item=>item.id==='syllable-identification'),false,'runtime must refuse identification when source-exact units disappear');
const monosyllabic=buildCreatorCandidate({...generated,syllableCount:1,syllables:['mɛʁsi'],syllabificationStatus:'source_exact'},lexicon,definitions);
assert.equal(monosyllabic.therapyActivities.some(item=>item.id==='syllable-identification'),false,'monosyllables must not expose syllable identification');

console.log('source-exact syllable activities: segmentation and initial identification are gated, exact and propagated to session/PDF metadata');
