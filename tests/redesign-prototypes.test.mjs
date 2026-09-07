import assert from 'node:assert/strict';
import fs from 'node:fs';

const registry=JSON.parse(fs.readFileSync(new URL('../data/redesign-prototypes.json',import.meta.url),'utf8'));
assert.equal(registry.schemaVersion,'1.0');
assert.equal(registry.status,'research_only');
assert.match(registry.purpose,/syllabes|lectures/i);
assert.match(registry.activationPolicy,/Aucun prototype ne remplace/);
assert.equal(registry.items.length,4);

const byConcept=new Map(registry.items.map(item=>[item.concept,item]));
assert.equal(byConcept.get('mât')?.ipa,'/ma/');
assert.match(byConcept.get('mât')?.visualDirection,/flèche vers le mât/);
assert.equal(byConcept.get('cor')?.ipa,'/kɔʁ/');
assert.match(byConcept.get('cor')?.currentIssue,/homme|garçon|personne/);
assert.match(byConcept.get('tas')?.visualDirection,/feuilles/);
assert.match(byConcept.get('tas')?.currentIssue,/terre/);
assert.match(byConcept.get('tour')?.visualDirection,/jeu d'échecs/);

for(const item of registry.items){
  assert.ok(item.asset.startsWith('assets/research/'),`${item.concept} must stay research-only`);
  const svg=fs.readFileSync(new URL(`../${item.asset}`,import.meta.url),'utf8');
  assert.doesNotMatch(svg,/<text\b/i,`${item.asset} must not contain the written answer`);
  assert.doesNotMatch(svg,/<image\b/i,`${item.asset} must be self-contained vector artwork`);
  assert.doesNotMatch(svg,/http(s)?:\/\//i,`${item.asset} must not load external resources`);
}
console.log('redesign-prototypes: syllable prototypes are research-only and text-free');
