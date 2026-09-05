import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const data=JSON.parse(await readFile(new URL('../data/visual-research-candidates.json',import.meta.url),'utf8'));
assert.equal(data.status,'research_only');
assert.equal(data.guardrails.automaticLexiconActivation,false);
assert.equal(data.guardrails.automaticStrictEligibility,false);
assert.equal(data.guardrails.humanNamingValidationRequired,true);
assert.equal(data.candidates.length,3);
const candidate=reading=>data.candidates.find(item=>item.reading===reading);
for(const reading of ['tas','pot','do']) assert.equal(candidate(reading).activationState,'inactive');
assert.equal(candidate('tas').researchRevision,'tas-v2-research');
assert.equal(candidate('pot').researchRevision,'pot-v4-research');
assert.equal(candidate('do').ipa,'do');
assert.ok(candidate('do').alternativeRepresentations.includes('dos'));
assert.match(candidate('do').visualHypothesis,/rather than generic note/);
assert.match(candidate('tas').visualHypothesis,/never a phonetic component/);
console.log('visual research candidates: three isolated bricks with strict guardrails');
