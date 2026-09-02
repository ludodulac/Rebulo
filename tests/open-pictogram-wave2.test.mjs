import assert from 'node:assert/strict';
import {OPEN_PICTOGRAMS_WAVE_2,OPENMOJI_WAVE2_SOURCE,buildWave2GapTargets,mergeOpenPictogramsWave2,wave2LibraryStats} from '../src/open-pictogram-library-wave2.js';

const stats=wave2LibraryStats();
assert.ok(stats.total>=100,`expected at least 100 wave-2 pictograms, got ${stats.total}`);
assert.ok(stats.strictEligible>=90,`expected at least 90 strict-eligible wave-2 pictograms, got ${stats.strictEligible}`);
assert.equal(stats.source,'OpenMoji');
assert.equal(stats.license,'CC BY-SA 4.0');
assert.equal(new Set(OPEN_PICTOGRAMS_WAVE_2.map(item=>item.id)).size,OPEN_PICTOGRAMS_WAVE_2.length);
assert.equal(new Set(OPEN_PICTOGRAMS_WAVE_2.map(item=>item.label)).size,OPEN_PICTOGRAMS_WAVE_2.length);
assert.ok(OPEN_PICTOGRAMS_WAVE_2.every(item=>item.sourceCommit===OPENMOJI_WAVE2_SOURCE.sourceCommit));
assert.ok(OPEN_PICTOGRAMS_WAVE_2.every(item=>item.sourceLicense==='CC BY-SA 4.0'));
assert.ok(OPEN_PICTOGRAMS_WAVE_2.every(item=>item.clinicalStatus==='unreviewed'));
assert.ok(OPEN_PICTOGRAMS_WAVE_2.every(item=>item.image.startsWith(OPENMOJI_WAVE2_SOURCE.assetBase)));
assert.equal(OPEN_PICTOGRAMS_WAVE_2.find(item=>item.id==='seau')?.ipa,'/so/');
assert.equal(OPEN_PICTOGRAMS_WAVE_2.find(item=>item.id==='scie')?.ipa,'/si/');
assert.equal(OPEN_PICTOGRAMS_WAVE_2.find(item=>item.id==='pile')?.ipa,'/pil/');
assert.equal(OPEN_PICTOGRAMS_WAVE_2.find(item=>item.id==='cle')?.ipa,'/kle/');
assert.equal(OPEN_PICTOGRAMS_WAVE_2.find(item=>item.id==='poulpe')?.strictEligible,false);

const merged=mergeOpenPictogramsWave2([{id:'seed-scie',label:'scie',ipa:'/si/',image:'seed.svg',active:true}]);
assert.equal(merged.filter(item=>item.label==='scie').length,1);
assert.ok(merged.some(item=>item.id==='seau'));

const report={missingSounds:[{ipa:'/so/',examples:[{word:'sauter',ipa:'/sote/',frequency:10,frame:['[so]','the']}]}]};
const targets=buildWave2GapTargets(report);
assert.equal(targets.length,1);
assert.equal(targets[0].target,'sauter');
assert.equal(targets[0].source,'open-pictogram-wave2-gap');
console.log('open pictogram wave 2: ok');
