import assert from 'node:assert/strict';
import fs from 'node:fs';
import {generatedPlayableRebuses,mergePlayableCatalog} from '../src/generated-play-catalog.js';
import {playableRebuses} from '../src/play-game.js';

const coverage=JSON.parse(fs.readFileSync(new URL('../data/coverage-report.json',import.meta.url),'utf8'));
const lexicon=JSON.parse(fs.readFileSync(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));
const manual=JSON.parse(fs.readFileSync(new URL('../data/rebus.json',import.meta.url),'utf8'));

const generated=generatedPlayableRebuses(coverage,lexicon);
assert.equal(generated.length,760,'play mode must expose the full current strict multi-image catalog');
assert.equal(playableRebuses(generated).length,generated.length,'every generated round must be playable');
assert.ok(generated.every(item=>item.generated&&item.validation==='strict'&&item.presentationStatus==='showcase'));
assert.ok(generated.every(item=>item.pieces.length>=2&&item.pieces.length<=4));
for(const word of ['merci','cinéma','parapluie','parasol','délit','tourner']){
  assert.ok(generated.some(item=>item.answer===word),`${word} should be available from generated strict coverage`);
}
const merged=mergePlayableCatalog(manual,generated);
assert.equal(merged.filter(item=>item.answer==='papa').length,1,'historical rounds must not duplicate generated answers');
assert.ok(merged.length>=generated.length);
console.log(`generated play catalog: ${generated.length} strict multi-image rounds exposed to play mode`);
