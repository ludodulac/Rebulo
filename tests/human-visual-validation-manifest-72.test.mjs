import fs from 'node:fs';
import assert from 'node:assert/strict';

const manifest = JSON.parse(fs.readFileSync('data/human-visual-validation-manifest-72.json', 'utf8'));
const concepts = manifest.concepts;

assert.equal(concepts.length, 72, 'manifest must contain exactly 72 concepts');

const expected = {
  physical_object: 18,
  animal: 10,
  food: 8,
  body_part: 8,
  tool: 8,
  vehicle: 6,
  place: 6,
  other_concrete: 8,
};

const counts = Object.fromEntries(Object.keys(expected).map((key) => [key, 0]));
for (const concept of concepts) {
  assert.ok(Object.hasOwn(expected, concept.conceptCategory), `unexpected category: ${concept.conceptCategory}`);
  counts[concept.conceptCategory] += 1;

  for (const field of ['stableId', 'ipa', 'exactWord', 'senseId', 'conceptLabel', 'conceptDescription', 'provenance', 'conceptCategory', 'anticipatedAlternativeNames', 'anticipatedNamingRisk', 'visualBrief', 'historicalControl', 'humanNamingEvidence']) {
    assert.ok(Object.hasOwn(concept, field), `${concept.stableId ?? '<missing id>'}: missing ${field}`);
  }

  assert.ok(concept.ipa.trim().length > 0, `${concept.stableId}: ipa required`);
  assert.ok(concept.exactWord.trim().length > 0, `${concept.stableId}: exactWord required`);
  assert.ok(concept.visualBrief.trim().length > 0, `${concept.stableId}: visualBrief required`);
  assert.equal(concept.humanNamingEvidence, 'none', `${concept.stableId}: humanNamingEvidence must remain none`);
  assert.ok(Array.isArray(concept.anticipatedAlternativeNames), `${concept.stableId}: alternatives must be an array`);
  assert.ok(['low', 'medium'].includes(concept.anticipatedNamingRisk), `${concept.stableId}: naming risk must be low or medium`);
}

assert.deepEqual(counts, expected, 'category quotas must match exactly');

const controls = concepts.filter((concept) => concept.historicalControl);
assert.equal(controls.length, 18, 'manifest must contain exactly 18 historical positive controls');
assert.ok(controls.every((concept) => concept.provenance?.historicalControlBasis === '#290 positive control'),
  'historical controls must be explicitly sourced as #290 positive controls');

const stableIds = concepts.map((concept) => concept.stableId);
assert.equal(new Set(stableIds).size, concepts.length, 'stableId values must be unique');

const senseIds = concepts.map((concept) => concept.senseId);
assert.equal(new Set(senseIds).size, concepts.length, 'senseId values must be unique within this manifest');

assert.equal(manifest.scope.noImagesProduced, true);
assert.equal(manifest.scope.humanNamingEvidence, 'none');

console.log('human visual validation manifest 72: OK');
console.log(JSON.stringify({total: concepts.length, controls: controls.length, counts}, null, 2));
