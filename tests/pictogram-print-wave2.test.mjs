import assert from 'node:assert/strict';
import {ALL_OPEN_PICTOGRAMS,buildIndexedPictograms,pictogramIndexCsv,printLibraryMeta} from '../src/pictogram-print-sheets.js';

const indexed=buildIndexedPictograms();
const meta=printLibraryMeta();
assert.ok(ALL_OPEN_PICTOGRAMS.length>=200,`expected at least 200 open pictograms, got ${ALL_OPEN_PICTOGRAMS.length}`);
assert.equal(indexed.length,ALL_OPEN_PICTOGRAMS.length);
assert.ok(meta.count>=200);
assert.ok(meta.pages>=10);
assert.ok(indexed.some(item=>item.indexId==='RBL-seau'&&item.label==='seau'));
assert.ok(indexed.some(item=>item.indexId==='RBL-elephant'&&item.label==='éléphant'));
const csv=pictogramIndexCsv();
assert.match(csv,/RBL-seau,seau,seau,\/so\//);
assert.match(csv,/RBL-elephant,elephant,éléphant,\/elefɑ̃\//);
console.log('pictogram print wave 2 sync: ok');
