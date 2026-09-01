import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const schema=JSON.parse(await readFile(new URL('../data/pictogram-naming-tests.schema.json',import.meta.url),'utf8'));
const registry=JSON.parse(await readFile(new URL('../data/pictogram-naming-tests.json',import.meta.url),'utf8'));

assert.equal(registry.schemaVersion,'1.0');
assert.deepEqual(registry.records,[],'the repository must not contain fabricated participant results');

const record=schema.$defs.testRecord;
for(const field of ['concept','targetIpa','asset','population','participantCount','instruction','observations','targetResponseFrequency','competingResponses','review']){
  assert.ok(record.required.includes(field),`missing required naming-test field: ${field}`);
}

assert.equal(schema.$defs.observation.additionalProperties,false,'observations must remain anonymous and tightly scoped');
assert.deepEqual(schema.$defs.observation.required,['responseVerbatim','hesitation','noResponse']);
assert.equal(schema.$defs.review.additionalProperties,false);
for(const field of ['status','reviewerName','reviewedAt','decisionNote']){
  assert.ok(schema.$defs.review.required.includes(field),`review must require ${field}`);
}
assert.ok(schema.$defs.review.properties.status.enum.includes('clinical_approved'));
assert.match(schema.$defs.review.description,/must never be inferred automatically/i);

console.log('pictogram naming test schema guardrails: ok');
