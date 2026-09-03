import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCreatorCandidate,buildGeneralCreatorCandidate} from '../src/creator-runtime.js';
import {generalOperationVisual} from '../src/general-operation-visual.js';
import {mergeCreatorTargets,buildAutomaticCreatorTargets} from '../src/creator-catalog.js';
import {REBUS_CAPABILITIES,supportsConstructionCapability} from '../src/rebus-construction.js';

const corpus=JSON.parse(fs.readFileSync(new URL('../data/corpus-pilot.json',import.meta.url),'utf8'));
const seed=JSON.parse(fs.readFileSync(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));
const coverage=JSON.parse(fs.readFileSync(new URL('../data/coverage-report.json',import.meta.url),'utf8'));

const parasol=corpus.items.find(item=>item.target==='parasol');
assert.ok(parasol,'parasol must remain in the manual corpus');
assert.equal(parasol.mode,'strict');
assert.deepEqual(parasol.parts.map(part=>part.label),['pas','rat','sol'],'the exact pas + rat + sol construction remains authoritative');
assert.equal(parasol.alternatives?.length,1);

const substitution=parasol.alternatives[0];
assert.equal(substitution.mode,'general');
assert.equal(substitution.source,'manual-general-explicit-substitution-pilot');
assert.deepEqual(substitution.operations,[
  {type:'whole_word',pieceId:'pas'},
  {type:'explicit_substitution',pieceId:'chat',replace:'CH',replacement:'R',reading:'rat',visual:'cross_out_replace'},
  {type:'whole_word',pieceId:'sol'}
]);

const strict=buildCreatorCandidate(parasol,seed);
assert.ok(strict,'the original exact parasol must still build');
assert.equal(strict.construction.mode,'strict');
assert.equal(supportsConstructionCapability(strict.construction,REBUS_CAPABILITIES.PHONETIC_STRICT),true);

const general=buildGeneralCreatorCandidate(substitution,seed);
assert.ok(general,'the explicit substitution alternative must be drawable with existing assets');
assert.equal(general.construction.mode,'general');
assert.equal(supportsConstructionCapability(general.construction,REBUS_CAPABILITIES.PHONETIC_STRICT),false);
assert.deepEqual(general.pieces.map(piece=>piece.operationType),['whole_word','explicit_substitution','whole_word']);

const changed=general.pieces[1];
assert.equal(changed.label,'chat');
assert.equal(changed.sourceReading,'chat');
assert.equal(changed.replace,'CH');
assert.equal(changed.replacement,'R');
assert.equal(changed.reading,'rat');
const visual=generalOperationVisual(changed);
assert.ok(visual);
assert.equal(visual.kind,'substitution');
assert.equal(visual.replace,'CH');
assert.equal(visual.replacement,'R');
assert.equal(visual.reading,'rat');

const merged=mergeCreatorTargets(corpus.items,buildAutomaticCreatorTargets(coverage));
const mergedParasol=merged.find(item=>item.target==='parasol');
assert.ok(mergedParasol);
assert.equal(mergedParasol.mode,'strict','automatic catalog merging must not replace the manual exact primary');
const mergedSubstitution=(mergedParasol.alternatives||[]).find(item=>item.source==='manual-general-explicit-substitution-pilot');
assert.ok(mergedSubstitution,'the substitution pilot must survive runtime catalog merging');
assert.equal(mergedSubstitution.mode,'general');

console.log('parasol substitution pilot: exact primary preserved; chat CH→R alternative remains explicit and general-only.');
