import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildProductiveBank,productiveWaveStats} from '../src/rebus-productive-bank.js';
import {normalizeIPA} from '../src/phonetic-engine.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8'));
const fragmentIdeas=read('data/rebus-fragment-representation-ideas.json');
const wave1=read('data/rebus-productive-bank-wave1.json');
const wave2=read('data/rebus-productive-bank-wave2.json');
const coverage=read('data/rebus-productive-bank-wave2-phrase-coverage.json');
const audit=read('data/rebus-representation-bank-audit.json');
const stats=productiveWaveStats(wave2);

assert.equal(stats.examinedSoundCount,400);
assert.equal(stats.runtimeActivationCount,0);
assert.ok(stats.totalDistinctExactWordCount>=400);
assert.ok(stats.multipleExactHomophoneSoundCount>=100);
assert.ok(stats.pictographicProposalCount>=20,'wave2 should integrate a substantial set of prior curated visual hypotheses');
assert.equal(stats.visualBriefCount,stats.pictographicProposalCount);
assert.ok(stats.rejectedCandidateCount>0);
assert.ok(stats.deferredCandidateCount>0);

const wave1Schema=wave1.soundRowSchema||[];
const wave2Schema=wave2.soundRowSchema||[];
const i1=wave1Schema.indexOf('ipa'),i2=wave2Schema.indexOf('ipa');
const wave1Ipas=new Set((wave1.soundRows||[]).map(row=>normalizeIPA(row[i1])));
const wave2Ipas=(wave2.soundRows||[]).map(row=>normalizeIPA(row[i2]));
assert.equal(new Set(wave2Ipas).size,400);
assert.ok(wave2Ipas.every(ipa=>!wave1Ipas.has(ipa)),'wave2 must not re-count wave1 sounds');

for(const rep of wave2.representations||[]){
  assert.equal(rep.editorialStatus,'retain');
  assert.ok(rep.brief&&rep.brief.length>80,'retained representation needs a detailed visual brief');
}
assert.equal(wave2.representationDefaults.spontaneousNamingRisk,'unknown');
assert.equal(wave2.representationDefaults.humanNamingEvidence,'none');
assert.equal(wave2.representationDefaults.clinicalEvidence,'none');
assert.equal(wave2.representationDefaults.runtimeStatus,'inactive_editorial');

const bank=buildProductiveBank({fragmentIdeas,productiveWaves:[wave1,wave2]});
for(const raw of wave2.soundRows||[]){
  const row=Object.fromEntries(wave2Schema.map((key,index)=>[key,raw[index]]));
  const sound=bank.get(normalizeIPA(row.ipa));
  assert.ok(sound);
  for(const word of row.exactWords||[]){
    assert.ok(sound.exactWords.includes(word));
    const relation=sound.representations.find(rep=>rep.word===word&&rep.source==='Lexique 4');
    assert.ok(relation,`missing indexed exact relation /${row.ipa}/ → ${word}`);
    assert.equal(relation.wordIpa,normalizeIPA(row.ipa));
    assert.equal(relation.matchStatus,'exact');
    assert.equal(relation.spontaneousNamingRisk,'unknown');
    assert.equal(relation.humanNamingEvidence,'none');
    assert.equal(relation.clinicalEvidence,'none');
    assert.equal(relation.runtimeStatus,'inactive_editorial');
  }
}

assert.equal(coverage.rows.length,20);
assert.equal(coverage.summary.phraseCount,20);
assert.ok(coverage.summary.pronunciationResolvedCount>=15);
assert.ok(coverage.summary.meanCoverageRatio>0);
assert.ok(coverage.rows.every(row=>row.coverageRatio>=0&&row.coverageRatio<=1));

const seriousSounds=[...bank.values()].filter(sound=>sound.visibleConventions.length||sound.representations.some(rep=>rep.editorialStatus==='retain'&&(rep.visualBrief||rep.representationProposed)));
assert.ok(seriousSounds.length>186,'cumulative serious editorial sound coverage must grow beyond wave1');
const usefulExactIpas=new Set((audit.usefulRows||[]).filter(row=>(row.exactWords||[]).length>0).map(row=>normalizeIPA(row.ipa)).filter(Boolean));
assert.equal(usefulExactIpas.size,5741);
const seriousUsefulSounds=seriousSounds.filter(sound=>usefulExactIpas.has(sound.ipa));
const usefulPercent=seriousUsefulSounds.length/usefulExactIpas.size*100;
assert.ok(seriousUsefulSounds.length>0);

console.log(JSON.stringify({wave:stats,cumulative:{indexedSoundCount:bank.size,seriousRepresentationSoundCount:seriousSounds.length,seriousUsefulSoundCount:seriousUsefulSounds.length,usefulExactSoundDenominator:usefulExactIpas.size,usefulSoundSeriousRepresentationPercent:Number(usefulPercent.toFixed(2))},phraseCoverage:coverage.summary},null,2));
