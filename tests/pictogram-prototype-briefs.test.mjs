import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const schema=JSON.parse(await readFile(new URL('../data/pictogram-prototype-briefs.schema.json',import.meta.url),'utf8'));
const registry=JSON.parse(await readFile(new URL('../data/pictogram-prototype-briefs.json',import.meta.url),'utf8'));
const shortlist=JSON.parse(await readFile(new URL('../data/pictogram-expansion-shortlist.json',import.meta.url),'utf8'));
const lexicon=JSON.parse(await readFile(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));

assert.equal(registry.schemaVersion,'1.0');
assert.match(schema.description,/not assets, naming results, activation decisions, or clinical validation/i);
assert.ok(schema.$defs.brief.properties.revision,'brief schema should allow an exact research revision');
assert.ok(schema.$defs.brief.properties.supersededBy,'brief schema should preserve supersession lineage');
assert.ok(schema.$defs.brief.properties.variantHypotheses,'brief schema should support contrasting visual hypotheses');
assert.ok(schema.$defs.brief.properties.blindNamingPlan,'brief schema should support an explicit blind naming plan');
const concepts=registry.briefs.map(x=>x.concept);
for(const concept of ['dos','tas','raie','terre','haie','oie','or','tee','anse','as','heure'])assert.ok(concepts.includes(concept),`missing prototype brief: ${concept}`);
for(const brief of registry.briefs){
  assert.equal(brief.automaticActivation,false,`${brief.concept} must never auto-activate`);
  assert.ok(brief.namingRisks.length>0,`${brief.concept} must state naming risks`);
  assert.ok(brief.visualGoal.length>10,`${brief.concept} must have a concrete visual goal`);
  const curated=shortlist.items.find(x=>x.label===brief.concept);
  assert.ok(curated,`${brief.concept} must come from the human-curated shortlist`);
  assert.equal(curated.ipa,brief.targetIpa,`${brief.concept} whole-word IPA must stay exact`);
}
for(const concept of ['haie','oie','or','tee','anse','as']){
  const curated=shortlist.items.find(x=>x.label===concept);
  const brief=registry.briefs.find(x=>x.concept===concept);
  assert.equal(curated.status,'research_candidate',`${concept} must remain research-only`);
  assert.equal(curated.activation,'not_ready',`${concept} must not activate from a prototype brief`);
  assert.equal(curated.assetStatus,'not_created',`${concept} must not claim an asset before prototype generation`);
  assert.equal(brief.researchStatus,'prototype_design');
  assert.equal(brief.nextGate,'prototype_comparison');
}
const heure=registry.briefs.find(x=>x.concept==='heure');
const heureShortlist=shortlist.items.find(x=>x.label==='heure');
assert.equal(heure.targetIpa,'/œʁ/');
assert.equal(heure.revision,'heure-scene-research-v1');
assert.equal(heure.researchStatus,'prototype_design');
assert.equal(heure.nextGate,'naming_test_plan');
assert.equal(heureShortlist.status,'research_candidate');
assert.equal(heureShortlist.activation,'not_ready');
assert.equal(heureShortlist.assetStatus,'not_created');
assert.equal(heureShortlist.clinicalStatus,'naming_test_required');
assert.equal(heure.variantHypotheses.length,2,'heure must compare two visual hypotheses before any visual promotion');
assert.notEqual(heure.variantHypotheses[0].id,heure.variantHypotheses[1].id);
assert.match(heure.blindNamingPlan.presentation,/sans mot|without word/i);
assert.match(heure.blindNamingPlan.prompt,/qu'est-ce que tu vois/i);
assert.equal(heure.blindNamingPlan.activationEffect,'none_without_explicit_human_review');
assert.ok(heure.namingRisks.includes('horloge'));
assert.ok(heure.namingRisks.includes('montre'));
const dos=registry.briefs.find(x=>x.concept==='dos');
assert.equal(dos.nextGate,'prototype_comparison');
assert.ok(dos.namingRisks.includes('derrière'));
const terre=registry.briefs.find(x=>x.concept==='terre');
assert.equal(terre.revision,'terre-v1');
assert.equal(terre.supersededBy,'terre-v2-research');
assert.equal(terre.researchStatus,'naming_review');
assert.match(terre.visualGoal,/historique|historical/i);
assert.match(terre.visualGoal,/terre-v2-research/);

// Briefs never auto-activate anything. Later explicit product-owner approval can
// activate a different production revision without mutating these historical briefs.
for(const concept of ['dos','raie','terre']){
  const item=lexicon.find(x=>x.id===concept);
  assert.ok(item,`${concept} must exist after explicit general approval`);
  assert.equal(item.active,true);
  assert.equal(item.prototypeStatus,'general_owner_approved');
  assert.equal(item.clinicalStatus,'unreviewed');
}
const tas=lexicon.find(x=>x.id==='tas');
assert.ok(tas,'tas may be explicitly activated as a newer production revision');
assert.equal(tas.active,true);
assert.equal(tas.artRevision,'tas-comic-v1');
assert.equal(tas.prototypeStatus,'general_owner_approved');
assert.equal(tas.clinicalStatus,'naming_test_required');
assert.notEqual(tas.artRevision,registry.briefs.find(x=>x.concept==='tas')?.revision,'historical tas brief must remain distinct from production comic revision');
console.log('pictogram prototype briefs: heure has two blind naming variants while historical research stays separate from activation');
