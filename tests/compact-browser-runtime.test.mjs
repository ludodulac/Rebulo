import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generatedPlayableBankRebuses,playableRepresentationBankRows} from '../src/generated-play-catalog.js';

const json=path=>JSON.parse(readFileSync(new URL(`../${path}`,import.meta.url),'utf8'));
const soundCatalog=json('data/rebus-sound-catalog.json');
const visibleConventions=json('data/rebus-visible-conventions.json');
const coverage=json('data/coverage-report.json');
const compact=json('data/rebulo-compact-runtime.json');

assert.equal(compact.status,'compiled_runtime_view_not_editorial_source');
assert.deepEqual(compact.bankRows,playableRepresentationBankRows(soundCatalog,visibleConventions),'compiled runtime bank must exactly match canonical active representation rows');
assert.deepEqual(compact.playRebuses,generatedPlayableBankRebuses(coverage,soundCatalog,visibleConventions),'compiled play rounds must exactly match canonical generated rounds');
assert.ok(compact.bankRows.length>0&&compact.playRebuses.length>0);
console.log(`compact-browser-runtime.test.mjs: ${compact.bankRows.length} rows / ${compact.playRebuses.length} play rebuses`);
