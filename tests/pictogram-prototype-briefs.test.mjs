import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const schema=JSON.parse(await readFile(new URL('../data/pictogram-prototype-briefs.schema.json',import.meta.url),'utf8'));
const registry=JSON.parse(await readFile(new URL('../data/pictogram-prototype-briefs.json',import.meta.url),'utf8'));
const shortlist=JSON.parse(await readFile(new URL('../data/pictogram-expansion-shortlist.json',import.meta.url),'utf8'));
const lexicon=JSON.parse(await readFile(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));

assert.equal(registry.schemaVersion,'1.0');
assert.match(schema.description,/not assets, naming results, activation decisions, or clinical validation/i);
const concepts=registry.briefs.map(x=>x.concept);
for(const concept of ['dos','tas','raie','terre'])assert.ok(concepts.includes(concept),`missing prototype brief: ${concept}`);
for(const brief of registry.briefs){
  assert.equal(brief.automaticActivation,false,`${brief.concept} must never auto-activate`);
  assert.ok(brief.namingRisks.length>0,`${brief.concept} must state naming risks`);
  assert.ok(brief.visualGoal.length>10,`${brief.concept} must have a concrete visual goal`);
  const curated=shortlist.items.find(x=>x.label===brief.concept);
  assert.ok(curated,`${brief.concept} must come from the human-curated shortlist`);
  assert.equal(curated.ipa,brief.targetIpa,`${brief.concept} whole-word IPA must stay exact`);
}
const dos=registry.briefs.find(x=>x.concept==='dos');
assert.equal(dos.nextGate,'prototype_comparison');
assert.ok(dos.namingRisks.includes('derrière'));
const registeredDos=lexicon.find(x=>x.id==='dos');
assert.ok(registeredDos,'dos must remain registered as an inactive prototype');
assert.equal(registeredDos.active,false,'a design brief must not activate dos');
for(const concept of ['tas','raie','terre']){
  const item=lexicon.find(x=>x.id===concept);
  if(item)assert.notEqual(item.active,true,`${concept} brief must not silently activate a seed token`);
}
console.log('pictogram prototype briefs: ok');
