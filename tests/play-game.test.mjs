import assert from 'node:assert/strict';
import {normalizePlayAnswer,playableRebuses,choosePlayableRebus,playAnswerMatches,safePlayHint} from '../src/play-game.js';

const catalog=[
  {id:'rallye',answer:'rallye',validation:'strict',presentationStatus:'showcase',pieces:[{image:'rat.svg'},{image:'lit.svg'}]},
  {id:'lira',answer:'lira',validation:'strict',presentationStatus:'showcase',pieces:[{image:'lit.svg'},{image:'rat.svg'}]},
  {id:'merci',answer:'merci',validation:'strict',presentationStatus:'experimental_visual',pieces:[{image:'mer.svg',reading:'mer'},{image:'scie.svg',reading:'scie'}]},
  {id:'cinema',answer:'cinéma',validation:'strict',presentationStatus:'experimental_visual',pieces:[{image:'scie.svg'},{image:'nez.svg'},{image:'mat.svg'}]},
  {id:'approx',answer:'rébus',validation:'approximate',pieces:[{image:'x.svg'}]},
  {id:'broken',answer:'cassé',validation:'strict',pieces:[{reading:'x'}]}
];

assert.equal(normalizePlayAnswer(' Cinéma ! '),'cinema');
assert.equal(playAnswerMatches('CINEMA',catalog[3]),true);
assert.equal(playAnswerMatches('ciné',catalog[3]),false);
assert.deepEqual(playableRebuses(catalog).map(item=>item.id),['rallye','lira','merci','cinema']);
assert.equal(choosePlayableRebus(catalog,null,()=>0).id,'rallye');
assert.equal(choosePlayableRebus(catalog,'rallye',()=>0).id,'lira');
assert.equal(choosePlayableRebus(catalog,null,()=>0.9).id,'merci');
assert.equal(choosePlayableRebus(catalog,'merci',()=>0.95).id,'cinema');

const hint=safePlayHint(catalog[3]);
assert.equal(hint,'Le mot commence par C et contient 6 lettres.');
assert.equal(hint.toLowerCase().includes('cinéma'),false);
assert.equal(hint.toLowerCase().includes('scie'),false);
assert.equal(hint.toLowerCase().includes('nez'),false);
assert.equal(hint.toLowerCase().includes('mât'),false);

console.log('play-game tests: ok');
