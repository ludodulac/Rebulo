import assert from 'node:assert/strict';
import { buildAssetInventory } from '../scripts/audit-asset-library.mjs';

const inventory = await buildAssetInventory(new URL('..', import.meta.url).pathname);

assert.equal(inventory.summary.production, 24, 'production SVG count should stay explicit during cleanup');
assert.equal(inventory.summary.prepared, 1, 'tea, tas and water should leave the prepared queue after migration');
assert.equal(inventory.summary.research, 21, 'historical research stimuli should remain preserved');

const productionTea = inventory.assets.find(item => item.path === 'assets/rebus/the.svg');
assert.ok(productionTea, 'canonical tea asset should remain at the stable production path');
assert.equal(productionTea.active, true);
assert.equal(productionTea.style, 'comic');
assert.equal(productionTea.revision, 'the-comic-v1');
assert.equal(productionTea.clinicalStatus, 'naming_test_required');
assert.equal(productionTea.ipa, '/te/');

const productionTas = inventory.assets.find(item => item.path === 'assets/rebus/tas.svg');
assert.ok(productionTas, 'tas should be promoted to a canonical production asset');
assert.equal(productionTas.active, true);
assert.equal(productionTas.style, 'comic');
assert.equal(productionTas.revision, 'tas-comic-v1');
assert.equal(productionTas.clinicalStatus, 'naming_test_required');
assert.equal(productionTas.ipa, '/ta/');

const productionWater = inventory.assets.find(item => item.path === 'assets/rebus/eau.svg');
assert.ok(productionWater, 'water should keep its stable canonical path');
assert.equal(productionWater.active, true);
assert.equal(productionWater.style, 'comic');
assert.equal(productionWater.revision, 'eau-comic-v1');
assert.equal(productionWater.clinicalStatus, 'naming_test_required');
assert.equal(productionWater.ipa, '/o/');

const historicalTea = inventory.assets.find(item => item.path === 'assets/research/the-openmoji-1f375.svg');
assert.ok(historicalTea, 'previous tea stimulus should be archived');
assert.equal(historicalTea.active, false);
assert.equal(historicalTea.style, 'legacy_or_external');
assert.equal(historicalTea.revision, 'the-openmoji-1f375-v1');

const historicalWater = inventory.assets.find(item => item.path === 'assets/research/eau-openmoji-drop-1f4a7.svg');
assert.ok(historicalWater, 'previous water drop stimulus should be archived');
assert.equal(historicalWater.active, false);
assert.equal(historicalWater.style, 'legacy_or_external');
assert.equal(historicalWater.revision, 'eau-openmoji-drop-v1');

assert.ok(inventory.summary.duplicateReadings.includes('pot'), 'pot duplicate should remain visible until safely migrated');
assert.ok(inventory.summary.duplicateReadings.includes('tas'), 'historical tas research stimuli should remain visible as same-reading revisions');
assert.ok(inventory.summary.duplicateReadings.includes('eau'), 'historical water revision should remain visible alongside production');
assert.ok(inventory.summary.activeLegacyStyle.includes('assets/rebus/chat.svg'), 'audit should expose active assets that still need comic migration');
assert.ok(!inventory.summary.activeLegacyStyle.includes('assets/rebus/the.svg'), 'migrated tea should no longer be reported as legacy style');
assert.ok(!inventory.summary.activeLegacyStyle.includes('assets/rebus/tas.svg'), 'migrated tas should not be reported as legacy style');
assert.ok(!inventory.summary.activeLegacyStyle.includes('assets/rebus/eau.svg'), 'migrated water should not be reported as legacy style');

console.log('asset-library-inventory.test.mjs: ok');
