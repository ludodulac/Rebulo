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
for(const id of ['pluie','sol','tour','cle','mer','corps','chat','eau','pie']){
  const item=report.queue.find(x=>x.id===id);assert.ok(item,`${id} should stay in the visual migration queue`);assert.equal(item.namingReviewAvailable,true,`${id} should have a revision-bound naming review`);assert.equal(item.nextGate,'collect_human_naming_observations',`${id} should now be ready for real human naming observations`);
}
const mer=report.queue.find(x=>x.id==='mer');assert.equal(mer.strictUniqueLossIfUnavailable,21);assert.equal(mer.provenanceDocumented,true);assert.equal(mer.source,'rebulo_original');assert.equal(mer.artRevision,'mer-sea-v1');
const corps=report.queue.find(x=>x.id==='corps');assert.equal(corps.artRevision,'corps-comic-v1');assert.equal(corps.strictUniqueLossIfUnavailable,37);
const chat=report.queue.find(x=>x.id==='chat');assert.equal(chat.source,'openmoji');assert.equal(chat.artRevision,'chat-openmoji-1f431-v1');assert.equal(chat.strictUniqueLossIfUnavailable,41);
const eau=report.queue.find(x=>x.id==='eau');assert.equal(eau.artRevision,'eau-comic-v1');assert.equal(eau.strictUniqueLossIfUnavailable,51);
const pie=report.queue.find(x=>x.id==='pie');assert.equal(pie.source,'rebulo_original');assert.equal(pie.artRevision,'pie-magpie-v1');assert.equal(pie.strictUniqueLossIfUnavailable,63);
const de=report.queue.find(x=>x.id==='de');assert.ok(de);assert.equal(de.dependencyRisk,'critical');assert.equal(de.strictUniqueLossIfUnavailable,170);assert.equal(de.provenanceDocumented,true);assert.equal(de.artRevision,'de-die-v1');assert.equal(de.nextGate,'add_revision_bound_naming_review');
for(const id of ['mie','mat']){const item=report.queue.find(x=>x.id===id);assert.ok(item);assert.equal(item.provenanceDocumented,true);assert.equal(item.source,'rebulo_original');assert.ok(item.artRevision);assert.equal(item.nextGate,'add_revision_bound_naming_review');}
assert.match(report.methodology.clinicalCaution,/validation clinique|dénomination/i);
console.log('visual migration readiness: first production review wave is ready for human observations; remaining revisions stay explicitly gated.');
