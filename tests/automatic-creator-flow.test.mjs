import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildAutomaticCreatorTargets,buildSpatialCreatorTargets,mergeCreatorTargets} from '../src/creator-catalog.js';
import {buildCreatorCandidate,buildGeneralCreatorCandidate} from '../src/creator-runtime.js';

const [coverage,corpus,lexicon,therapy]=await Promise.all([
  readFile(new URL('../data/coverage-report.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/corpus-pilot.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/lexicon-seed.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../data/therapy-targets.json',import.meta.url),'utf8').then(JSON.parse)
]);

const spatialAutomatic=buildSpatialCreatorTargets(coverage);
const automatic=buildAutomaticCreatorTargets(coverage);
const merged=mergeCreatorTargets(corpus.items||[],automatic);

const rate=merged.find(item=>String(item.target).toLowerCase()==='raté');
assert.ok(rate,'raté should be generated from the real coverage report');
assert.equal(rate.mode,'general');
assert.equal(rate.generated,true);
assert.equal(rate.source,'coverage-report-grapheme');
const rateCandidate=buildGeneralCreatorCandidate(rate,lexicon);
assert.ok(rateCandidate,'raté should become a renderable general rebus');
assert.deepEqual(rateCandidate.pieces.map(piece=>piece.operationType),['whole_word','grapheme']);
assert.equal(rateCandidate.pieces[0].label,'rat');
assert.equal(rateCandidate.pieces[1].grapheme,'T');
assert.deepEqual(rateCandidate.construction.capabilities,['general']);
assert.deepEqual(rateCandidate.therapyActivities,[]);

const merci=merged.find(item=>String(item.target).toLowerCase()==='merci');
assert.ok(merci);
assert.equal(merci.mode,'strict','manual/strict merci must remain strict');
const merciCandidate=buildCreatorCandidate(merci,lexicon,therapy.targets||[]);
assert.ok(merciCandidate);
assert.deepEqual(merciCandidate.construction.capabilities,['general','phonetic_strict']);

const souris=merged.find(item=>String(item.target).toLowerCase()==='souris');
assert.ok(souris);
assert.equal(souris.source,'manual-general-spatial-pilot','manual spatial pilot must remain authoritative');

for(const spatial of spatialAutomatic){
  assert.equal(spatial.mode,'general');
  assert.equal(spatial.source,'coverage-report-spatial');
  assert.ok(spatial.operations.some(operation=>operation.type==='spatial_relation'&&operation.relation==='under'));
}

const renderableSpatial=spatialAutomatic
  .map(target=>({target,candidate:buildGeneralCreatorCandidate(target,lexicon)}))
  .filter(item=>item.candidate);
for(const {candidate} of renderableSpatial){
  assert.deepEqual(candidate.construction.capabilities,['general']);
  assert.deepEqual(candidate.therapyActivities,[]);
}

const withAlternatives=automatic.filter(item=>Array.isArray(item.alternatives)&&item.alternatives.length>0);
assert.ok(withAlternatives.every(item=>item.alternatives.every(alternative=>['strict','general'].includes(alternative.mode))));

console.log(`automatic creator flow: raté works; spatial candidates: ${spatialAutomatic.length}; renderable spatial: ${renderableSpatial.length}; automatic alternatives: ${withAlternatives.length}; spatial examples: ${spatialAutomatic.slice(0,5).map(item=>item.target).join(', ')||'none'}.`);