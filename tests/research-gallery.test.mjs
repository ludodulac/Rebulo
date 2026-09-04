import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';

const html=await readFile(new URL('../research-gallery.html',import.meta.url),'utf8');
const js=await readFile(new URL('../research-gallery.js',import.meta.url),'utf8');
const comparisons=JSON.parse(await readFile(new URL('../data/pictogram-prototype-comparisons.json',import.meta.url),'utf8'));
const namingHtml=await readFile(new URL('../naming-test.html',import.meta.url),'utf8');

assert.match(html,/Planche des prototypes/);
assert.match(html,/Recherche seulement/i);
assert.match(html,/Aucun prototype affiché ici n’est activé automatiquement/i);
assert.match(html,/aucune validation clinique/i);
assert.match(html,/naming-test\.html/);
assert.match(js,/pictogram-prototype-comparisons\.json/);
assert.match(js,/Image indisponible — ne pas utiliser ce stimulus/);
assert.doesNotMatch(js,/clinical_approved|active\s*[:=]\s*true/i);
assert.match(namingHtml,/research-gallery\.html/,'naming runner should link to the curator gallery');

const live=comparisons.comparisons.filter(item=>item.activationState==='inactive_until_human_decision');
assert.equal(live.length,5,'gallery should currently expose five research concepts');
assert.equal(live.reduce((sum,item)=>sum+item.candidates.length,0),20,'gallery should currently expose twenty stimuli');
for(const comparison of live){
  assert.equal(comparison.candidates.length,4,`${comparison.concept} should have four gallery candidates`);
  for(const candidate of comparison.candidates){
    assert.ok(candidate.designIntent);
    assert.ok(candidate.provenance);
    assert.ok(candidate.namingRisks.length>0);
    if(!/^https?:/.test(candidate.asset))await access(new URL(`../${candidate.asset}`,import.meta.url));
  }
}

console.log('research gallery: five concepts, twenty stimuli and research-only guardrails ok');
