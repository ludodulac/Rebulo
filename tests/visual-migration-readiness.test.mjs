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

const observationReady=['pluie','sol','tour','cle','mer','corps','chat','eau','pie','scie','riz','mie','mat','lit','pas','nez','rat','the','de'];
for(const id of observationReady){
  const item=report.queue.find(x=>x.id===id);
  assert.ok(item,`${id} should stay in the visual migration queue`);
  assert.equal(item.provenanceDocumented,true,`${id} should have documented provenance`);
  assert.equal(item.revisionStamped,true,`${id} should have a frozen visual revision`);
  assert.equal(item.namingReviewAvailable,true,`${id} should have a revision-bound naming review`);
  assert.equal(item.nextGate,'collect_human_naming_observations',`${id} should now be ready for real human naming observations`);
}

assert.equal(report.queue.find(x=>x.id==='mer').artRevision,'mer-sea-v1');
assert.equal(report.queue.find(x=>x.id==='chat').artRevision,'chat-openmoji-1f431-v1');
assert.equal(report.queue.find(x=>x.id==='pie').artRevision,'pie-magpie-v1');
assert.equal(report.queue.find(x=>x.id==='scie').artRevision,'scie-openmoji-1fa9a-v1');
assert.equal(report.queue.find(x=>x.id==='riz').artRevision,'riz-openmoji-1f35a-v1');
assert.equal(report.queue.find(x=>x.id==='mie').artRevision,'mie-bread-crumb-v1');
assert.equal(report.queue.find(x=>x.id==='mat').artRevision,'mat-mast-v1');
assert.equal(report.queue.find(x=>x.id==='de').artRevision,'de-die-v1');
assert.equal(report.queue.find(x=>x.id==='de').strictUniqueLossIfUnavailable,170);

for(const id of ['pot','dos','raie','tas','terre']){
  const item=report.queue.find(x=>x.id===id);
  assert.ok(item);
  assert.equal(item.provenanceDocumented,true);
  assert.equal(item.revisionStamped,true);
  assert.equal(item.namingReviewAvailable,false,`${id} production revision still needs its own review rather than reusing prototype evidence`);
  assert.equal(item.nextGate,'add_revision_bound_naming_review');
}

assert.match(report.methodology.clinicalCaution,/validation clinique|dénomination/i);
console.log('visual migration readiness: nineteen active production revisions are ready for real human naming; five same-concept production reviews remain explicitly separate from research prototypes.');
