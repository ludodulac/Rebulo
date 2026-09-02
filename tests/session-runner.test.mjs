import assert from 'node:assert/strict';
import {normalizeSessionAnswer,sessionAnswerMatches,safeSessionHint,buildSessionSummary,sessionProgress} from '../src/session-runner.js';

assert.equal(normalizeSessionAnswer(' Cinéma ! '),'cinema');
assert.equal(sessionAnswerMatches('CINEMA',{answer:'cinéma'}),true);
assert.equal(sessionAnswerMatches('cine',{answer:'cinéma'}),false);
const hint=safeSessionHint({answer:'cinéma'});
assert.equal(hint,'Le mot commence par C et contient 6 lettres.');
assert.equal(hint.includes('cinéma'),false);
assert.deepEqual(sessionProgress(1,4),{step:2,total:4,percent:50});
assert.deepEqual(buildSessionSummary([
  {correct:true,hintUsed:false,solutionUsed:false},
  {correct:false,hintUsed:true,solutionUsed:true},
  {correct:true,hintUsed:true,solutionUsed:false}
]),{total:3,correct:2,hints:2,solutions:1});
console.log('session-runner tests: ok');
