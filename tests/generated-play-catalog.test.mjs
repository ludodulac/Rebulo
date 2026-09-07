import assert from 'node:assert/strict';
import fs from 'node:fs';
import {generatedPlayableRebuses,mergePlayableCatalog} from '../src/generated-play-catalog.js';
import {playableRebuses} from '../src/play-game.js';

const coverage=JSON.parse(fs.readFileSync(new URL('../data/coverage-report.json',import.meta.url),'utf8'));
const lexicon=JSON.parse(fs.readFileSync(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));
const manual=JSON.parse(fs.readFileSync(new URL('../data/rebus.json',import.meta.url),'utf8'));
const analyzer=fs.readFileSync(new URL('../scripts/analyze-coverage.mjs',import.meta.url),'utf8');

const generated=generatedPlayableRebuses(coverage,lexicon);
assert.equal(playableRebuses(generated).length,generated.length,'every generated round must be playable');
assert.ok(generated.every(item=>item.generated&&item.validation==='strict'&&item.presentationStatus==='showcase'));
assert.ok(generated.every(item=>item.pieces.length>=2&&item.pieces.length<=4));
assert.doesNotMatch(analyzer,/constructibleMultiPiece\.slice\(/,'coverage analysis must not truncate the playable strict multi-image list');
assert.match(analyzer,/constructibleMultiPiece,\n\s*missingSounds/,'coverage report must serialize the complete multi-image list');
for(const word of ['merci','cinéma','parapluie','parasol','délit','tourner']){
  assert.ok(generated.some(item=>item.answer===word),`${word} should be available from generated strict coverage`);
}
const merged=mergePlayableCatalog(manual,generated);
assert.equal(merged.filter(item=>item.answer==='papa').length,1,'historical rounds must not duplicate generated answers');
assert.ok(merged.length>=generated.length);

const serializedComplete=Array.isArray(coverage.constructibleMultiPiece)&&coverage.constructibleMultiPiece.length===coverage.strictMultiPieceCount;
if(serializedComplete){
  assert.equal(generated.length,coverage.strictMultiPieceUniqueWordCount,'complete analysis output must expose every strict multi-image word to play mode');
}else{
  assert.ok(generated.length>=300,'legacy truncated report should still expose substantially more than the 21 historical rounds before regeneration');
}
console.log(`generated play catalog: ${generated.length} strict multi-image rounds exposed; complete=${serializedComplete}`);
