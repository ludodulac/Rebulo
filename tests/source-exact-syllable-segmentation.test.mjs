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

const [worksheet]=normalizeWorksheetSet([{...candidate,activity}]);
const pro=worksheetActivity(worksheet.activity,'pro');
assert.equal(pro.label,'Segmentation syllabique');
assert.match(pro.instruction,/\/mɛʁ\/ \+ \/si\//,'session/PDF metadata must retain the controlled expected segmentation');

const [unsafe]=buildCreatorTargets({constructible:[{
  word:'cinéma',ipa:'sinema',frequency:50,syllableCount:3,syllabification:null,decomposition:['scie','nez','mat']
}]});
assert.equal(unsafe.therapy.includes('syllable-segmentation'),false,'count alone must never activate syllable segmentation');

const manual={target:'merci',targetIpa:'/mɛʁsi/',mode:'strict',assets:'ready',therapy:['denomination','syllable-blending','oral-to-written']};
const [merged]=mergeCreatorTargets([manual],[generated]);
assert.deepEqual(merged.syllables,['mɛʁ','si']);
assert.ok(merged.therapy.includes('syllable-segmentation'),'compatible manual pilots may receive the source-exact segmentation activity');
assert.ok(merged.therapy.includes('syllable-blending'),'historical manual blending remains preserved as a separate activity');

const noSourceActivity=selectTherapyActivity(buildCreatorCandidate({...generated,syllables:[],syllabificationStatus:'needs_source_review'},lexicon,definitions).therapyActivities,'syllable-segmentation');
assert.notEqual(noSourceActivity?.id,'syllable-segmentation','runtime must refuse segmentation when source-exact units disappear');

console.log('source-exact syllable segmentation: gated units, expected response, session/PDF metadata and manual preservation ok');
