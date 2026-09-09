import assert from 'node:assert/strict';
import {normalizeSessionAnswer,sessionExpectedAnswer,sessionAnswerMatches,safeSessionHint,buildSessionSummary,sessionProgress} from '../src/session-runner.js';

assert.equal(normalizeSessionAnswer(' Cinéma ! '),'cinema');
assert.equal(normalizeSessionAnswer('/ʁ/'),'ʁ','IPA letters must remain gradeable instead of being stripped by ASCII-only normalization');
assert.equal(sessionExpectedAnswer({answer:'cinéma'}),'cinéma');
assert.equal(sessionAnswerMatches('CINEMA',{answer:'cinéma'}),true);
assert.equal(sessionAnswerMatches('cine',{answer:'cinéma'}),false);
const hint=safeSessionHint({answer:'cinéma'});
assert.equal(hint,'Le mot commence par C et contient 6 lettres.');
assert.equal(hint.includes('cinéma'),false);

const controlledSyllable={answer:'merci',activity:{id:'syllable-identification',expectedResponse:'mɛʁ'}};
assert.equal(sessionExpectedAnswer(controlledSyllable),'mɛʁ');
assert.equal(sessionAnswerMatches('/mɛʁ/',controlledSyllable),true,'scalar source-exact activity answers must be graded instead of the whole target word');
assert.equal(sessionAnswerMatches('merci',controlledSyllable),false);
const controlledCount={answer:'merci',activity:{id:'syllable-count',expectedResponse:2}};
assert.equal(sessionExpectedAnswer(controlledCount),'2');
assert.equal(sessionAnswerMatches('2',controlledCount),true);
const sequenceActivity={answer:'merci',activity:{id:'syllable-segmentation',expectedResponse:['mɛʁ','si']}};
assert.equal(sessionExpectedAnswer(sequenceActivity),'merci','array responses keep the historical whole-word fallback until an explicit sequence input contract exists');

const relational={answer:'parapluie',activity:{sessionExpectedResponse:'tas',expectedResponse:'ignored',choices:[{word:'tas'},{word:'pie'}]}};
assert.equal(sessionExpectedAnswer(relational),'tas','explicit relational session answer keeps priority');
assert.equal(sessionAnswerMatches('tas',relational),true);
assert.equal(sessionAnswerMatches('parapluie',relational),false);
assert.equal(safeSessionHint(relational),'Choisis parmi : tas ou pie.');
assert.deepEqual(sessionProgress(1,4),{step:2,total:4,percent:50});
assert.deepEqual(buildSessionSummary([
  {correct:true,hintUsed:false,solutionUsed:false},
  {correct:false,hintUsed:true,solutionUsed:true},
  {correct:true,hintUsed:true,solutionUsed:false}
]),{total:3,correct:2,hints:2,solutions:1});
console.log('session-runner tests: whole-word, scalar controlled and explicit relational answers are graded without inventing sequence semantics');
