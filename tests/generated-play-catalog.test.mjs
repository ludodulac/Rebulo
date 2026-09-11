import assert from 'node:assert/strict';
import fs from 'node:fs';
import {exactReduplicatedBaseRows,generatedPlayableBankRebuses,generatedPlayableRebuses,mergePlayableCatalog,playCatalogMetrics} from '../src/generated-play-catalog.js';
import {buildPhrasePlan} from '../src/phrase-creator.js';
import {playableRebuses} from '../src/play-game.js';
import {rebusesForProfile} from '../src/difficulty-profile.js';

const coverage=JSON.parse(fs.readFileSync(new URL('../data/coverage-report.json',import.meta.url),'utf8'));
const lexicon=JSON.parse(fs.readFileSync(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));
const manual=JSON.parse(fs.readFileSync(new URL('../data/rebus.json',import.meta.url),'utf8'));
const soundCatalog=JSON.parse(fs.readFileSync(new URL('../data/rebus-sound-catalog.json',import.meta.url),'utf8'));
const visibleConventions=JSON.parse(fs.readFileSync(new URL('../data/rebus-visible-conventions.json',import.meta.url),'utf8'));
const analyzer=fs.readFileSync(new URL('../scripts/analyze-coverage.mjs',import.meta.url),'utf8');

const derivedBases=exactReduplicatedBaseRows(coverage);
const piliBase=derivedBases.find(row=>row.word==='pili');
assert.ok(piliBase,'an exact X-X lexical route must expose its exact duplicated base without a word-specific exception');
assert.equal(piliBase.ipa,'pili');
assert.deepEqual(piliBase.decomposition,['pie','lit']);
assert.equal(piliBase.derivedFrom,'pili-pili');

const generated=generatedPlayableRebuses(coverage,lexicon);
assert.equal(playableRebuses(generated).length,generated.length,'every legacy generated round must remain playable');
assert.ok(generated.every(item=>item.generated&&item.validation==='strict'));
assert.ok(generated.every(item=>['showcase','review_needed'].includes(item.presentationStatus)));
assert.ok(generated.every(item=>item.pieces.length>=2&&item.pieces.length<=4));
assert.ok(generated.every(item=>Array.isArray(item.acceptedAnswers)&&item.acceptedAnswers.includes(item.answer)),'every generated round keeps its written answer among exact sound forms');
assert.doesNotMatch(analyzer,/constructibleMultiPiece\.slice\(/,'coverage analysis must not truncate the playable strict multi-image list');
assert.match(analyzer,/constructibleMultiPiece\s*,\s*missingSounds/,'coverage report must serialize the complete multi-image list');
for(const word of ['merci','cinéma','parapluie','parasol','délit','tourner','pili'])assert.ok(generated.some(item=>item.answer===word),`${word} should be available from generated exact coverage`);

const modern=generatedPlayableBankRebuses(coverage,soundCatalog,visibleConventions);
assert.ok(modern.length>0,'the browser product must expose the modern representation bank');
assert.ok(modern.every(item=>['representation-bank','representation-bank-reduplicated-base','visible-convention'].includes(item.source)),'modern rounds must retain explicit provenance');
assert.ok(modern.some(item=>item.source==='representation-bank'));
assert.ok(modern.some(item=>item.source==='visible-convention'));
assert.ok(modern.every(item=>item.pieces.length>=1&&item.pieces.length<=6));
assert.ok(modern.every(item=>item.pieces.every(piece=>piece.kind==='image'?Boolean(piece.image):Boolean(piece.symbol))));
assert.ok(modern.every(item=>Array.isArray(item.acceptedAnswers)&&item.acceptedAnswers.includes(item.answer)));
const modernPili=modern.find(item=>item.answer==='pili');
assert.ok(modernPili,'pili must use the same exact bank planning path as Play');
assert.equal(modernPili.targetIpa,'pili');
assert.equal(modernPili.source,'representation-bank-reduplicated-base');
assert.ok(modernPili.pieces.length>=1,'the modern planner may choose any eligible exact representation route');

function creatorTargetFromRound(round){
  const mode=round.conventionCount?'general':'strict';
  const pieces=round.pieces.map(piece=>piece.kind==='image'?{...piece,label:piece.reading,reading:piece.reading}:{...piece,label:piece.reading,reading:piece.reading,grapheme:piece.symbol||piece.reading,operationType:'grapheme'});
  return {target:round.answer,targetIpa:round.targetIpa,mode,assets:'ready',source:'representation-bank',generated:true,frequency:round.frequency,operationCount:pieces.length,directCandidate:{answer:round.answer,targetIpa:round.targetIpa,source:'representation-bank',generated:true,pieces,therapyActivities:[],construction:{mode}}};
}
for(const round of modern){
  const phrase=buildPhrasePlan(`zztest ${round.answer}`,[creatorTargetFromRound(round)],[],[]);
  const token=phrase.tokens.find(item=>item.kind==='rebus');
  assert.ok(token,`a Play-planifiable target must remain planifiable inside a phrase: ${round.answer}`);
  assert.equal(token.candidate.targetIpa,round.targetIpa);
  assert.deepEqual(token.candidate.pieces.map(piece=>piece.reading),round.pieces.map(piece=>piece.reading));
}
const piliPhrase=buildPhrasePlan('je regarde pili',[creatorTargetFromRound(modernPili)],[],[]);
assert.equal(piliPhrase.tokens.find(token=>token.text==='pili')?.kind,'rebus');
assert.deepEqual(piliPhrase.tokens.find(token=>token.text==='pili')?.candidate.pieces.map(piece=>piece.reading),modernPili.pieces.map(piece=>piece.reading));

const modernMetrics=playCatalogMetrics(modern);
const legacyMetrics=playCatalogMetrics(generated);
assert.ok(modernMetrics.representationCount>legacyMetrics.representationCount,'modern Play must expose more distinct representations than the old coverage-only path');
assert.ok(modernMetrics.conventionRoundCount>0,'visible conventions must reach actual Play rounds');
assert.ok(modernMetrics.conventionFamilies.letter>0,'letter-name conventions must reach actual Play rounds');
assert.ok(modernMetrics.conventionFamilies.number>0,'number conventions must reach actual Play rounds');
assert.ok(modernMetrics.conventionFamilies.music_note>0,'solfege conventions must reach actual Play rounds');
assert.ok(modernMetrics.twoSyllableRoundCount>0,'two-syllable pieces must reach actual Play rounds');

const merged=mergePlayableCatalog(manual,modern);
assert.equal(merged.filter(item=>item.answer==='papa').length,1,'historical rounds must not duplicate generated answers');
assert.ok(merged.length>=modern.length);
const profileMetrics=Object.fromEntries(['discovery','intermediate','expert'].map(profile=>[profile,playCatalogMetrics(rebusesForProfile(merged,profile))]));
assert.ok(profileMetrics.discovery.roundCount>0);
assert.ok(profileMetrics.intermediate.roundCount>=profileMetrics.discovery.roundCount);
assert.ok(profileMetrics.expert.roundCount>=profileMetrics.intermediate.roundCount);
assert.ok(profileMetrics.discovery.representationCount>20,'Discovery itself must not collapse to a tiny repeating visual set');

const legacyMerged=mergePlayableCatalog(manual,generated);
assert.ok(generated.some(item=>item.answer==='rara'&&item.playQuality==='review_needed'),'low-confidence Lexique forms remain traceable instead of silently deleted');
assert.ok(!rebusesForProfile(legacyMerged,'discovery').some(item=>item.answer==='rara'),'default play must not surface low-confidence words such as rara');
assert.ok(rebusesForProfile(legacyMerged,'expert').some(item=>item.answer==='rara'),'expert mode keeps the complete legacy strict catalog available for review');

const homophoneCoverage={constructible:[{word:'donné',ipa:'/dɔne/',decomposition:['do','ne'],frequency:10},{word:'donner',ipa:'/dɔne/',decomposition:['do','ne'],frequency:9},{word:'mari',ipa:'/maʁi/',decomposition:['ma','ri'],frequency:8},{word:'Marie',ipa:'/maʁi/',decomposition:['ma','ri'],frequency:7}],constructibleMultiPiece:[{word:'donné',ipa:'/dɔne/',decomposition:['do','ne'],frequency:10},{word:'mari',ipa:'/maʁi/',decomposition:['ma','ri'],frequency:8}]};
const homophoneLexicon=[{id:'do',label:'do',ipa:'/dɔ/',image:'do.svg',active:true},{id:'ne',label:'né',ipa:'/ne/',image:'ne.svg',active:true},{id:'ma',label:'mât',ipa:'/ma/',image:'ma.svg',active:true},{id:'ri',label:'riz',ipa:'/ʁi/',image:'ri.svg',active:true}];
const homophones=generatedPlayableRebuses(homophoneCoverage,homophoneLexicon);
assert.deepEqual(homophones.find(item=>item.answer==='donné')?.acceptedAnswers,['donné','donner']);
assert.deepEqual(homophones.find(item=>item.answer==='mari')?.acceptedAnswers,['mari','Marie']);

assert.ok(generated.length>=coverage.strictMultiPieceUniqueWordCount,'exact duplicated-base derivation may add routes but must never remove serialized strict routes');
console.log('PLAY_VISIBLE_DIVERSITY '+JSON.stringify({legacy:legacyMetrics,modern:modernMetrics,profiles:profileMetrics,pili:{pieces:modernPili.pieces.map(piece=>piece.reading),source:modernPili.source}}));
