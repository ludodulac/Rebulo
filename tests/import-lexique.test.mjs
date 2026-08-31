import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const output=path.join(os.tmpdir(),`rebulo-lexique-${process.pid}.json`);
const run=spawnSync(process.execPath,['scripts/import-lexique.mjs','tests/fixtures/lexique4-mini.tsv',output],{encoding:'utf8'});
assert.equal(run.status,0,run.stderr||run.stdout);
const data=JSON.parse(fs.readFileSync(output,'utf8'));
assert.equal(data.count,3);
assert.equal(data.entries[0].word,'merci');
assert.equal(data.entries[0].ipa,'mɛʁsi');
assert.equal(data.entries[0].lemma,'merci');
assert.equal(data.entries[0].pos,'ONO');
assert.equal(data.entries.find(x=>x.word==='rébus').ipa,'ʁebys');
fs.unlinkSync(output);
console.log('Lexique 4 importer: official-style columns passed.');
