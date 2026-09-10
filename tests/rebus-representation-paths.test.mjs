import assert from 'node:assert/strict';
import {planRepresentationPaths,representationOptionsFromBankRows} from '../src/rebus-representation-paths.js';

const image=(id,label)=>({id,label,image:`${id}.svg`,source:'test'});
const rows=[
  {ipa:'pa',exactImages:[image('pas','pas')]},
  {ipa:'ta',exactImages:[image('tas','tas')]},
  {ipa:'pata',exactImages:[image('patate','patate')]},
  {ipa:'ɛl',letters:['L']},
  {ipa:'ɥit',numbers:['8']},
  {ipa:'le',lightApproximations:[{word:'lait',sourceIpa:'lɛ',tier:'light',percent:15,existingAsset:true,image:'lait.svg'}]},
  {ipa:'kɥijɛʁ',exactImages:[image('cuillere','cuillère')]}
];

const options=representationOptionsFromBankRows(rows);
assert.ok(options.some(item=>item.kind==='image'&&item.label==='pas'));
assert.ok(options.some(item=>item.kind==='letter'&&item.label==='L'));
assert.ok(options.some(item=>item.kind==='number'&&item.label==='8'));
assert.ok(options.some(item=>item.phoneticTier==='light_approximation'&&item.label==='lait'));

const exact=planRepresentationPaths('pata',rows,{mode:'strict',limit:5});
assert.ok(exact.length);
assert.equal(exact[0].complete,true);
assert.equal(exact[0].exact,true);
assert.equal(exact[0].operations.length,1,'a single exact two-syllable-ish image should beat two exact images when both cover the same target');
assert.equal(exact[0].operations[0].label,'patate');
assert.ok(exact.some(route=>route.operations.map(item=>item.label).join('+')==='pas+tas'),'the alternative exact segmentation must remain discoverable');

const crossBoundary=planRepresentationPaths('kɥijɛʁ',rows,{mode:'strict',limit:3});
assert.equal(crossBoundary[0].complete,true);
assert.equal(crossBoundary[0].operations[0].label,'cuillère','continuous IPA planning must not depend on original word boundaries');

const strictLetter=planRepresentationPaths('ɛl',rows,{mode:'strict',limit:3});
assert.equal(strictLetter[0].complete,false,'visible letter conventions must not leak into strict mode');
assert.equal(strictLetter[0].uncoveredUnits,2);
const generalLetter=planRepresentationPaths('ɛl',rows,{mode:'general',limit:3});
assert.equal(generalLetter[0].complete,true);
assert.equal(generalLetter[0].operations[0].kind,'letter');
const generalNumber=planRepresentationPaths('ɥit',rows,{mode:'general',limit:3});
assert.equal(generalNumber[0].complete,true);
assert.equal(generalNumber[0].operations[0].kind,'number');

const approximate=planRepresentationPaths('le',rows,{mode:'general',limit:3});
assert.equal(approximate[0].complete,true);
assert.equal(approximate[0].exact,false);
assert.equal(approximate[0].operations[0].label,'lait');
assert.equal(approximate[0].operations[0].sourceIpa,'lɛ');
assert.equal(approximate[0].operations[0].targetIpa,'le','target and source IPA must remain explicitly distinct');
const strictApproximate=planRepresentationPaths('le',rows,{mode:'strict',limit:3});
assert.equal(strictApproximate[0].complete,false,'light approximations are never strict');

const partial=planRepresentationPaths('paxy',rows,{mode:'general',limit:3});
assert.equal(partial[0].coverageUnits,2);
assert.equal(partial[0].uncoveredUnits,2);
assert.equal(partial[0].complete,false);
assert.equal(partial[0].operations[0].label,'pas');
assert.equal(partial[0].operations.at(-1).kind,'gap');
assert.equal(partial[0].operations.at(-1).targetIpa,'xy','adjacent uncovered units should be coalesced for readable diagnostics');

const again=planRepresentationPaths('pata',rows,{mode:'strict',limit:5});
assert.deepEqual(again,exact,'ranking must be deterministic');

console.log('rebus-representation-paths.test.mjs: continuous IPA paths preserve exact/general boundaries, shifted spans, alternatives and gaps');
