import assert from 'node:assert/strict';
import {dedupeLexicalEntries,filterLexicalEntries,lexicalPhonemePosition,lexicalSoundStats} from '../src/lexical-sound-index.js';

const entries=[
  {word:'merci',ipa:'mɛʁsi',frequency:100,pos:'NOM',decomposition:['mer','scie']},
  {word:'merci',ipa:'mɛʁsi',frequency:50,pos:'ONO',decomposition:['mer','scie']},
  {word:'cinéma',ipa:'sinem a'.replace(' ',''),frequency:30,pos:'NOM',decomposition:['scie','nez','mât']},
  {word:'si',ipa:'si',frequency:200,pos:'ADV',decomposition:['scie']},
  {word:'papa',ipa:'papa',frequency:80,pos:'NOM',decomposition:['pas','pas']}
];

assert.deepEqual(lexicalPhonemePosition('mɛʁsi','m'),['initial']);
assert.deepEqual(lexicalPhonemePosition('mɛʁsi','ʁ'),['medial']);
assert.deepEqual(lexicalPhonemePosition('mɛʁsi','i'),['final']);
assert.deepEqual(lexicalPhonemePosition('papa','p'),['initial','medial']);

const unique=dedupeLexicalEntries(entries);
assert.equal(unique.filter(item=>item.word==='merci').length,1);
assert.equal(unique.find(item=>item.word==='merci').frequency,100);

const initialS=filterLexicalEntries(entries,{phoneme:'s',position:'initial',limit:20});
assert.ok(initialS.some(item=>item.word==='si'));
assert.ok(initialS.some(item=>item.word==='cinéma'));
assert.ok(initialS.every(item=>item.phonemes[0]==='s'));

const finalI=filterLexicalEntries(entries,{phoneme:'i',position:'final'});
assert.ok(finalI.some(item=>item.word==='merci'));
assert.ok(finalI.every(item=>item.phonemes.at(-1)==='i'));

const searched=filterLexicalEntries(entries,{query:'mer scie'});
assert.equal(searched.length,1);
assert.equal(searched[0].word,'merci');

const stats=lexicalSoundStats(entries);
assert.equal(stats.entries,4);
assert.ok(stats.phonemes>=5);
console.log('lexical sound index: ok');
