import assert from 'node:assert/strict';
import {buildAutomaticCreatorTargets,buildCreatorTargets} from '../src/creator-catalog.js';
import {buildCreatorCandidate} from '../src/creator-runtime.js';

const report={
  constructible:[
    {
      word:'auras',
      ipa:'oʁa',
      lemma:'avoir',
      pos:'VER',
      sourceSyllabification:'o.ʁa',
      syllabification:'o.ʁa',
      syllableCount:2,
      frequency:68.304,
      decomposition:['eau','rat']
    }
  ],
  missingSounds:[]
};

const [strict]=buildCreatorTargets(report);
assert.equal(strict.target,'auras');
assert.equal(strict.lemma,'avoir');
assert.equal(strict.pos,'VER');
assert.equal(strict.sourceSyllabification,'o.ʁa');
assert.equal(strict.mode,'strict');

const automatic=buildAutomaticCreatorTargets(report).find(item=>item.target==='auras');
assert.ok(automatic,'automatic creator must retain the strict auras candidate without silently filtering it');
assert.equal(automatic.lemma,'avoir');
assert.equal(automatic.pos,'VER');
assert.equal(automatic.sourceSyllabification,'o.ʁa');

const lexicon=[
  {id:'eau',label:'eau',ipa:'o',image:'assets/rebus/eau.svg',active:true},
  {id:'rat',label:'rat',ipa:'ʁa',image:'assets/rebus/rat.svg',active:true}
];
const runtime=buildCreatorCandidate(automatic,lexicon,[]);
assert.ok(runtime,'strict automatic target must remain constructible at runtime');
assert.equal(runtime.answer,'auras');
assert.equal(runtime.lemma,'avoir');
assert.equal(runtime.pos,'VER');
assert.equal(runtime.sourceSyllabification,'o.ʁa');

console.log('creator lexical context: source identity survives coverage → creator → runtime without product filtering');
