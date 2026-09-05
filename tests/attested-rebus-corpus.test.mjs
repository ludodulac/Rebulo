import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const corpus=JSON.parse(await readFile(new URL('../data/attested-rebus-corpus.json',import.meta.url),'utf8'));
assert.equal(corpus.schemaVersion,'1.0');
assert.equal(corpus.status,'research_evidence_only');
assert.ok(corpus.sources.length>=4);
assert.ok(corpus.attestedRebuses.length>=25);
const sourceIds=new Set(corpus.sources.map(source=>source.id));
for(const rebus of corpus.attestedRebuses){
  assert.ok(rebus.answer);assert.ok(rebus.pieces.length>=2);assert.ok(rebus.sourceIds.length>=1);
  for(const sourceId of rebus.sourceIds)assert.ok(sourceIds.has(sourceId),`unknown source ${sourceId}`);
}
const piece=reading=>corpus.pieceEvidence.find(item=>item.reading===reading);
assert.equal(piece('pot').evidenceCount,3);
assert.deepEqual(piece('pot').attestedIn.sort(),['chapeau','drapeau','poney']);
assert.deepEqual(piece('dos').attestedIn.sort(),['domino','rideau']);
assert.deepEqual(piece('Terre').attestedIn,['solitaire']);
for(const uncertain of ['tas','raie','do'])assert.equal(piece(uncertain).evidenceCount,0,`${uncertain} must not be promoted without attestation`);
assert.equal(corpus.guardrails.automaticLexiconActivation,false);
assert.equal(corpus.guardrails.clinicalValidation,false);
assert.equal(corpus.guardrails.strictModeEligibilityFromAttestationAlone,false);
assert.equal(corpus.guardrails.partialHiddenReadingAllowedInStrictMode,false);
console.log('attested rebus corpus: sourced evidence and strict guardrails ok');
