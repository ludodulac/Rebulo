import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeIPA} from '../src/phonetic-engine.js';
import {
  REBULO_VISIBLE_BATCH1,
  mergeVisibleBatch1Lexicon,
  applyVisibleBatch1ToBankRows,
  visibleBatch1Stats
} from '../src/rebulo-visible-batch1-assets.js';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const key=value=>String(value||'').toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');

assert.equal(REBULO_VISIBLE_BATCH1.length,23);
assert.deepEqual(visibleBatch1Stats(),{count:23,oneSyllable:18,twoSyllable:5});
assert.equal(new Set(REBULO_VISIBLE_BATCH1.map(item=>item.id)).size,23);
assert.equal(new Set(REBULO_VISIBLE_BATCH1.map(item=>normalizeIPA(item.ipa))).size,23);
assert.ok(fs.existsSync('assets/visible-batch1/sprite.svg'));

for(const item of REBULO_VISIBLE_BATCH1){
  assert.equal(item.active,true);
  assert.equal(item.strictEligible,true);
  assert.equal(item.spontaneousNamingRisk,'unknown');
  assert.equal(item.humanNamingEvidence,'none');
  assert.equal(item.clinicalEvidence,'none');
  assert.match(item.image,/^assets\/visible-batch1\/sprite\.svg\?asset=/);
  assert.ok(item.sourceCuration);
}

function sourceContainsExactPair(source,item){
  let found=false;
  const visit=value=>{
    if(found||value==null)return;
    if(Array.isArray(value)){for(const child of value)visit(child);return;}
    if(typeof value!=='object')return;
    const ipa=normalizeIPA(value.ipa||value.candidateIpa||'');
    const word=value.word||value.label||value.candidate||'';
    if(ipa===normalizeIPA(item.ipa)&&[key(item.label),key(item.id)].includes(key(word)))found=true;
    for(const child of Object.values(value))visit(child);
  };
  visit(source);
  return found;
}

for(const item of REBULO_VISIBLE_BATCH1){
  const source=read(item.sourceCuration);
  assert.equal(sourceContainsExactPair(source,item),true,`${item.id} must already exist in canonical ${item.sourceCuration}`);
}

const merged=mergeVisibleBatch1Lexicon(read('data/lexicon-seed.json'));
for(const item of REBULO_VISIBLE_BATCH1){
  const entry=merged.find(row=>key(row.id)===key(item.id)||key(row.label)===key(item.label));
  assert.ok(entry,`runtime lexicon should expose ${item.id}`);
  assert.equal(normalizeIPA(entry.ipa),normalizeIPA(item.ipa));
  assert.equal(entry.image,item.image);
  assert.equal(entry.active,true);
}

const bank=applyVisibleBatch1ToBankRows([]);
assert.equal(bank.length,23);
for(const item of REBULO_VISIBLE_BATCH1){
  const row=bank.find(entry=>normalizeIPA(entry.ipa)===normalizeIPA(item.ipa));
  assert.ok(row);
  assert.ok(row.exactImageRepresentations.some(rep=>rep.label===item.label&&rep.image===item.image&&rep.tier==='exact_image_ready'));
}

console.log(JSON.stringify({visibleBatch1:visibleBatch1Stats(),canonicalSources:true,runtimeActivation:true}));
