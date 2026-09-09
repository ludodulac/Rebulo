import assert from 'node:assert/strict';
import {convertLexiqueSyllabification,lexiquePhonemeToIPA,validateLexiqueSyllabification} from '../src/lexique-syllabification.js';

assert.equal(lexiquePhonemeToIPA('E'),'ɛ');
assert.equal(lexiquePhonemeToIPA('§'),'ɔ̃');
assert.equal(lexiquePhonemeToIPA('R'),'ʁ');
assert.equal(lexiquePhonemeToIPA('?'),null);

assert.deepEqual(convertLexiqueSyllabification('mE-z§'),['mɛ','zɔ̃']);
assert.deepEqual(convertLexiqueSyllabification('si-ne-ma'),['si','ne','ma']);
assert.equal(convertLexiqueSyllabification('mE-?'),null,'unknown Lexique symbols must be rejected');
assert.equal(convertLexiqueSyllabification('mE--z§'),null,'empty syllable segments must be rejected');

const maison=validateLexiqueSyllabification({sourceSyllabification:'mE-z§',targetIpa:'/mɛzɔ̃/',syllableCount:2});
assert.equal(maison.ok,true);
assert.deepEqual(maison.syllables,['mɛ','zɔ̃']);
assert.equal(maison.ipaSyllabification,'mɛ.zɔ̃');

const cinema=validateLexiqueSyllabification({sourceSyllabification:'si-ne-ma',targetIpa:'sinema',syllableCount:3});
assert.equal(cinema.ok,true);
assert.equal(cinema.ipaSyllabification,'si.ne.ma');

assert.equal(validateLexiqueSyllabification({sourceSyllabification:'mE-z§',targetIpa:'mɛzɔ̃',syllableCount:3}).reason,'syllable_count_mismatch');
assert.equal(validateLexiqueSyllabification({sourceSyllabification:'mE-z§',targetIpa:'mɛsɔ̃',syllableCount:2}).reason,'target_ipa_mismatch');
assert.equal(validateLexiqueSyllabification({sourceSyllabification:'mE-?',targetIpa:'mɛ',syllableCount:2}).reason,'unsupported_source_notation');

console.log('Lexique syllabification converter: documented codes and strict invariants passed.');
