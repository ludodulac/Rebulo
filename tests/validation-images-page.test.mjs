import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('validation-images/index.html','utf8');
const css=fs.readFileSync('validation-images/styles.css','utf8');
const js=fs.readFileSync('validation-images/app.js','utf8');
const manifest=JSON.parse(fs.readFileSync('validation-images/lots/lot-001.json','utf8'));
const catchup=JSON.parse(fs.readFileSync('validation-images/lots/lot-001-rattrapage.json','utf8'));
const humanReport=JSON.parse(fs.readFileSync('data/image-validation/lot-001-human-2026-10-03.json','utf8'));

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

test('REBULO-057 records the authoritative 50-item lot-001 decision set',()=>{
  assert.equal(humanReport.lot_id,'lot-001');
  assert.deepEqual(humanReport.ui_report,{total:50,validated:26,refused:24,untreated:0});
  assert.deepEqual(humanReport.final_report,{total:50,accepted:26,refused:24,untreated:0});
  assert.equal(humanReport.accepted_ids.length,26);
  assert.equal(humanReport.refused_ids.length,24);
  assert.equal(new Set([...humanReport.accepted_ids,...humanReport.refused_ids]).size,50);
  assert.equal(humanReport.conditional_checks['visible-pomme'].full_object_visible,true);
  assert.equal(humanReport.conditional_checks['visible-porte'].full_object_visible,true);
  assert.equal(humanReport.audit_scope.image_generation_performed,false);
});

test('REBULO-057 catch-up lot contains only four existing replacement candidates',()=>{
  assert.equal(catchup.schema_version,1);
  assert.equal(catchup.lot_id,'lot-001-rattrapage');
  assert.equal(catchup.candidates.length,4);
  assert.deepEqual(catchup.candidates.map(item=>item.id),[
    'catchup-banc-drive-v1',
    'catchup-mer-drive-v1',
    'catchup-the-drive-v1',
    'catchup-carre-drive-blue-v1'
  ]);
  for(const item of catchup.candidates){
    assert.ok(item.source_drive_file_id);
    assert.match(item.asset,/^\.\.\/assets\/validation-candidates\/lot-001-rattrapage\//);
    const localPath=item.asset.replace(/^\.\.\//,'');
    assert.ok(fs.existsSync(localPath),localPath+' must exist');
  }
  const catchupIds=new Set(catchup.candidates.map(item=>item.id));
  for(const rejectedId of humanReport.retired_from_future_validation){
    assert.equal(catchupIds.has(rejectedId),false,rejectedId+' must not re-enter catch-up');
  }
});

test('REBULO-057 preserves the no-regeneration and missing-image conclusions',()=>{
  assert.equal(humanReport.note_do.existing,false);
  assert.deepEqual(humanReport.old_style_exceptions_preserved,[
    'rebus-chat','rebus-cle','rebus-lit','rebus-pluie','rebus-rat'
  ]);
  assert.ok(humanReport.true_missing_pixel_replacements.includes('CORPS'));
  assert.ok(humanReport.true_missing_pixel_replacements.includes('RAIE_POISSON'));
  assert.ok(humanReport.true_missing_pixel_replacements.includes('MIE'));
  assert.equal(humanReport.rejected_existing_candidates.find(x=>x.concept==='MIE').status,'WRONG_CONCEPT_NOT_A_MIE_REPLACEMENT');
});
