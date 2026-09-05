import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {rankVisualResearchPriorities,summarizeAttestedPieces} from '../src/attested-rebus-evidence.js';

const corpus=JSON.parse(await readFile(new URL('../data/attested-rebus-corpus.json',import.meta.url),'utf8'));
const summary=summarizeAttestedPieces(corpus);
const piece=reading=>summary.find(item=>item.reading===reading);

assert.equal(piece('chat').rebusCount,5);
assert.ok(piece('chat').sourceCount>=2);
assert.equal(piece('pot').rebusCount,4);
assert.equal(piece('dos').rebusCount,4);
assert.equal(piece('do').rebusCount,1);
assert.equal(piece('do').evidenceTier,'single_attestation');
assert.ok(piece('chat').evidenceTier==='repeated_multi_source'||piece('chat').evidenceTier==='multi_source');

const priorities=rankVisualResearchPriorities(corpus);
assert.ok(priorities.length>20);
assert.ok(priorities[0].priorityScore>=priorities.at(-1).priorityScore);
assert.ok(priorities.find(item=>item.reading==='pot').priorityScore>priorities.find(item=>item.reading==='do').priorityScore);
assert.ok(!rankVisualResearchPriorities(corpus,{exclude:['pot']}).some(item=>item.reading==='pot'));

console.log('attested rebus evidence ranking: recurring pieces are derived from corpus');
