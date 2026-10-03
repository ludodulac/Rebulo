import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('validation-images/index.html','utf8');
const css=fs.readFileSync('validation-images/styles.css','utf8');
const js=fs.readFileSync('validation-images/app.js','utf8');
const manifest=JSON.parse(fs.readFileSync('validation-images/lots/lot-001.json','utf8'));

test('validation-images exposes a reusable 50-image lot route',()=>{
  assert.equal(manifest.schema_version,1);
  assert.equal(manifest.lot_id,'lot-001');
  assert.equal(manifest.candidates.length,50);
  assert.equal(new Set(manifest.candidates.map(item=>item.id)).size,50);
  for(const item of manifest.candidates){
    assert.ok(item.id);
    assert.ok(item.concept);
    assert.match(item.asset,/^\.\.\/assets\//);
  }
  assert.match(html,/Message pour Grand-père/);
  assert.match(html,/COPIER LE COMPTE RENDU/);
});

test('validation state is local and isolated by lot',()=>{
  assert.match(js,/URLSearchParams/);
  assert.match(js,/get\('lot'\)/);
  assert.match(js,/rebulo\.validationImages\./);
  assert.match(js,/localStorage\.getItem/);
  assert.match(js,/localStorage\.setItem/);
});

test('report contains required supervision fields',()=>{
  for(const token of [
    'REBULO-056_IMAGE_VALIDATION_REPORT',
    'LOT_ID',
    'VALIDÉES',
    'REFUSÉES',
    'REMARQUES',
    'MESSAGE POUR GRAND-PÈRE'
  ])assert.match(js,new RegExp(token));
  assert.match(js,/navigator\.clipboard/);
  assert.match(js,/document\.execCommand\('copy'\)/);
});

test('mobile layout keeps touch controls and a single-column card flow',()=>{
  assert.match(css,/overflow-x:hidden/);
  assert.match(css,/min-height:54px/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/grid-template-columns:1fr/);
});
