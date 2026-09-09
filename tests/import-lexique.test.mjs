import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function importFixture(fixture,name){
  const output=path.join(os.tmpdir(),`rebulo-lexique-${name}-${process.pid}.json`);
  const run=spawnSync(process.execPath,['scripts/import-lexique.mjs',fixture,output],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||run.stdout);
  const data=JSON.parse(fs.readFileSync(output,'utf8'));
  fs.unlinkSync(output);
  return data;
}

const data=importFixture('tests/fixtures/lexique4-mini.tsv','mini');
assert.equal(data.count,3);
assert.equal(data.entries[0].word,'merci');
assert.equal(data.entries[0].ipa,'mɛʁsi');
assert.equal(data.entries[0].lemma,'merci');
assert.equal(data.entries[0].pos,'ONO');
assert.equal(data.entries[0].syllableCount,2);
assert.equal(data.entries[0].syllabification,'mɛʁ.si');
assert.equal(data.entries[0].sourceSyllabification,null);
assert.equal(data.entries.find(x=>x.word==='cinéma').syllableCount,3);
assert.equal(data.entries.find(x=>x.word==='cinéma').syllabification,'si.ne.ma');
assert.equal(data.entries.find(x=>x.word==='rébus').ipa,'ʁebys');
assert.equal(data.entries.find(x=>x.word==='rébus').syllableCount,2);
assert.equal(data.entries.find(x=>x.word==='rébus').syllabification,'ʁe.bys');

const official=importFixture('tests/fixtures/lexique4-official-header-mini.tsv','official');
const maison=official.entries.find(x=>x.word==='maison');
const cinema=official.entries.find(x=>x.word==='cinéma');
assert.equal(maison.syllableCount,2,'26_SyllNb must be imported');
assert.equal(cinema.syllableCount,3,'official SyllNb must drive target preselection');
assert.equal(maison.syllabification,null,'25_SyllPhono is legacy Lexique notation, not IPA syllabification');
assert.equal(maison.sourceSyllabification,'mE-z§','25_SyllPhono must be preserved separately as source boundary evidence');
assert.equal(cinema.sourceSyllabification,'si-ne-ma');

console.log('Lexique 4 importer: compact fixture, official SyllNb and source SyllPhono preservation passed.');
