import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeGeneralCoverage} from '../src/general-coverage.js';

const report=JSON.parse(fs.readFileSync('data/coverage-report.json','utf8'));
const metrics=analyzeGeneralCoverage(report);

assert.equal(metrics.strictMultiPieceUniqueWordCount,291);
assert.ok(metrics.graphemeGeneratedUniqueWordCount>0);
assert.equal(
  metrics.combinedStrictAndGraphemeUniqueWordCount,
  metrics.strictMultiPieceUniqueWordCount+metrics.graphemeGeneratedUniqueWordCount
);
assert.ok(metrics.graphemeGainVsStrict>0);
assert.equal(metrics.positions.none,undefined);
assert.ok(Object.keys(metrics.lettersUsed).length>0);

console.log(`GENERAL_COVERAGE_METRICS ${JSON.stringify(metrics)}`);
