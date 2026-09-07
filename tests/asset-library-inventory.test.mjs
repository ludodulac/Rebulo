import assert from 'node:assert/strict';
import { buildAssetInventory } from '../scripts/audit-asset-library.mjs';

const inventory = await buildAssetInventory(new URL('..', import.meta.url).pathname);

assert.equal(inventory.summary.production, 25, 'production SVG count should stay explicit during cleanup');
assert.equal(inventory.summary.prepared, 0, 'prepared comic queue should be empty after corps migration');
assert.equal(inventory.summary.research, 21, 'historical research stimuli should remain preserved');

const expectedComicProduction = [
  ['the', '/te/', 'the-comic-v1'],
  ['tas', '/ta/', 'tas-comic-v1'],
  ['eau', '/o/', 'eau-comic-v1'],
  ['corps', '/kɔʁ/', 'corps-comic-v1']
];
for (const [id, ipa, revision] of expectedComicProduction) {
  const asset = inventory.assets.find(item => item.path === `assets/rebus/${id}.svg`);
  assert.ok(asset, `${id} should have a canonical production asset`);
  assert.equal(asset.active, true);
  assert.equal(asset.style, 'comic');
  assert.equal(asset.revision, revision);
  assert.equal(asset.clinicalStatus, 'naming_test_required');
  assert.equal(asset.ipa, ipa);
  assert.ok(!inventory.summary.activeLegacyStyle.includes(asset.path), `${id} should not be reported as legacy style`);
}

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

console.log('asset-library-inventory.test.mjs: ok');
