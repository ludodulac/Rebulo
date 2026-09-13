import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizePlayAnswer,playableRebuses,choosePlayableRebus,playAnswerMatches,safePlayHint,provePlayRound,assertExactPlayableRounds} from '../src/play-game.js';

const catalog=[
  {id:'rallye',answer:'rallye',targetIpa:'/ʁali/',validation:'strict',presentationStatus:'showcase',pieces:[{image:'rat.svg',ipa:'/ʁa/'},{image:'lit.svg',ipa:'/li/'}]},
  {id:'lira',answer:'lira',targetIpa:'/liʁa/',validation:'strict',presentationStatus:'showcase',pieces:[{image:'lit.svg',ipa:'/li/'},{image:'rat.svg',ipa:'/ʁa/'}]},
  {id:'merci',answer:'merci',targetIpa:'/mɛʁsi/',validation:'strict',presentationStatus:'experimental_visual',pieces:[{image:'mer.svg',reading:'mer',ipa:'/mɛʁ/'},{image:'scie.svg',reading:'scie',ipa:'/si/'}]},
  {id:'cinema',answer:'cinéma',targetIpa:'/sinemɑ/',validation:'strict',presentationStatus:'experimental_visual',pieces:[{image:'scie.svg',ipa:'/si/'},{image:'nez.svg',ipa:'/ne/'},{image:'mat.svg',ipa:'/mɑ/'}]},
  {id:'donne',answer:'donné',acceptedAnswers:['donné','donner'],targetIpa:'/dɔne/',validation:'strict',pieces:[{image:'x.svg',ipa:'/dɔne/'}]},
  {id:'mari',answer:'mari',acceptedAnswers:['mari','Marie'],targetIpa:'/maʁi/',validation:'strict',pieces:[{image:'x.svg',ipa:'/maʁi/'}]},
  {id:'approx',answer:'rébus',targetIpa:'/ʁeby/',validation:'playful_approximation',pieces:[{image:'x.svg',ipa:'/ʁebu/'}]},
  {id:'broken',answer:'cassé',targetIpa:'/kase/',validation:'strict',pieces:[{image:'x.svg',reading:'x',ipa:'/ka/'}]}
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

const impossibleExact={id:'synthetic-invalid-exact',answer:'synthetic',targetIpa:'/ups/',validation:'strict',pieces:[{image:'water.svg',reading:'eau',ipa:'/o/'},{kind:'letter_name',symbol:'O',reading:'O',ipa:'/o/'}]};
const impossibleProof=provePlayRound(impossibleExact);
assert.equal(impossibleProof.builtIpa,'oo');
assert.equal(impossibleProof.targetIpa,'ups');
assert.equal(impossibleProof.ok,false,'an exact Play round must never survive when concatenated piece IPA differs from solution IPA');
assert.equal(playableRebuses([impossibleExact]).length,0);
assert.throws(()=>assertExactPlayableRounds([impossibleExact]),error=>error?.code==='REBULO_PLAY_PHONETIC_INVARIANT');
const approximation={...impossibleExact,id:'synthetic-playful',validation:'playful_approximation'};
assert.equal(provePlayRound(approximation).status,'playful_approximation');
assert.equal(provePlayRound(approximation).ok,false,'playful approximations must stay outside the exact Play pool');

const realCatalog=JSON.parse(fs.readFileSync(new URL('../data/rebus.json',import.meta.url)));
const showcase=realCatalog.filter(item=>item.presentationStatus==='showcase');
assert.ok(realCatalog.length>=20,'the game should offer at least 20 strict examples');
assert.ok(showcase.length>=15,'the showcase pool should no longer feel repetitive');
assert.equal(new Set(realCatalog.map(item=>item.id)).size,realCatalog.length,'rebus ids must be unique');
assertExactPlayableRounds(realCatalog,'manual Play catalog');
for(const rebus of realCatalog){
  const proof=provePlayRound(rebus);
  assert.equal(proof.ok,true,`${rebus.id} must remain an exact whole-word IPA concatenation`);
  assert.equal(rebus.validation,'strict');
  assert.equal(rebus.phoneticConfidence,1);
}
console.log('play-game tests: every playable round carries an exact piece-IPA concatenation proof; variants and playful approximations stay explicit and outside the exact pool.');
