import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const output=execFileSync(process.execPath,['scripts/audit-pictogram-guarantees.mjs'],{encoding:'utf8'});
const report=JSON.parse(output);
assert.equal(report.schemaVersion,'1.0');
assert.deepEqual(report.generatedFrom,[
  'data/lexicon-seed.json',
  'data/production-naming-reviews.json',
  'data/pictogram-prototype-comparisons.json'
]);
assert.ok(report.summary.total>0);
assert.ok(report.summary.active>0);
assert.ok(report.records.some(record=>record.label==='tour'&&record.denominationCandidates.some(candidate=>candidate.label==='château')));
assert.ok(report.records.every(record=>record.automaticClinicalClaim===false));
assert.equal(report.records.some(record=>record.highestGuarantee==='clinically_validated'),false);
console.log('pictogram guarantee audit: repository data is parseable and does not invent clinical validation');
