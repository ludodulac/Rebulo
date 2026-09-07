import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=new URL('..',import.meta.url).pathname;
const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'rebulo-active-dependencies-'));
const lexiquePath=path.join(tempDir,'lexique.json');
const pictogramPath=path.join(tempDir,'pictograms.json');
const output=path.join(tempDir,'report.json');

fs.writeFileSync(lexiquePath,JSON.stringify({source:'fixture',entries:[
  {word:'merci',ipa:'/mɛʁsi/'},
  {word:'cinéma',ipa:'/sinema/'},
  {word:'parasol',ipa:'/paʁasɔl/'},
  {word:'papa',ipa:'/papa/'},
  {word:'mère',ipa:'/mɛʁ/'}
]}));
fs.writeFileSync(pictogramPath,JSON.stringify([
  {id:'mer',label:'mer',ipa:'/mɛʁ/',image:'mer.svg',active:true},
  {id:'scie',label:'scie',ipa:'/si/',image:'scie.svg',active:true},
  {id:'nez',label:'nez',ipa:'/ne/',image:'nez.svg',active:true},
  {id:'mat',label:'mât',ipa:'/ma/',image:'mat.svg',active:true},
  {id:'pas',label:'pas',ipa:'/pa/',image:'pas.svg',active:true},
  {id:'rat',label:'rat',ipa:'/ʁa/',image:'rat.svg',active:true},
  {id:'sol',label:'sol',ipa:'/sɔl/',image:'sol.svg',active:true}
]));

const run=spawnSync(process.execPath,['scripts/analyze-active-dependencies.mjs',lexiquePath,pictogramPath,output],{cwd:root,encoding:'utf8'});
assert.equal(run.status,0,run.stderr||run.stdout);
const report=JSON.parse(fs.readFileSync(output,'utf8'));
fs.rmSync(tempDir,{recursive:true,force:true});

assert.equal(report.schemaVersion,'1.0');
assert.equal(report.baseline.strictMultiPieceUniqueWords,4,'fixture should expose four strict multi-piece words');
assert.equal(report.baseline.activePictogramCount,7);
assert.equal(report.dependencies.length,7);
assert.ok(report.dependencies.every(item=>item.strictUniqueLossIfUnavailable>=0));
assert.ok(report.dependencies.every((item,index,array)=>index===0||array[index-1].strictUniqueLossIfUnavailable>=item.strictUniqueLossIfUnavailable),'dependencies should be ranked by strict unique loss');
const scie=report.dependencies.find(item=>item.id==='scie');
const nez=report.dependencies.find(item=>item.id==='nez');
const rat=report.dependencies.find(item=>item.id==='rat');
assert.equal(scie.strictUniqueLossIfUnavailable,2,'scie must protect merci and cinéma in this fixture');
assert.equal(nez.strictUniqueLossIfUnavailable,1,'nez must protect cinéma');
assert.equal(rat.strictUniqueLossIfUnavailable,1,'rat must protect parasol');
assert.match(report.methodology.clinicalCaution,/validité clinique|dénomination/i);
console.log('active-dependency-report.test.mjs: deterministic strict dependency ranking ok');
