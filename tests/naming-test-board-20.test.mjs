import assert from 'node:assert/strict';
import fs from 'node:fs';

const board = JSON.parse(fs.readFileSync('data/naming-test-board-20.json', 'utf8'));

assert.equal(board.status, 'research_only');
assert.equal(board.administration.recordFirstSpontaneousResponseOnly, true);
assert.equal(board.administration.noHintBeforeResponse, true);
assert.equal(board.administration.automaticActivation, false);
assert.equal(board.items.length, 20);

const ids = board.items.map(item => item.id);
assert.equal(new Set(ids).size, 20, 'item IDs must be unique');
assert.deepEqual(ids, Array.from({ length: 20 }, (_, index) => String(index + 1).padStart(2, '0')));

const candidateIds = board.items.map(item => item.candidateId);
assert.equal(new Set(candidateIds).size, 20, 'candidate IDs must be unique');

for (const item of board.items) {
  assert.ok(fs.existsSync(item.asset), `missing naming stimulus: ${item.asset}`);
  assert.match(item.asset, /\.svg$/i, `stimulus must remain an SVG asset: ${item.asset}`);
}

for (let index = 1; index < board.items.length; index += 1) {
  assert.notEqual(
    board.items[index].concept,
    board.items[index - 1].concept,
    `adjacent items ${board.items[index - 1].id}/${board.items[index].id} repeat the same concept`
  );
}

const conceptCounts = board.items.reduce((counts, item) => {
  counts[item.concept] = (counts[item.concept] || 0) + 1;
  return counts;
}, {});

assert.deepEqual(conceptCounts, { raie: 4, pot: 4, dos: 4, terre: 4, tas: 4 });

console.log('naming-test-board-20: OK');
