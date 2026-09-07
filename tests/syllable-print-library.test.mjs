import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SYLLABLE_PRINT_LIBRARY,syllablePrintItems,syllablePrintMeta} from '../src/syllable-print-library.js';

assert.equal(SYLLABLE_PRINT_LIBRARY.length,28);
assert.equal(syllablePrintMeta().active,24);
assert.equal(syllablePrintMeta().research,4);
assert.equal(syllablePrintMeta().scope,'short_rebus_sound_bricks');
assert.equal(syllablePrintItems({includeResearch:false}).length,24);
assert.ok(SYLLABLE_PRINT_LIBRARY.every(item=>item.ipa&&item.image&&item.label));
assert.ok(!SYLLABLE_PRINT_LIBRARY.some(item=>item.id==='voiture'||item.label==='voiture'),'general object words such as voiture must not enter the rebus sound-brick sheets');
for(const id of ['mer','scie','nez','mat','pas','rat','pie','mie','de','lit','riz','the','tas','eau']){
  assert.ok(SYLLABLE_PRINT_LIBRARY.some(item=>item.id===id),`${id} should remain available as a short rebus brick`);
}
for(const id of ['mat-prototype','tour-prototype','tas-prototype','cor-prototype']){
  const item=SYLLABLE_PRINT_LIBRARY.find(entry=>entry.id===id);
  assert.equal(item?.status,'research');
  assert.ok(item?.image.startsWith('assets/research/'));
  assert.ok(fs.existsSync(item.image),`${id} research artwork should exist`);
}
console.log('syllable print library: 24 active + 4 research sound bricks, no general-object drift');