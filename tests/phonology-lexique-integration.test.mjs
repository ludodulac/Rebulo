import fs from 'node:fs';
import assert from 'node:assert/strict';
import {filterLexicalEntries,lexicalSoundStats} from '../src/lexical-sound-index.js';

const report=JSON.parse(fs.readFileSync('data/coverage-report.json','utf8'));
assert.equal(report.source,'Lexique 4');
assert.ok(Array.isArray(report.constructible));
assert.ok(report.constructible.length>300);

const stats=lexicalSoundStats(report.constructible);
assert.ok(stats.entries>250);
assert.ok(stats.phonemes>10);

const medialR=filterLexicalEntries(report.constructible,{phoneme:'ʁ',position:'medial',limit:100});
assert.ok(medialR.length>0);
assert.ok(medialR.every(entry=>entry.phonemes.slice(1,-1).includes('ʁ')));

const merci=filterLexicalEntries(report.constructible,{query:'merci',limit:20});
assert.ok(merci.some(entry=>entry.word.toLocaleLowerCase('fr')==='merci'));
assert.ok(merci.some(entry=>entry.decomposition.includes('mer')&&entry.decomposition.includes('scie')));
console.log('phonology atlas ↔ Lexique 4 context: ok');
