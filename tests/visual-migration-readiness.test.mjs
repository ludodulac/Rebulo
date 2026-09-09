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
const pluie=report.queue.find(x=>x.id==='pluie');assert.ok(pluie);assert.equal(pluie.strictUniqueLossIfUnavailable,2);assert.equal(pluie.nextGate,'collect_human_naming_observations');
const sol=report.queue.find(x=>x.id==='sol');assert.ok(sol);assert.equal(sol.strictUniqueLossIfUnavailable,10);assert.equal(sol.source,'rebulo_original');assert.equal(sol.artRevision,'sol-note-v2');assert.equal(sol.nextGate,'collect_human_naming_observations');
const tour=report.queue.find(x=>x.id==='tour');assert.ok(tour);assert.equal(tour.strictUniqueLossIfUnavailable,18);assert.equal(tour.dependencyRisk,'moderate');assert.equal(tour.provenanceDocumented,true);assert.equal(tour.source,'rebulo_original');assert.equal(tour.artRevision,'tour-tower-v1');assert.equal(tour.namingReviewAvailable,true);assert.equal(tour.nextGate,'collect_human_naming_observations');
const cle=report.queue.find(x=>x.id==='cle');assert.ok(cle);assert.equal(cle.strictUniqueLossIfUnavailable,21);assert.equal(cle.artRevision,'cle-openmoji-1f511-v1');assert.equal(cle.nextGate,'collect_human_naming_observations');
const mer=report.queue.find(x=>x.id==='mer');assert.ok(mer);assert.equal(mer.provenanceDocumented,true);assert.equal(mer.source,'rebulo_original');assert.equal(mer.artRevision,'mer-sea-v1');assert.equal(mer.namingReviewAvailable,false);assert.equal(mer.nextGate,'add_revision_bound_naming_review');
const de=report.queue.find(x=>x.id==='de');assert.ok(de);assert.equal(de.dependencyRisk,'critical');assert.equal(de.strictUniqueLossIfUnavailable,170);assert.equal(de.provenanceDocumented,true);assert.equal(de.artRevision,'de-die-v1');assert.equal(de.nextGate,'add_revision_bound_naming_review');
for(const id of ['pie','mie','mat']){const item=report.queue.find(x=>x.id===id);assert.ok(item);assert.equal(item.provenanceDocumented,true);assert.equal(item.source,'rebulo_original');assert.ok(item.artRevision);assert.equal(item.nextGate,'add_revision_bound_naming_review');}
assert.match(report.methodology.clinicalCaution,/validation clinique|dénomination/i);
console.log('visual migration readiness: recovered provenance now advances to revision-bound naming review without implying human validation.');
