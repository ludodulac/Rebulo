import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('validation-graphiques.html','utf8');
const css=fs.readFileSync('validation-graphiques.css','utf8');
const js=fs.readFileSync('validation-graphiques.js','utf8');
const manifest=JSON.parse(fs.readFileSync('data/graphic-validation-candidates.json','utf8'));

test('graphic validation starts with no fake candidates',()=>{
  assert.equal(manifest.schema_version,1);
  assert.deepEqual(manifest.candidates,[]);
  assert.match(html,/Aucun nouveau dessin à valider pour le moment/);
});

test('graphic validation keeps decisions locally and exports stable JSON',()=>{
  assert.match(js,/rebulo\.graphicValidation\.v1/);
  assert.match(js,/localStorage\.getItem/);
  assert.match(js,/localStorage\.setItem/);
  assert.match(js,/schema_version:1/);
  for(const field of ['concept','asset','decision','comment','decided_at'])assert.match(js,new RegExp(field));
  assert.match(html,/EXPORTER MES VALIDATIONS/);
  assert.match(js,/rebulo-validations-graphiques\.json/);
});

test('mobile layout prevents horizontal overflow and provides touch controls',()=>{
  assert.match(css,/overflow-x:hidden/);
  assert.match(css,/min-height:56px/);
  assert.match(css,/@media\(max-width:420px\)/);
  assert.match(css,/grid-template-columns:1fr/);
});

test('redo exposes the requested free comment field',()=>{
  assert.match(js,/current\.decision!=='redo'/);
  assert.match(js,/Qu'est-ce qu'il faut changer \?/);
});
