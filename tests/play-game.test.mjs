import assert from 'node:assert/strict';
import {normalizePlayAnswer,playableRebuses,choosePlayableRebus,playAnswerMatches,safePlayHint} from '../src/play-game.js';

const catalog=[
  {id:'merci',answer:'merci',validation:'strict',pieces:[{image:'mer.svg',reading:'mer'},{image:'scie.svg',reading:'scie'}]},
  {id:'cinema',answer:'cinéma',validation:'strict',pieces:[{image:'scie.svg'},{image:'nez.svg'},{image:'mat.svg'}]},
  {id:'approx',answer:'rébus',validation:'approximate',pieces:[{image:'x.svg'}]},
  {id:'broken',answer:'cassé',validation:'strict',pieces:[{reading:'x'}]}
];

assert.equal(normalizePlayAnswer(' Cinéma ! '),'cinema');
assert.equal(playAnswerMatches('CINEMA',catalog[1]),true);
assert.equal(playAnswerMatches('ciné',catalog[1]),false);
assert.deepEqual(playableRebuses(catalog).map(item=>item.id),['merci','cinema']);
assert.equal(choosePlayableRebus(catalog,'merci',()=>0).id,'cinema');
assert.equal(choosePlayableRebus(catalog,'cinema',()=>0).id,'merci');

const hint=safePlayHint(catalog[1]);
assert.equal(hint,'Le mot commence par C et contient 6 lettres.');
assert.equal(hint.toLowerCase().includes('cinéma'),false);
assert.equal(hint.toLowerCase().includes('scie'),false);
assert.equal(hint.toLowerCase().includes('nez'),false);
assert.equal(hint.toLowerCase().includes('mât'),false);

console.log('play-game tests: ok');
