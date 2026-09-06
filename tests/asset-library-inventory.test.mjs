import assert from 'node:assert/strict';
import { buildAssetInventory } from '../scripts/audit-asset-library.mjs';

const inventory = await buildAssetInventory(new URL('..', import.meta.url).pathname);

assert.equal(inventory.summary.production, 23, 'production SVG count should stay explicit during cleanup');
assert.equal(inventory.summary.prepared, 3, 'tea should leave the prepared queue after migration');
assert.equal(inventory.summary.research, 20, 'the former tea stimulus should be preserved in research history');

const productionTea = inventory.assets.find(item => item.path === 'assets/rebus/the.svg');
assert.ok(productionTea, 'canonical tea asset should remain at the stable production path');
assert.equal(productionTea.active, true);
assert.equal(productionTea.style, 'comic');
assert.equal(productionTea.revision, 'the-comic-v1');
assert.equal(productionTea.clinicalStatus, 'naming_test_required');
assert.equal(productionTea.ipa, '/te/');

const historicalTea = inventory.assets.find(item => item.path === 'assets/research/the-openmoji-1f375.svg');
assert.ok(historicalTea, 'previous tea stimulus should be archived');
assert.equal(historicalTea.active, false);
assert.equal(historicalTea.style, 'legacy_or_external');
assert.equal(historicalTea.revision, 'the-openmoji-1f375-v1');

assert.ok(inventory.summary.duplicateReadings.includes('pot'), 'pot duplicate should remain visible until safely migrated');
assert.ok(inventory.summary.activeLegacyStyle.includes('assets/rebus/chat.svg'), 'audit should expose active assets that still need comic migration');
assert.ok(!inventory.summary.activeLegacyStyle.includes('assets/rebus/the.svg'), 'migrated tea should no longer be reported as legacy style');

console.log('asset-library-inventory.test.mjs: ok');
