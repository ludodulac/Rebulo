import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCreatorCandidate} from '../src/creator-runtime.js';

const lexicon=JSON.parse(fs.readFileSync('data/lexicon-seed.json','utf8'));
const corpus=JSON.parse(fs.readFileSync('data/corpus-pilot.json','utf8'));
const expected=[
  {target:'olive',id:'olive',ipa:'/oliv/'},
  {target:'aiguille',id:'aiguille',ipa:'/egɥij/'},
  {target:'nœud',id:'noeud',ipa:'/nø/'},
  {target:'couteau',id:'couteau',ipa:'/kuto/'}
];

for(const item of expected){
  const target=corpus.items.find(row=>row.target===item.target);
  assert.ok(target,`${item.target} must be exposed as a creator target`);
  assert.equal(target.mode,'strict');
  assert.equal(target.assets,'ready');
  assert.equal(target.targetIpa,item.ipa);
  const piece=lexicon.find(row=>row.id===item.id);
  assert.ok(piece,`${item.id} must be present in the browser runtime lexicon`);
  assert.equal(piece.ipa,item.ipa);
  assert.equal(piece.active,true);
  assert.equal(piece.clinicalStatus,'unreviewed');
  const candidate=buildCreatorCandidate(target,lexicon,[]);
  assert.ok(candidate,`${item.target} must build in the same strict creator runtime used by app.js`);
  assert.equal(candidate.construction.mode,'strict');
  assert.equal(candidate.pieces.length,1);
  assert.equal(candidate.pieces[0].id,item.id);
  assert.equal(candidate.pieces[0].image,piece.image);
}

console.log('creator conversion cohort UI: four registered exact pictograms are visible as one-piece strict creator targets');
