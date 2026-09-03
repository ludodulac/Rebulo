import assert from 'node:assert/strict';
import fs from 'node:fs';
import {segmentTargetWithLexicon} from '../src/phonetic-engine.js';
import {buildGeneralCreatorCandidate} from '../src/creator-runtime.js';
import {generalOperationVisual} from '../src/general-operation-visual.js';
import {OPEN_PICTOGRAMS_WAVE_2,mergeOpenPictogramsWave2} from '../src/open-pictogram-library-wave2.js';

const corpus=JSON.parse(fs.readFileSync(new URL('../data/corpus-pilot.json',import.meta.url),'utf8'));
const yoyo=OPEN_PICTOGRAMS_WAVE_2.find(item=>item.id==='yoyo');
assert.ok(yoyo,'the half-yoyo pilot must reuse the existing wave 2 yoyo pictogram');
assert.equal(yoyo.label,'yo-yo');
assert.equal(yoyo.ipa,'/jojo/');
assert.equal(yoyo.strictEligible,false,'the wave 2 yoyo is general-only and must stay out of strict segmentation');
assert.equal(yoyo.assetSource,'openmoji:1FA80');
assert.equal(yoyo.sourceLicense,'CC BY-SA 4.0');
assert.equal(yoyo.clinicalStatus,'unreviewed');
assert.deepEqual(segmentTargetWithLexicon('/jojo/',[yoyo],1),[],'the general-only yoyo must never become strict evidence');

const preserved={...yoyo,image:'local-yoyo.svg'};
const merged=mergeOpenPictogramsWave2([preserved]);
assert.equal(merged.filter(item=>item.id==='yoyo').length,1);
assert.equal(merged.find(item=>item.id==='yoyo').image,'local-yoyo.svg','existing lexicon entries stay authoritative');

const target=corpus.items.find(item=>item.target==='yo');
assert.ok(target,'the public corpus must expose the reference half-yoyo construction');
assert.equal(target.mode,'general');
assert.equal(target.assets,'ready');
assert.deepEqual(target.operations,[{type:'explicit_deletion',pieceId:'yoyo',keep:'premier yo',remove:'second yo',reading:'yo',visual:'half'}]);

const candidate=buildGeneralCreatorCandidate(target,[yoyo]);
assert.ok(candidate);
assert.deepEqual(candidate.construction.capabilities,['general']);
assert.equal(candidate.construction.operations[0].type,'explicit_deletion');
assert.equal(candidate.pieces[0].sourceReading,'yo-yo');
assert.equal(candidate.pieces[0].reading,'yo');
assert.equal(candidate.pieces[0].visual,'half');

const visual=generalOperationVisual(candidate.pieces[0]);
assert.ok(visual);
assert.equal(visual.kind,'deletion-half');
assert.equal(visual.label,'yo-yo');
assert.equal(visual.reading,'yo');

console.log('half-yoyo pilot: existing wave 2 OpenMoji source, explicit deletion and strict separation preserved.');
