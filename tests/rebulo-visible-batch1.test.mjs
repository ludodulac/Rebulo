import assert from 'node:assert/strict';
import fs from 'node:fs';
import {REBULO_INDIVIDUAL_VISUALS} from '../src/rebulo-individual-visuals.js';
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
assert.equal(Object.keys(REBULO_INDIVIDUAL_VISUALS).length,20,'individual registry should contain the 18 reviewed batch assets plus recovered clé and olive assets');
assert.deepEqual(Object.keys(REBULO_INDIVIDUAL_VISUALS).filter(id=>!REBULO_VISIBLE_BATCH1.some(item=>item.id===id)).sort(),['cle','olive'],'recovered routed individuals must stay outside the locked 23-concept visible batch');
assert.deepEqual(REBULO_VISIBLE_BATCH1.filter(item=>!item.individualImage).map(item=>item.id),['bebe','oeil','mer','scie','nez'],'unresolved concepts must keep the reviewed sprite fallback set');

for(const item of REBULO_VISIBLE_BATCH1){
  assert.equal(item.active,true);
  assert.equal(item.strictEligible,true);
  assert.equal(item.spontaneousNamingRisk,'unknown');
  assert.equal(item.humanNamingEvidence,'none');
  assert.equal(item.clinicalEvidence,'none');
  const individualPath=REBULO_INDIVIDUAL_VISUALS[item.id]||null;
  if(individualPath){
    assert.equal(item.image,individualPath);
    assert.equal(item.individualImage,individualPath);
    assert.ok(fs.existsSync(individualPath));
    const png=fs.readFileSync(individualPath);
    assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
    assert.equal(png[25],6,'individual visual must be PNG RGBA (colour type 6)');
  }else{
    assert.match(item.image,/^assets\/visible-batch1\/sprite\.svg\?asset=/);
    assert.equal(item.individualImage,null);
  }
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
