import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildProductiveBank,productiveSound,productiveCompositions,productiveWaveStats} from '../src/rebus-productive-bank.js';

const fragmentIdeas=JSON.parse(fs.readFileSync(new URL('../data/rebus-fragment-representation-ideas.json',import.meta.url),'utf8'));
const productiveWave=JSON.parse(fs.readFileSync(new URL('../data/rebus-productive-bank-wave1.json',import.meta.url),'utf8'));
const bank=buildProductiveBank({fragmentIdeas,productiveWave});
const stats=productiveWaveStats(productiveWave);

assert.equal(stats.examinedSoundCount,200);
assert.ok(stats.totalDistinctExactWordCount>=400);
assert.ok(stats.multipleExactHomophoneSoundCount>=140);
assert.ok(stats.pictographicProposalCount>=60);
assert.ok(stats.visualBriefCount>=60);
assert.equal(stats.runtimeActivationCount,0);

const port=productiveSound(bank,'/pɔʁ/');
assert.ok(port);
assert.ok(port.exactWords.includes('porc'));
assert.ok(port.exactWords.includes('port'));
assert.ok(port.representations.some(item=>item.word==='porc'&&item.visualBrief));
assert.ok(port.representations.some(item=>item.word==='port'&&item.visualBrief));

const hollyHoe=productiveSound(bank,'/u/');
assert.ok(hollyHoe.representations.some(item=>item.word==='houx'));
assert.ok(hollyHoe.representations.some(item=>item.word==='houe'));

const compositions={
  pili:productiveCompositions(bank,'/pili/'),
  merci:productiveCompositions(bank,'/mɛʁsi/'),
  papa:productiveCompositions(bank,'/papa/'),
  bonVin:productiveCompositions(bank,'/bɔ̃vɛ̃/')
};

const hasRoute=(routes,ipas)=>routes.some(route=>route.map(item=>item.ipa).join('|')===ipas.join('|'));
assert.ok(hasRoute(compositions.pili,['pi','li']),'expected /pi/ + /li/ for /pili/');
assert.ok(hasRoute(compositions.merci,['mɛʁ','si']),'expected /mɛʁ/ + /si/ for /mɛʁsi/');
assert.ok(hasRoute(compositions.papa,['pa','pa']),'expected /pa/ + /pa/ for /papa/');
assert.ok(hasRoute(compositions.bonVin,['bɔ̃','vɛ̃']),'expected generic /bɔ̃/ + /vɛ̃/ for natural phrase « bon vin »');

for(const target of ['pili','mɛʁsi','papa','bɔ̃vɛ̃']){
  assert.ok(compositions[target==='mɛʁsi'?'merci':target==='bɔ̃vɛ̃'?'bonVin':target].length>0);
}

for(const sound of bank.values()){
  for(const representation of sound.representations){
    if(representation.source==='Lexique 4'){
      assert.equal(representation.wordIpa,sound.ipa);
      assert.equal(representation.matchStatus,'exact');
      assert.equal(representation.spontaneousNamingRisk,'unknown');
      assert.equal(representation.humanNamingEvidence,'none');
      assert.equal(representation.clinicalEvidence,'none');
      assert.equal(representation.runtimeStatus,'inactive_editorial');
    }
  }
}

console.log(JSON.stringify(stats,null,2));
