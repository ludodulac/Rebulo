import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';

const reviews=JSON.parse(await readFile(new URL('../data/production-naming-reviews.json',import.meta.url),'utf8'));
const seed=JSON.parse(await readFile(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));
const sources=JSON.parse(await readFile(new URL('../data/asset-sources.json',import.meta.url),'utf8'));
const tour=reviews.reviews.find(item=>item.concept==='tour');
assert.ok(tour);assert.equal(tour.revision,'tour-tower-v1');assert.equal(tour.targetIpa,'/tuʁ/');assert.equal(tour.activationState,'active_general_naming_review');assert.equal(tour.automaticActivation,false);assert.equal(tour.humanDecision,null);assert.equal(tour.candidates.length,1);
const candidate=tour.candidates[0];assert.equal(candidate.asset,'assets/rebus/tour.svg');assert.deepEqual(candidate.namingRisks,['château','donjon','tour de château']);assert.equal(candidate.namingTestStatus,'not_run');assert.match(candidate.provenance,/87ea639b2dd52f301e3581d5a0875ac769a21803/);assert.match(candidate.reviewNote,/ambiguïté de dénomination/);await access(new URL(`../${candidate.asset}`,import.meta.url));
const active=seed.find(item=>item.id==='tour');assert.ok(active);assert.equal(active.label,'tour');assert.equal(active.ipa,'/tuʁ/');assert.equal(active.active,true);assert.equal(active.artRevision,'tour-tower-v1');assert.equal(active.assetSource,'rebulo_original:tour-tower-v1');assert.equal(active.clinicalStatus,'naming_test_required');
const source=sources.assets.find(item=>item.path==='assets/rebus/tour.svg');assert.ok(source);assert.equal(source.source,'rebulo_original');assert.equal(source.sourceCommit,'87ea639b2dd52f301e3581d5a0875ac769a21803');assert.equal(source.artRevision,'tour-tower-v1');assert.equal(source.active,true);assert.equal(source.clinicalStatus,'naming_test_required');
const svg=await readFile(new URL('../assets/rebus/tour.svg',import.meta.url),'utf8');assert.doesNotMatch(svg,/<text\b/i);assert.match(svg,/aria-label="tour"/i);
console.log('tour production naming review: original provenance, exact revision and /tuʁ/ whole-word target stay explicit and non-activating.');
