import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAutomaticCreatorTargets,buildRepetitionCreatorTargets} from '../src/creator-catalog.js';
import {buildGeneralCreatorCandidate} from '../src/creator-runtime.js';
import {supportsConstructionCapability,REBUS_CAPABILITIES} from '../src/rebus-construction.js';

const report=JSON.parse(fs.readFileSync(new URL('../data/coverage-report.json',import.meta.url),'utf8'));
const repetitionTargets=buildRepetitionCreatorTargets(report);

const papaRepetition=repetitionTargets.find(item=>item.target==='papa');
assert.ok(papaRepetition,'the real coverage report should expose papa as pas + pas');
assert.equal(papaRepetition.mode,'general');
assert.equal(papaRepetition.source,'coverage-report-repetition');
assert.deepEqual(papaRepetition.operations,[{type:'repetition',pieceId:'pas',count:2,reading:'pas pas'}]);

const pipiRepetition=repetitionTargets.find(item=>item.target==='pipi');
assert.ok(pipiRepetition,'the real coverage report should expose pipi as pie + pie');
assert.deepEqual(pipiRepetition.operations,[{type:'repetition',pieceId:'pie',count:2,reading:'pie pie'}]);

const automatic=buildAutomaticCreatorTargets(report);
for(const word of ['papa','pipi']){
  const target=automatic.find(item=>item.target===word);
  assert.ok(target,`${word} must remain automatically available`);
  assert.equal(target.mode,'strict',`${word} strict construction must stay primary`);
  const repetition=(target.alternatives||[]).find(item=>item.source==='coverage-report-repetition');
  assert.ok(repetition,`${word} should gain a visible repetition alternative`);
  assert.equal(repetition.mode,'general');
}

const pas={id:'pas',label:'pas',ipa:'/pa/',image:'assets/rebus/pas.svg',active:true};
const generalPapa=buildGeneralCreatorCandidate(papaRepetition,[pas]);
assert.ok(generalPapa);
assert.equal(generalPapa.construction.mode,'general');
assert.equal(generalPapa.pieces[0].operationType,'repetition');
assert.equal(generalPapa.pieces[0].count,2);
assert.equal(generalPapa.pieces[0].reading,'pas pas');
assert.equal(supportsConstructionCapability(generalPapa.construction,REBUS_CAPABILITIES.PHONETIC_STRICT),false,'repetition remains general-only even when derived from an exact strict decomposition');

const synthetic={constructible:[
  {word:'triple',ipa:'aaa',frequency:1,decomposition:['x','x','x']},
  {word:'mixed',ipa:'aab',frequency:1,decomposition:['x','x','y']},
  {word:'single',ipa:'a',frequency:1,decomposition:['x']},
  {word:'too-long',ipa:'aaaaa',frequency:1,decomposition:['x','x','x','x','x']}
]};
const syntheticTargets=buildRepetitionCreatorTargets(synthetic);
assert.deepEqual(syntheticTargets.map(item=>item.target),['triple']);
assert.equal(syntheticTargets[0].operations[0].count,3);

console.log(`repetition alternatives: ${repetitionTargets.length} exact repeated-piece opportunities; strict remains primary.`);
