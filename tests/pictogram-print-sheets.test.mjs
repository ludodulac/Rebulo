import assert from 'node:assert/strict';
import {OPEN_PICTOGRAMS} from '../src/open-pictogram-library.js';
import {PICTOGRAMS_PER_PRINT_PAGE,PRINT_COLUMNS,PRINT_ROWS,buildIndexedPictograms,buildPrintSheetPairs,pictogramIndexCsv,pictogramIndexId,printLibraryMeta} from '../src/pictogram-print-sheets.js';

assert.equal(PICTOGRAMS_PER_PRINT_PAGE,20);
assert.equal(PRINT_COLUMNS*PRINT_ROWS,20);
assert.equal(pictogramIndexId({id:'arcenciel'}),'RBL-arcenciel');

const indexed=buildIndexedPictograms();
assert.equal(indexed.length,OPEN_PICTOGRAMS.length);
assert.equal(new Set(indexed.map(item=>item.indexId)).size,indexed.length);
assert.ok(indexed.every(item=>item.indexId.startsWith('RBL-')));
assert.ok(indexed.every(item=>item.label&&item.image&&item.assetSource));

const pairs=buildPrintSheetPairs();
assert.equal(pairs.length,Math.ceil(indexed.length/20)*2);
for(let i=0;i<pairs.length;i+=2){
  const reference=pairs[i];
  const drawing=pairs[i+1];
  assert.equal(reference.kind,'reference');
  assert.equal(drawing.kind,'drawing');
  assert.equal(reference.lot,drawing.lot);
  assert.deepEqual(reference.entries.map(item=>item.indexId),drawing.entries.map(item=>item.indexId));
  assert.ok(reference.entries.length<=20);
}

const csv=pictogramIndexCsv();
assert.match(csv,/index_id,id,label,ipa,image,asset_source/);
assert.match(csv,/RBL-avion,avion,avion/);
assert.match(csv,/CC BY-SA 4\.0/);
assert.ok(!csv.includes('clinical_approved'));

const meta=printLibraryMeta();
assert.equal(meta.count,indexed.length);
assert.equal(meta.pages,Math.ceil(indexed.length/20));
assert.equal(meta.source,'OpenMoji');
console.log('pictogram print sheets: ok');
