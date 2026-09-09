import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('data/syllable-identification-contract.json','utf8'));

assert.equal(contract.activityId,'syllable-identification');
assert.equal(contract.eligibility.syllabificationStatus,'source_exact');
assert.equal(contract.eligibility.minimumSyllableCount,2);
assert.equal(contract.eligibility.requiresExplicitUnits,true);
assert.deepEqual(contract.prompts.map(item=>item.position),['initial','final']);
assert.equal(contract.prompts[0].expectedResponseRule,'syllables[0]');
assert.equal(contract.prompts[1].expectedResponseRule,'syllables[syllables.length - 1]');
assert.ok(contract.excluded.some(item=>/medial/i.test(item)),'medial identification must remain excluded until an explicit index is defined');
assert.ok(contract.excluded.some(item=>/syllableCount alone/i.test(item)),'syllable count alone must not activate identification');
assert.ok(contract.excluded.some(item=>/Rebus pieces never/i.test(item)),'rebus pieces must never define syllable boundaries');

const resolve=(syllables,position)=>position==='initial'?syllables[0]:position==='final'?syllables.at(-1):null;
assert.equal(resolve(['mɛʁ','si'],'initial'),'mɛʁ');
assert.equal(resolve(['mɛʁ','si'],'final'),'si');
assert.equal(resolve(['si','ne','ma'],'medial'),null,'the contract must not invent a medial target');

console.log('syllable identification contract: source-exact initial/final positions are explicit and controllable');
