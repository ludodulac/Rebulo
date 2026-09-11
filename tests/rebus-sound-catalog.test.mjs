import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sourceExactSyllables,buildSyllableWindowInventory,buildPhraseSyllableWindows,buildOverlappingPhonemeWindows,phonemeEditDistance,groupRepresentationsBySound} from '../src/rebus-sound-catalog.js';
import {buildPhonemeFragmentInventory,buildPhrasePhonemeWindows,groupFragmentRepresentationIdeas,ideasForFragment,FRAGMENT_STRICTNESS} from '../src/rebus-phoneme-fragments.js';

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

const fragmentInventory=buildPhonemeFragmentInventory([
  {word:'cuire',ipa:'kɥiʁ',syllabification:'kɥiʁ',syllableCount:1},
  {word:'pâques',ipa:'pak',syllabification:'pak',syllableCount:1},
  {word:'huile',ipa:'ɥil',syllabification:'ɥil',syllableCount:1},
  {word:'maison',ipa:'mɛzɔ̃',syllabification:'mɛ.zɔ̃',syllableCount:2}
],{minUnits:1,maxUnits:8});
for(const ipa of ['k','kɥ','kɥi','kɥiʁ','ɥ','ɥi','ɥiʁ','i','iʁ','ʁ','pak','ɥil'])assert.ok(fragmentInventory.some(row=>row.ipa===ipa),`fragment /${ipa}/ must be indexed even without lexical meaning`);
assert.ok(fragmentInventory.find(row=>row.ipa==='ɛz')?.categories.includes('cross_syllable_fragment'),'windows may cross a source syllable boundary without becoming fake syllables');
assert.ok(fragmentInventory.find(row=>row.ipa==='mɛzɔ̃')?.categories.includes('whole_word'));

const phrasePhonemes=buildPhrasePhonemeWindows([
  {word:'cuire',ipa:'kɥiʁ'},
  {word:'les',ipa:'le'},
  {word:'œufs',ipa:'ø'}
],{minUnits:1,maxUnits:8});
assert.ok(phrasePhonemes.some(row=>row.ipa==='kɥiʁ'),'whole word remains a usable fragment');
assert.ok(phrasePhonemes.some(row=>row.ipa==='iʁle'&&row.crossesWordBoundary),'phrase search must include shifted windows across cuire + les');
assert.ok(phrasePhonemes.some(row=>row.ipa==='leø'&&row.crossesWordBoundary),'phrase search must include les + œufs as a continuous sound window');
assert.ok(phrasePhonemes.some(row=>row.ipa==='ʁleø'&&row.crossesWordBoundary),'larger cross-word fragments must remain discoverable');

assert.deepEqual(phonemeEditDistance('ɥit','ɥit'),{distance:0,ratio:0,sourceUnits:3,targetUnits:3});
const laitVsLes=phonemeEditDistance('lɛ','le');
assert.equal(laitVsLes.distance,1,'lait /lɛ/ versus les /le/ must stay explicitly approximate');
assert.ok(laitVsLes.ratio>0);

const conventionData=JSON.parse(fs.readFileSync('data/rebus-visible-conventions.json','utf8'));
const conventions=conventionData.entries;
const grouped=groupRepresentationsBySound(conventions);
assert.ok(grouped.find(row=>row.ipa==='ɛl')?.representations.some(item=>item.label==='L'));
assert.ok(grouped.find(row=>row.ipa==='ɥit')?.representations.some(item=>item.label==='8'));
assert.ok(grouped.find(row=>row.ipa==='ɔ̃z')?.representations.some(item=>item.label==='11'),'11 must be available with its exact canonical reading /ɔ̃z/');
assert.ok(grouped.find(row=>row.ipa==='sɑ̃')?.representations.some(item=>item.label==='100'));
assert.ok(grouped.find(row=>row.ipa==='la')?.representations.some(item=>item.kind==='music_note'));
const letters=conventions.filter(item=>item.kind==='letter_name');
assert.equal(letters.length,26,'all French alphabet letter names must be available as explicit general-mode conventions');
assert.deepEqual(letters.map(item=>item.label),[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']);
for(const label of ['do','ré','mi','fa','sol','la','si'])assert.ok(conventions.some(item=>item.kind==='music_note'&&item.label===label),`${label} solfège convention should be catalogued`);
assert.ok(conventions.every(item=>item.status==='research'),'visible conventions remain research/general-mode data, not strict pictogram evidence');

const ideaData=JSON.parse(fs.readFileSync('data/rebus-fragment-representation-ideas.json','utf8'));
const ideaGroups=groupFragmentRepresentationIdeas(ideaData.entries);
assert.ok(ideasForFragment('ʁɛ',ideaGroups).some(item=>item.id==='raie-animal'));
assert.ok(ideasForFragment('ø',ideaGroups).some(item=>item.id==='oeufs-pluriel'));
assert.ok(ideasForFragment('ø',ideaGroups).some(item=>item.id==='eux-groupe'));
assert.ok(ideasForFragment('kɥi',ideaGroups).some(item=>item.id==='cui-oisillon'));
assert.ok(ideasForFragment('ɛ̃',ideaGroups).some(item=>item.strictness===FRAGMENT_STRICTNESS.PLAYFUL_NEAR),'un/in tolerance must remain explicitly non-exact');
assert.equal(ideasForFragment('œ̃',ideaGroups).find(item=>item.id==='un-digit')?.strictness,FRAGMENT_STRICTNESS.EXPLICIT_CONVENTION);
assert.ok(ideaGroups.flatMap(group=>group.ideas).every(item=>item.automaticActivation===false&&item.humanNamingEvidence==='none'&&item.clinicalEvidence==='none'),'textual concepts must never silently become production or human evidence');

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

console.log('rebus sound catalog: exhaustive phoneme fragments, 1–2 syllable windows, shifted phrase routes and explicit convention/idea separation');
