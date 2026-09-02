import assert from 'node:assert/strict';
import {OPEN_PICTOGRAMS} from '../src/open-pictogram-library.js';
import {OPEN_PICTOGRAMS_WAVE_2} from '../src/open-pictogram-library-wave2.js';
import {OPEN_PICTOGRAMS_WAVE_3} from '../src/open-pictogram-library-wave3.js';
import {ALL_OPEN_PICTOGRAMS,buildIndexedPictograms,pictogramIndexCsv,printLibraryMeta} from '../src/pictogram-print-sheets.js';

assert.equal(ALL_OPEN_PICTOGRAMS.length,OPEN_PICTOGRAMS.length+OPEN_PICTOGRAMS_WAVE_2.length+OPEN_PICTOGRAMS_WAVE_3.length);
const indexed=buildIndexedPictograms();
assert.equal(indexed.length,ALL_OPEN_PICTOGRAMS.length);
assert.ok(indexed.length>=330,`expected at least 330 printable concepts, got ${indexed.length}`);
assert.ok(indexed.some(item=>item.indexId==='RBL-de'&&item.label==='dé'));
assert.ok(indexed.some(item=>item.indexId==='RBL-nez'&&item.label==='nez'));
assert.ok(indexed.some(item=>item.indexId==='RBL-tente'&&item.label==='tente'));
const csv=pictogramIndexCsv();
assert.match(csv,/RBL-de,de,dé/);
assert.match(csv,/RBL-nez,nez,nez/);
assert.equal(printLibraryMeta().count,indexed.length);
console.log('pictogram print wave 3: ok');
