import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizePlayAnswer,playableRebuses,choosePlayableRebus,playAnswerMatches,safePlayHint} from '../src/play-game.js';

const catalog=[
  {id:'rallye',answer:'rallye',validation:'strict',presentationStatus:'showcase',pieces:[{image:'rat.svg'},{image:'lit.svg'}]},
  {id:'lira',answer:'lira',validation:'strict',presentationStatus:'showcase',pieces:[{image:'lit.svg'},{image:'rat.svg'}]},
  {id:'merci',answer:'merci',validation:'strict',presentationStatus:'experimental_visual',pieces:[{image:'mer.svg',reading:'mer'},{image:'scie.svg',reading:'scie'}]},
  {id:'cinema',answer:'cinéma',validation:'strict',presentationStatus:'experimental_visual',pieces:[{image:'scie.svg'},{image:'nez.svg'},{image:'mat.svg'}]},
  {id:'donne',answer:'donné',acceptedAnswers:['donné','donner'],targetIpa:'/dɔne/',validation:'strict',pieces:[{image:'x.svg'}]},
  {id:'mari',answer:'mari',acceptedAnswers:['mari','Marie'],targetIpa:'/maʁi/',validation:'strict',pieces:[{image:'x.svg'}]},
  {id:'approx',answer:'rébus',validation:'approximate',pieces:[{image:'x.svg'}]},
  {id:'broken',answer:'cassé',validation:'strict',pieces:[{reading:'x'}]}
];
assert.equal(normalizePlayAnswer(' Cinéma ! '),'cinema');
assert.equal(playAnswerMatches('CINEMA',catalog[3]),true);
assert.equal(playAnswerMatches('ciné',catalog[3]),false);
assert.equal(playAnswerMatches('donner',catalog[4]),true,'known exact homophone must count as correct without spelling correction');
assert.equal(playAnswerMatches('donné',catalog[4]),true);
assert.equal(playAnswerMatches('Marie',catalog[5]),true,'same exact sound may use another known spelling');
assert.equal(playAnswerMatches('marine',catalog[5]),false,'different sound must remain incorrect');
assert.deepEqual(playableRebuses(catalog).map(item=>item.id),['rallye','lira','merci','cinema','donne','mari']);
assert.equal(choosePlayableRebus(catalog,null,()=>0).id,'rallye');
assert.equal(choosePlayableRebus(catalog,'rallye',()=>0).id,'lira');
assert.equal(choosePlayableRebus(catalog,null,()=>0.91).id,'cinema');
const hint=safePlayHint(catalog[3]);
assert.equal(hint,'Le mot commence par C et contient 6 lettres.');
assert.equal(hint.toLowerCase().includes('cinéma'),false);
assert.equal(hint.toLowerCase().includes('scie'),false);
assert.equal(hint.toLowerCase().includes('nez'),false);
assert.equal(hint.toLowerCase().includes('mât'),false);

const realCatalog=JSON.parse(fs.readFileSync(new URL('../data/rebus.json',import.meta.url)));
const showcase=realCatalog.filter(item=>item.presentationStatus==='showcase');
assert.ok(realCatalog.length>=20,'the game should offer at least 20 strict examples');
assert.ok(showcase.length>=15,'the showcase pool should no longer feel repetitive');
assert.equal(new Set(realCatalog.map(item=>item.id)).size,realCatalog.length,'rebus ids must be unique');
for(const rebus of realCatalog){
  const built=rebus.pieces.map(piece=>piece.ipa.replaceAll('/','')).join('');
  assert.equal(`/${built}/`,rebus.targetIpa,`${rebus.id} must remain an exact whole-word IPA concatenation`);
  assert.equal(rebus.validation,'strict');
  assert.equal(rebus.phoneticConfidence,1);
}
console.log('play-game tests: exact spelling and known exact homophones are accepted without turning play into a spelling test.');
