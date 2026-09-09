import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sourceExactSyllables,buildSyllableWindowInventory,buildPhraseSyllableWindows,buildOverlappingPhonemeWindows,phonemeEditDistance,groupRepresentationsBySound} from '../src/rebus-sound-catalog.js';

assert.deepEqual(sourceExactSyllables({ipa:'mɛʁsi',syllabification:'mɛʁ.si'}),['mɛʁ','si']);
assert.deepEqual(sourceExactSyllables({ipa:'pat',syllabification:'pat',syllableCount:1}),['pat'],'source-exact monosyllables must remain available to the 1-syllable catalog');
assert.deepEqual(sourceExactSyllables({ipa:'sinema',syllabification:'si.ne'}),[],'incomplete source boundaries must not be promoted');
assert.deepEqual(sourceExactSyllables({ipa:'pat',syllabification:'pat',syllableCount:2}),[],'declared syllable count mismatches must remain rejected');

const inventory=buildSyllableWindowInventory([
  {word:'merci',ipa:'mɛʁsi',syllabification:'mɛʁ.si',syllableCount:2},
  {word:'parti',ipa:'paʁti',syllabification:'paʁ.ti',syllableCount:2},
  {word:'patte',ipa:'pat',syllabification:'pat',syllableCount:1}
]);
assert.ok(inventory.some(row=>row.ipa==='mɛʁ'&&row.syllableSpans.includes(1)));
assert.ok(inventory.some(row=>row.ipa==='mɛʁsi'&&row.syllableSpans.includes(2)));
assert.ok(inventory.some(row=>row.ipa==='paʁti'&&row.syllableSpans.includes(2)));
assert.ok(inventory.some(row=>row.ipa==='pat'&&row.examples.includes('patte')),'monosyllabic image candidates must not disappear from the inventory');

const phraseWindows=buildPhraseSyllableWindows([
  {word:'elle',syllables:['ɛl']},
  {word:'la',syllables:['la']},
  {word:'cuit',syllables:['kɥi']},
  {word:'hier',syllables:['jɛʁ']}
]);
const spoonRoute=phraseWindows.find(row=>row.ipa==='kɥijɛʁ');
assert.ok(spoonRoute,'cuit + hier must be discoverable as a two-syllable cross-word sound window');
assert.equal(spoonRoute.crossesWordBoundary,true);

const shifted=buildOverlappingPhonemeWindows('ɛlnəsɔ̃pakɥitlepat',{minUnits:2,maxUnits:4});
assert.ok(shifted.some(row=>row.startUnit>0),'phoneme windows must slide instead of staying on word/syllable boundaries');
assert.ok(new Set(shifted.map(row=>row.startUnit)).size>4);

assert.deepEqual(phonemeEditDistance('ɥit','ɥit'),{distance:0,ratio:0,sourceUnits:3,targetUnits:3});
const laitVsLes=phonemeEditDistance('lɛ','le');
assert.equal(laitVsLes.distance,1,'lait /lɛ/ versus les /le/ must stay explicitly approximate');
assert.ok(laitVsLes.ratio>0);

const conventions=JSON.parse(fs.readFileSync('data/rebus-visible-conventions.json','utf8')).entries;
const grouped=groupRepresentationsBySound(conventions);
assert.ok(grouped.find(row=>row.ipa==='ɛl')?.representations.some(item=>item.label==='L'));
assert.ok(grouped.find(row=>row.ipa==='ɥit')?.representations.some(item=>item.label==='8'));
assert.ok(grouped.find(row=>row.ipa==='la')?.representations.some(item=>item.kind==='music_note'));

const tiered=groupRepresentationsBySound([
  {label:'patte',ipa:'pat',kind:'whole_word_image',status:'active'},
  {label:'Pâques',ipa:'pak',kind:'whole_word_scene',status:'research'},
  {label:'lait',ipa:'lɛ',kind:'whole_word_image',status:'research',match:'approximate'},
  {label:'8',ipa:'ɥit',kind:'number_symbol',status:'research'}
]);
assert.equal(tiered.find(row=>row.ipa==='pat').representations[0].tier,'exact_image_ready');
assert.equal(tiered.find(row=>row.ipa==='pak').representations[0].tier,'exact_image_research');
assert.equal(tiered.find(row=>row.ipa==='lɛ').representations[0].tier,'approximation_research','approximate image hypotheses must never look like exact research images');
assert.equal(tiered.find(row=>row.ipa==='ɥit').representations[0].tier,'explicit_visible_convention');

console.log('rebus sound catalog: source-exact mono/1–2 syllable windows, cross-word routes, shifted phoneme windows and explicit representation tiers');
