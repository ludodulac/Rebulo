import assert from 'node:assert/strict';
import { buildAssetInventory } from '../scripts/audit-asset-library.mjs';

const inventory = await buildAssetInventory(new URL('..', import.meta.url).pathname);

assert.equal(inventory.schemaVersion, '1.1');
assert.equal(inventory.summary.production, 24, 'production SVG count should exclude archived legacy pot');
assert.equal(inventory.summary.prepared, 0, 'prepared comic queue should be empty after corps migration');
assert.equal(inventory.summary.research, 37, 'research inventory should include both selective materialization waves');

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

const historicalPot = inventory.assets.find(item => item.path === 'assets/research/pot-openmoji-1fab4.svg');
assert.ok(historicalPot, 'previous pot-with-plant stimulus should be archived');
assert.equal(historicalPot.active, false);
assert.equal(historicalPot.style, 'legacy_or_external');
assert.equal(historicalPot.revision, 'pot-openmoji-1fab4-v1');
assert.ok(!inventory.assets.some(item => item.path === 'assets/rebus/pot.svg'), 'legacy pot should no longer live in production');

const nidPrototype = inventory.assets.find(item => item.path === 'assets/research/nid-comic-v1.svg');
assert.ok(nidPrototype, 'nid should have an isolated research prototype');
assert.equal(nidPrototype.active, false);
assert.equal(nidPrototype.style, 'comic');
assert.equal(nidPrototype.revision, 'nid-comic-v1');
assert.equal(nidPrototype.clinicalStatus, 'naming_test_required');
assert.ok(!inventory.summary.activeLegacyStyle.includes(nidPrototype.path), 'inactive research prototypes must never enter active legacy migration warnings');

const hourPaths=[['assets/research/heure-scene-a-v1.svg','heure-scene-a-v1'],['assets/research/heure-scene-b-v1.svg','heure-scene-b-v1']];
for(const [path,revision] of hourPaths){
  const asset=inventory.assets.find(item=>item.path===path);
  assert.ok(asset,`${path} should exist as a separate research stimulus`);
  assert.equal(asset.active,false,`${path} must remain research-only before human naming review`);
  assert.equal(asset.provenance,'rebulo_original');
  assert.equal(asset.revision,revision);
  assert.equal(asset.clinicalStatus,'naming_test_required');
  assert.ok(!inventory.summary.activeLegacyStyle.includes(path),`${path} must never count as active production`);
}

const materializationResearchPaths = [
  'assets/research/croix-stimulus-v1.svg',
  'assets/research/doigt-stimulus-v1.svg',
  'assets/research/oeufs-stimulus-v1.svg',
  'assets/research/oie-stimulus-v1.svg',
  'assets/research/pelle-stimulus-v1.svg',
  'assets/research/radis-stimulus-v1.svg',
  'assets/research/carre-stimulus-v1.svg',
  'assets/research/fou-echecs-stimulus-v1.svg'
];
for (const path of materializationResearchPaths) {
  const asset = inventory.assets.find(item => item.path === path);
  assert.ok(asset, `${path} should be visible in the research inventory`);
  assert.equal(asset.active, false, `${path} must remain research-only before human naming review`);
  assert.ok(!inventory.summary.activeLegacyStyle.includes(path), `${path} must never count as active production`);
}

const recoveredOriginals=[
  ['assets/rebus/de.svg','de-die-v1'],
  ['assets/rebus/mer.svg','mer-sea-v1'],
  ['assets/rebus/pie.svg','pie-magpie-v1'],
  ['assets/rebus/mie.svg','mie-bread-crumb-v1'],
  ['assets/rebus/mat.svg','mat-mast-v1']
];
for(const [path,revision] of recoveredOriginals){
  const asset=inventory.assets.find(item=>item.path===path);
  assert.ok(asset,`${path} must remain in production`);
  assert.equal(asset.active,true);
  assert.equal(asset.provenance,'rebulo_original',`${path} Git history provenance must not remain undocumented`);
  assert.equal(asset.revision,revision,`${path} must have a frozen revision for future naming evidence`);
  assert.equal(asset.clinicalStatus,'naming_test_required','provenance recovery must not imply human or clinical approval');
}

const frozenOpenMoji=[
  'assets/rebus/scie.svg','assets/rebus/nez.svg','assets/rebus/rat.svg','assets/rebus/pas.svg',
  'assets/rebus/lit.svg','assets/rebus/riz.svg','assets/rebus/chat.svg'
];
for(const path of frozenOpenMoji){
  const asset=inventory.assets.find(item=>item.path===path);
  assert.ok(asset);
  assert.equal(asset.provenance,'openmoji');
  assert.ok(asset.revision,`${path} should have a revision-bound visual identity`);
}

const redesignPaths = [
  'assets/research/mat-boat-arrow-comic-v1.svg',
  'assets/research/tour-chess-rook-comic-v1.svg',
  'assets/research/tas-leaves-comic-v1.svg',
  'assets/research/cor-horn-comic-v1.svg'
];
for (const path of redesignPaths) {
  const asset = inventory.assets.find(item => item.path === path);
  assert.ok(asset, `${path} should stay in the research library until human naming review`);
  assert.equal(asset.active, false, `${path} must not silently become an active production asset`);
  assert.ok(!inventory.summary.activeLegacyStyle.includes(path), `${path} must never count as active legacy production`);
}

assert.ok(inventory.summary.duplicateReadings.includes('pot'), 'archived pot history should remain visible alongside production');
assert.ok(inventory.summary.duplicateReadings.includes('tas'), 'historical tas research stimuli should remain visible as same-reading revisions');
assert.ok(inventory.summary.duplicateReadings.includes('eau'), 'historical water revision should remain visible alongside production');
assert.deepEqual(inventory.summary.productionDuplicateReadings, [], 'historical revisions must not be misreported as duplicate production concepts');
for (const reading of ['pot','tas','eau']) assert.ok(inventory.summary.historicalRevisionReadings.includes(reading), `${reading} should be classified as production + research history`);
assert.ok(inventory.summary.activeLegacyStyle.includes('assets/rebus/chat.svg'), 'audit should expose active assets that still need comic migration');

console.log('asset-library-inventory.test.mjs: visual provenance, revision identity and two selective research materialization waves are coherent');
