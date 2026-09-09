import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {buildCreatorTargets,mergeCreatorTargets} from '../src/creator-catalog.js';
import {buildCreatorCandidate} from '../src/creator-runtime.js';
import {normalizeWorksheetSet} from '../src/pdf-export.js';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rebulo-source-syllables-'));
const compactPath=path.join(dir,'lexique.json');
const coveragePath=path.join(dir,'coverage.json');
fs.writeFileSync(compactPath,JSON.stringify({source:'Lexique 4',entries:[
  {word:'merci',lemma:'merci',ipa:'mɛʁsi',frequency:100,syllableCount:2,syllabification:'mɛʁ.si',pos:'ONO'}
]}));
const run=spawnSync(process.execPath,['scripts/analyze-coverage.mjs',compactPath,'data/lexicon-seed.json',coveragePath],{encoding:'utf8'});
assert.equal(run.status,0,run.stderr||run.stdout);
const coverage=JSON.parse(fs.readFileSync(coveragePath,'utf8'));
const coverageMerci=coverage.constructible.find(item=>item.word==='merci');
assert.ok(coverageMerci,'coverage report must serialize constructible merci');
assert.equal(coverageMerci.syllabification,'mɛʁ.si','validated IPA boundaries must survive coverage serialization');

const [generated]=buildCreatorTargets(coverage);
assert.ok(generated,'generated creator catalog must expose merci');
assert.equal(generated.syllableCount,2);
assert.deepEqual(generated.syllables,['mɛʁ','si']);
assert.equal(generated.syllabificationStatus,'source_exact');

const [merged]=mergeCreatorTargets([
  {target:'merci',targetIpa:'/mɛʁsi/',mode:'strict',assets:'ready',therapy:['denomination','oral-to-written'],manualNote:'preserve'}
],[generated]);
assert.equal(merged.manualNote,'preserve','manual editorial data must remain primary');
assert.deepEqual(merged.syllables,['mɛʁ','si'],'compatible generated source boundaries may supplement a manual strict target');
assert.equal(merged.syllabificationStatus,'source_exact');

const lexicon=JSON.parse(fs.readFileSync('data/lexicon-seed.json','utf8'));
const definitions=JSON.parse(fs.readFileSync('data/therapy-targets.json','utf8')).targets;
const candidate=buildCreatorCandidate(merged,lexicon,definitions);
assert.ok(candidate,'source-exact target must remain constructible at runtime');
assert.deepEqual(candidate.syllables,['mɛʁ','si']);
assert.equal(candidate.syllabificationStatus,'source_exact');
const [worksheet]=normalizeWorksheetSet([candidate]);
assert.deepEqual(worksheet.syllables,['mɛʁ','si'],'session/PDF item must preserve source-exact syllables');

const [unsafe]=buildCreatorTargets({constructible:[{word:'cinéma',ipa:'sinema',frequency:50,syllableCount:3,syllabification:'si.ne',decomposition:['scie','nez','mat']}]});
assert.deepEqual(unsafe.syllables,[],'inconsistent boundaries must not become source-exact syllables');
assert.equal(unsafe.syllabificationStatus,'needs_source_review');

fs.rmSync(dir,{recursive:true,force:true});
console.log('source-exact syllables: Lexique coverage → creator catalog → manual merge → runtime → worksheet preserved');
