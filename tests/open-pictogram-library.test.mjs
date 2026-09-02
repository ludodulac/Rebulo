import assert from 'node:assert/strict';
import {segmentTargetWithLexicon} from '../src/phonetic-engine.js';
import {OPENMOJI_SOURCE,OPEN_PICTOGRAMS,mergeOpenPictograms,numberReadingForIPA,openPictogramLibraryStats} from '../src/open-pictogram-library.js';

assert.ok(OPEN_PICTOGRAMS.length>=100,'the open library should be a genuinely large first batch');
assert.equal(new Set(OPEN_PICTOGRAMS.map(item=>item.id)).size,OPEN_PICTOGRAMS.length);
assert.ok(OPEN_PICTOGRAMS.every(item=>item.label&&item.ipa&&item.image&&item.sourceFile&&item.sourceCommit&&item.sourceLicense));
assert.ok(OPEN_PICTOGRAMS.every(item=>item.sourceCommit===OPENMOJI_SOURCE.sourceCommit));
assert.ok(OPEN_PICTOGRAMS.every(item=>item.sourceLicense==='CC BY-SA 4.0'));
assert.ok(OPEN_PICTOGRAMS.every(item=>item.clinicalStatus!=='clinical_approved'));
assert.ok(OPEN_PICTOGRAMS.some(item=>item.strictEligible===false),'ambiguous visuals must stay general-only');

const ambiguous=OPEN_PICTOGRAMS.find(item=>item.strictEligible===false);
assert.deepEqual(segmentTargetWithLexicon(ambiguous.ipa,[ambiguous],1),[],'general-only visuals must never enter strict segmentation');
const strict=OPEN_PICTOGRAMS.find(item=>item.strictEligible!==false);
assert.equal(segmentTargetWithLexicon(strict.ipa,[strict],1)[0]?.[0]?.id,strict.id);

const preserved={id:'avion',label:'avion',ipa:'/custom/',image:'local.svg',active:true};
const merged=mergeOpenPictograms([preserved]);
assert.equal(merged.find(item=>item.id==='avion')?.ipa,'/custom/','seed entries remain authoritative');
assert.equal(merged.filter(item=>item.id==='avion').length,1);

assert.equal(numberReadingForIPA('/ɛ̃/')?.grapheme,'1');
assert.equal(numberReadingForIPA('/dø/')?.grapheme,'2');
assert.equal(numberReadingForIPA('/sɑ̃/')?.grapheme,'100');
const stats=openPictogramLibraryStats();
assert.equal(stats.total,OPEN_PICTOGRAMS.length);
assert.equal(stats.source,'OpenMoji');
assert.equal(stats.license,'CC BY-SA 4.0');
console.log(`open pictogram library: ${stats.total} concepts, ${stats.strictEligible} strict-eligible`);