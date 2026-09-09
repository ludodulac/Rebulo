import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeIPA} from '../src/phonetic-engine.js';

const report=JSON.parse(fs.readFileSync('data/coverage-report.json','utf8'));
const rows=Array.isArray(report.constructible)?report.constructible:[];

const splitSyllables=(value='')=>String(value||'')
  .trim()
  .replace(/^[/\[]|[/\]]$/g,'')
  .split(/[.·‧-]+/)
  .map(normalizeIPA)
  .filter(Boolean);

let exact=0;
let needsReview=0;
const failures=[];
for(const row of rows){
  const syllables=splitSyllables(row.syllabification);
  if(!syllables.length){
    needsReview+=1;
    continue;
  }
  exact+=1;
  const joined=normalizeIPA(syllables.join(''));
  const target=normalizeIPA(row.ipa||'');
  if(joined!==target)failures.push(`${row.word}: ${syllables.join('.')} != ${target}`);
  if(Number.isInteger(row.syllableCount)&&row.syllableCount>0&&syllables.length!==row.syllableCount){
    failures.push(`${row.word}: ${syllables.length} syllables != count ${row.syllableCount}`);
  }
}

assert.ok(rows.length>0,'coverage report must contain constructible rows');
assert.equal(failures.length,0,`source-exact coverage rows must reconstruct target IPA and agree with source count:\n${failures.slice(0,10).join('\n')}`);
assert.ok(exact>0,'coverage report must expose source-exact syllabifications');

console.log(`source-exact coverage integrity: ${exact}/${rows.length} constructible rows exact, ${needsReview} without promoted boundaries`);
