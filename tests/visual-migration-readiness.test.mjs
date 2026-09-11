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
const dependencyReport=JSON.parse(fs.readFileSync(new URL('../data/active-dependency-report.json',import.meta.url),'utf8'));
const productionReviews=JSON.parse(fs.readFileSync(new URL('../data/production-naming-reviews.json',import.meta.url),'utf8'));
assert.equal(report.schemaVersion,'1.0');
assert.equal(report.baseline.strictMultiPieceUniqueWords,dependencyReport.baseline.strictMultiPieceUniqueWords,'visual readiness must follow the current regenerated strict dependency baseline');
assert.ok(report.baseline.strictMultiPieceUniqueWords>=760,'strict multi-image coverage must not regress below the established baseline');
assert.equal(report.queue.length,dependencyReport.baseline.activePictogramCount,'readiness queue must follow the current active pictogram set');
assert.ok(report.queue.every((item,index,array)=>index===0||array[index-1].strictUniqueLossIfUnavailable<=item.strictUniqueLossIfUnavailable),'queue should prioritize lower dependency loss');

const selectiveIds=new Set(['olive','aiguille','noeud','couteau']);
const reviewCount=report.queue.filter(item=>item.namingReviewAvailable).length;
assert.equal(reviewCount,productionReviews.reviews.length,'revision-bound reviews must stay explicit rather than being inferred for newly activated pictograms');
assert.equal(report.queue.filter(item=>item.nextGate==='collect_human_naming_observations').length,reviewCount,'only pictograms with a real revision-bound review may proceed to human naming collection');
for(const item of report.queue){
  assert.equal(item.provenanceDocumented,true,`${item.id} should have documented provenance`);
  if(selectiveIds.has(item.id)){
    assert.equal(item.revisionStamped,false,`${item.id} selective conversion still needs a product revision stamp`);
    assert.equal(item.namingReviewAvailable,false,`${item.id} must remain without fabricated human-review infrastructure`);
    assert.equal(item.nextGate,'stamp_current_revision');
  }else{
    assert.equal(item.revisionStamped,true,`${item.id} should have a frozen visual revision`);
    assert.equal(item.namingReviewAvailable,true,`${item.id} should keep its existing revision-bound production review`);
    assert.equal(item.nextGate,'collect_human_naming_observations',`${item.id} should require real human naming observations next`);
  }
}
for(const id of selectiveIds){
  const item=report.queue.find(x=>x.id===id);assert.ok(item,`${id} selective planner conversion should be present in the active readiness queue`);
  assert.equal(item.source,'openmoji',`${id} embedded OpenMoji provenance should be recognized without inventing a naming review`);
}

const expectedRevisions={pot:'pot-comic-v1',dos:'dos-comic-v1',raie:'raie-comic-v1',tas:'tas-comic-v1',terre:'terre-comic-v1'};
for(const [id,revision] of Object.entries(expectedRevisions)){
  const item=report.queue.find(x=>x.id===id);assert.ok(item);
  assert.equal(item.artRevision,revision,`${id} readiness must follow the active production revision rather than the research comparison revision`);
  assert.equal(item.namingReviewAvailable,true);
}
assert.equal(report.queue.find(x=>x.id==='de').strictUniqueLossIfUnavailable,170);
assert.match(report.methodology.clinicalCaution,/validation clinique|dénomination/i);
console.log(`visual migration readiness: ${report.queue.length} active revisions; ${reviewCount} have revision-bound naming reviews; four selective conversions remain at the explicit revision-stamp gate.`);
