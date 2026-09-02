import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PLAYFUL_PHRASES,buildPhrasePlan} from '../src/phrase-creator.js';
import {OPEN_PICTOGRAMS} from '../src/open-pictogram-library.js';

assert.ok(PLAYFUL_PHRASES.length>=100,'phrase discovery should feel like a real magazine-sized library');
assert.equal(new Set(PLAYFUL_PHRASES).size,PLAYFUL_PHRASES.length);

const strictPiece=OPEN_PICTOGRAMS.find(item=>item.strictEligible!==false);
const strictPlan=buildPhrasePlan(`un ${strictPiece.label}`,[],[strictPiece],[]);
assert.equal(strictPlan.rebusCount,2);
assert.equal(strictPlan.tokens.find(token=>token.kind==='symbol')?.symbol,'1');
assert.equal(strictPlan.tokens.find(token=>token.kind==='rebus')?.mode,'strict');

const generalPiece=OPEN_PICTOGRAMS.find(item=>item.strictEligible===false);
const generalPlan=buildPhrasePlan(`deux ${generalPiece.label}`,[],[generalPiece],[]);
assert.equal(generalPlan.tokens.find(token=>token.kind==='symbol')?.symbol,'2');
assert.equal(generalPlan.tokens.find(token=>token.kind==='rebus')?.mode,'general','ambiguous direct illustrations must not claim strictness');
assert.equal(generalPlan.tokens.find(token=>token.kind==='rebus')?.candidate.construction.source,'direct_illustration');

const bootstrap=fs.readFileSync(new URL('../src/app-bootstrap.js',import.meta.url),'utf8');
assert.match(bootstrap,/\.rebus \.plus,\.play-rebus \.plus,\.session-runner \.plus\{display:none!important\}/,'visual rebuses should no longer show mechanical plus signs');
assert.match(bootstrap,/mergeOpenPictograms/);
console.log(`magazine phrase library: ${PLAYFUL_PHRASES.length} phrases`);