import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const registry=JSON.parse(await readFile(new URL('../data/pictogram-prototype-comparisons.json',import.meta.url),'utf8'));
const comparisons=(registry.comparisons||[]).filter(item=>item.activationState==='inactive_until_human_decision');
const candidates=comparisons.flatMap(item=>(item.candidates||[]).map(candidate=>({...candidate,concept:item.concept})));

assert.equal(candidates.length,20,'the active research gallery should currently expose twenty stimuli');
for(const candidate of candidates){
  assert.match(candidate.asset,/\.svg$/i,`${candidate.candidateId} should use an SVG research stimulus`);
  assert.doesNotMatch(candidate.asset,/^https?:/i,`${candidate.candidateId} should be served locally`);
  const svg=await readFile(new URL(`../${candidate.asset}`,import.meta.url),'utf8');
  assert.match(svg,/^\s*<svg\b/i,`${candidate.candidateId} must be an SVG document`);
  assert.match(svg,/\bviewBox\s*=\s*["'][^"']+["']/i,`${candidate.candidateId} must define a viewBox for consistent scaling`);
  assert.doesNotMatch(svg,/<text\b/i,`${candidate.candidateId} must not contain visible text that can cue a response`);
  assert.doesNotMatch(svg,/<script\b|<foreignObject\b/i,`${candidate.candidateId} must stay inert and self-contained`);
  assert.doesNotMatch(svg,/(?:href|xlink:href)\s*=\s*["']https?:|url\(\s*["']?https?:/i,`${candidate.candidateId} must not load external resources`);
  assert.doesNotMatch(svg,/javascript\s*:/i,`${candidate.candidateId} must not contain executable URLs`);
}

const ids=candidates.map(item=>item.candidateId);
assert.equal(new Set(ids).size,ids.length,'research stimulus IDs must remain unique');
console.log(`research stimulus integrity: ${candidates.length} local SVGs are text-free, scalable and self-contained.`);
