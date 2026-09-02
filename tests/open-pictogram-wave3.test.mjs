import assert from 'node:assert/strict';
import {OPEN_PICTOGRAMS_WAVE_3,OPENMOJI_WAVE3_SOURCE,buildWave3GapTargets,mergeOpenPictogramsWave3,wave3LibraryStats} from '../src/open-pictogram-library-wave3.js';

const stats=wave3LibraryStats();
assert.ok(stats.total>=120,`expected at least 120 wave-3 pictograms, got ${stats.total}`);
assert.ok(stats.strictEligible>=70,`expected at least 70 strict-eligible wave-3 pictograms, got ${stats.strictEligible}`);
assert.equal(stats.source,'OpenMoji');
assert.equal(stats.license,'CC BY-SA 4.0');
assert.equal(new Set(OPEN_PICTOGRAMS_WAVE_3.map(item=>item.id)).size,OPEN_PICTOGRAMS_WAVE_3.length);
assert.equal(new Set(OPEN_PICTOGRAMS_WAVE_3.map(item=>item.label)).size,OPEN_PICTOGRAMS_WAVE_3.length);
assert.ok(OPEN_PICTOGRAMS_WAVE_3.every(item=>item.sourceCommit===OPENMOJI_WAVE3_SOURCE.sourceCommit));
assert.ok(OPEN_PICTOGRAMS_WAVE_3.every(item=>item.sourceLicense==='CC BY-SA 4.0'));
assert.ok(OPEN_PICTOGRAMS_WAVE_3.every(item=>item.clinicalStatus==='unreviewed'));
assert.ok(OPEN_PICTOGRAMS_WAVE_3.every(item=>item.image.startsWith(OPENMOJI_WAVE3_SOURCE.assetBase)));
assert.equal(OPEN_PICTOGRAMS_WAVE_3.find(item=>item.id==='de')?.ipa,'/de/');
assert.equal(OPEN_PICTOGRAMS_WAVE_3.find(item=>item.id==='nez')?.ipa,'/ne/');
assert.equal(OPEN_PICTOGRAMS_WAVE_3.find(item=>item.id==='sel')?.ipa,'/sɛl/');
assert.equal(OPEN_PICTOGRAMS_WAVE_3.find(item=>item.id==='hotdog')?.strictEligible,false);
assert.equal(OPEN_PICTOGRAMS_WAVE_3.find(item=>item.id==='puzzle')?.strictEligible,false);

const merged=mergeOpenPictogramsWave3([{id:'seed-de',label:'dé',ipa:'/de/',image:'seed.svg',active:true}]);
assert.equal(merged.filter(item=>item.label==='dé').length,1);
assert.ok(merged.some(item=>item.id==='nez'));

const report={missingSounds:[{ipa:'/de/',examples:[{word:'déclic',ipa:'/deklik/',frequency:10,frame:['[de]','clic']}]}]};
const targets=buildWave3GapTargets(report);
assert.equal(targets.length,1);
assert.equal(targets[0].target,'déclic');
assert.equal(targets[0].source,'open-pictogram-wave3-gap');
console.log('open pictogram wave 3: ok');
