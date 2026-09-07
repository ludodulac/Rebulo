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
const pluie=report.queue.find(x=>x.id==='pluie');assert.ok(pluie);assert.equal(pluie.strictUniqueLossIfUnavailable,2);assert.equal(pluie.dependencyRisk,'low');assert.equal(pluie.provenanceDocumented,true);assert.equal(pluie.revisionStamped,true);assert.equal(pluie.namingReviewAvailable,true);assert.equal(pluie.nextGate,'collect_human_naming_observations');
const cle=report.queue.find(x=>x.id==='cle');assert.ok(cle);assert.equal(cle.strictUniqueLossIfUnavailable,21);assert.equal(cle.provenanceDocumented,true);assert.equal(cle.artRevision,'cle-openmoji-1f511-v1');assert.equal(cle.namingReviewAvailable,true);assert.equal(cle.nextGate,'collect_human_naming_observations');
for(const id of ['sol','tour','mer']){const item=report.queue.find(x=>x.id===id);assert.ok(item);assert.equal(item.provenanceDocumented,false);assert.equal(item.nextGate,'document_provenance');}
const de=report.queue.find(x=>x.id==='de');assert.ok(de);assert.equal(de.dependencyRisk,'critical');assert.equal(de.strictUniqueLossIfUnavailable,170);
assert.match(report.methodology.clinicalCaution,/validation clinique|dénomination/i);
console.log('visual migration readiness: dependency risk, provenance, revision and naming-review gates stay explicit.');
