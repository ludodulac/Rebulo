import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {normalizeIPA} from '../src/phonetic-engine.js';

const report=JSON.parse(fs.readFileSync('data/coverage-report.json','utf8'));
const rows=Array.isArray(report.constructible)?report.constructible:[];
const splitSyllables=(value='')=>String(value||'').trim().replace(/^[/\[]|[/\]]$/g,'').split(/[.·‧-]+/).map(normalizeIPA).filter(Boolean);
let exact=0;let needsReview=0;const failures=[];
for(const row of rows){const syllables=splitSyllables(row.syllabification);if(!syllables.length){needsReview+=1;continue;}exact+=1;const joined=normalizeIPA(syllables.join(''));const target=normalizeIPA(row.ipa||'');if(joined!==target)failures.push(`${row.word}: ${syllables.join('.')} != ${target}`);if(Number.isInteger(row.syllableCount)&&row.syllableCount>0&&syllables.length!==row.syllableCount)failures.push(`${row.word}: ${syllables.length} syllables != count ${row.syllableCount}`);}
assert.ok(rows.length>0,'coverage report must contain constructible rows');
assert.equal(failures.length,0,`source-exact coverage rows must reconstruct target IPA and agree with source count:\n${failures.slice(0,10).join('\n')}`);
assert.ok(exact>0,'coverage report must expose source-exact syllabifications');

// Regression: coverage generation must not erase lexical identity before creator filtering/ranking.
// This deliberately tests an inflected form like the observed "auras" case without deciding here
// whether the product should expose or reject it.
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rebulo-coverage-'));
try{
  const lexiquePath=path.join(tmp,'lexique.json');const pictogramPath=path.join(tmp,'pictograms.json');const outputPath=path.join(tmp,'coverage.json');
  fs.writeFileSync(lexiquePath,JSON.stringify({source:'fixture',entries:[{word:'auras',lemma:'avoir',ipa:'oʁa',frequency:68.304,pos:'VER',syllableCount:2,syllabification:'o.ʁa',sourceSyllabification:'o-Ra'}]}));
  fs.writeFileSync(pictogramPath,JSON.stringify([{id:'eau',label:'eau',ipa:'o',active:true},{id:'rat',label:'rat',ipa:'ʁa',active:true}]));
  const run=spawnSync(process.execPath,['scripts/analyze-coverage.mjs',lexiquePath,pictogramPath,outputPath],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||run.stdout);
  const generated=JSON.parse(fs.readFileSync(outputPath,'utf8'));
  const auras=generated.constructibleMultiPiece.find(row=>row.word==='auras');
  assert.ok(auras,'fixture must remain phonologically constructible');
  assert.equal(auras.lemma,'avoir');
  assert.equal(auras.pos,'VER');
  assert.equal(auras.sourceSyllabification,'o-Ra');
  assert.match(generated.methodology.lexicalContext,/lemme/i);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}

console.log(`source-exact coverage integrity: ${exact}/${rows.length} constructible rows exact, ${needsReview} without promoted boundaries; lexical context preserved`);
