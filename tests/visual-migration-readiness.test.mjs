import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=new URL('..',import.meta.url).pathname;
const output=path.join(os.tmpdir(),`rebulo-visual-migration-${process.pid}.json`);
const run=spawnSync(process.execPath,['scripts/build-visual-migration-readiness.mjs','data/active-dependency-report.json','data/asset-sources.json','data/production-naming-reviews.json',output],{cwd:root,encoding:'utf8'});
assert.equal(run.status,0,run.stderr||run.stdout);
const report=JSON.parse(fs.readFileSync(output,'utf8'));fs.unlinkSync(output);
assert.equal(report.schemaVersion,'1.0');
assert.equal(report.baseline.strictMultiPieceUniqueWords,760);
assert.equal(report.queue.length,24);
assert.ok(report.queue.every((item,index,array)=>index===0||array[index-1].strictUniqueLossIfUnavailable<=item.strictUniqueLossIfUnavailable),'queue should prioritize lower dependency loss');

assert.equal(report.queue.filter(item=>item.namingReviewAvailable).length,24,'every active production pictogram should now have its own revision-bound naming review');
assert.equal(report.queue.filter(item=>item.nextGate==='collect_human_naming_observations').length,24,'all active production pictograms should now stop at the real human naming gate');
for(const item of report.queue){
  assert.equal(item.provenanceDocumented,true,`${item.id} should have documented provenance`);
  assert.equal(item.revisionStamped,true,`${item.id} should have a frozen visual revision`);
  assert.equal(item.namingReviewAvailable,true,`${item.id} should have a revision-bound production naming review`);
  assert.equal(item.nextGate,'collect_human_naming_observations',`${item.id} should require real human naming observations next`);
}

const expectedRevisions={pot:'pot-comic-v1',dos:'dos-comic-v1',raie:'raie-comic-v1',tas:'tas-comic-v1',terre:'terre-comic-v1'};
for(const [id,revision] of Object.entries(expectedRevisions)){
  const item=report.queue.find(x=>x.id===id);assert.ok(item);
  assert.equal(item.artRevision,revision,`${id} readiness must follow the active production revision rather than the research comparison revision`);
  assert.equal(item.namingReviewAvailable,true);
}
assert.equal(report.queue.find(x=>x.id==='de').strictUniqueLossIfUnavailable,170);
assert.match(report.methodology.clinicalCaution,/validation clinique|dénomination/i);
console.log('visual migration readiness: all 24 active production revisions are technically ready and now stop at the real human naming gate.');
