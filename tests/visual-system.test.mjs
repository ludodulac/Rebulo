import assert from 'node:assert/strict';
import fs from 'node:fs';
const visual=JSON.parse(fs.readFileSync(new URL('../data/visual-system.json',import.meta.url)));
const lexicon=JSON.parse(fs.readFileSync(new URL('../data/lexicon-seed.json',import.meta.url)));
const registry=JSON.parse(fs.readFileSync(new URL('../data/asset-sources.json',import.meta.url)));
const game=JSON.parse(fs.readFileSync(new URL('../data/rebus.json',import.meta.url)));
assert.equal(visual.targetStyle.textInsideAsset,'forbidden_unless_the_concept_is_a_grapheme');
const active=lexicon.filter(item=>item.active).map(item=>item.id);
const audited=new Set(visual.audit.map(item=>item.id));
for(const id of active) assert.ok(audited.has(id),`active pictogram ${id} must be visually audited`);
for(const id of ['scie','nez','rat']){
  assert.equal(visual.audit.find(item=>item.id===id)?.status,'reference_style');
  const record=registry.assets.find(asset=>asset.concept===id);
  assert.equal(record?.source,'openmoji');
  assert.equal(record?.sourceCommit,'aeb8bb3a59e2de39c754ac79180c8131c906acea');
  assert.notEqual(record?.clinicalStatus,'clinical_approved');
}
const sol=visual.audit.find(item=>item.id==='sol');
assert.equal(sol.status,'keep_then_harmonize');
assert.match(sol.reason,/supprimée/i);
for(const item of visual.audit) assert.ok(['redesign_priority','keep_then_harmonize','reference_style'].includes(item.status));
const strictImages=new Set(game.filter(item=>item.validation==='strict').flatMap(item=>item.pieces.map(piece=>piece.image)));
for(const image of strictImages){
  const svg=fs.readFileSync(new URL(`../${image}`,import.meta.url),'utf8');
  assert.doesNotMatch(svg,/<text\b/i,`${image} must not contain written answer text in strict game mode`);
}
console.log('Rebulo visual system audit: all tests passed.');
