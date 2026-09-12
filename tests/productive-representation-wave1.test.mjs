import assert from 'node:assert/strict';
import fs from 'node:fs';

const bank=JSON.parse(fs.readFileSync(new URL('../data/rebus-fragment-representation-ideas.json',import.meta.url),'utf8'));
const entries=bank.entries||[];
const byIpa=new Map();
for(const entry of entries){
  assert.ok(entry.id&&entry.ipa&&entry.label&&entry.kind,'each retained idea needs identity, sound, label and kind');
  assert.ok(entry.visualBrief?.length>=35,'each retained idea needs a useful future visual brief');
  assert.ok(['exact','explicit_convention','variant_documented','playful_near','orthophony_locked'].includes(entry.strictness),'strictness must remain explicit');
  assert.ok(['low','medium','high','unknown'].includes(entry.anticipatedNamingRisk),'anticipated naming risk must be explicit');
  assert.equal(entry.spontaneousNamingRisk,'unknown','editorial anticipation must not masquerade as human naming evidence');
  assert.equal(entry.humanNamingEvidence,'none');
  assert.equal(entry.clinicalEvidence,'none');
  assert.equal(entry.automaticActivation,false,'textual curation must not silently activate runtime pieces');
  if(!byIpa.has(entry.ipa))byIpa.set(entry.ipa,[]);
  byIpa.get(entry.ipa).push(entry);
}

assert.ok(entries.length>=140,'wave 1 must be substantial rather than an example list');
assert.ok(byIpa.size>=125,'wave 1 must cover a broad set of distinct productive sounds');
assert.ok((bank.rejectedCandidates||[]).length>=20,'curation must preserve explicit no-good-representation decisions');
assert.ok([...byIpa.values()].filter(group=>group.length>1).length>=8,'multiple serious representations per sound are first-class');
assert.deepEqual(byIpa.get('ʁɛ').map(x=>x.id).sort(),['raie-animal','raie-trait']);
assert.ok(byIpa.get('mɛʁ').some(x=>x.label==='mer')&&byIpa.get('mɛʁ').some(x=>x.label==='mère'));
assert.ok(byIpa.get('pɛ̃').some(x=>x.label==='pain')&&byIpa.get('pɛ̃').some(x=>x.label==='pin'));
assert.ok(byIpa.get('ø').some(x=>x.label==='œufs')&&byIpa.get('ø').some(x=>x.label==='eux'));
assert.equal(byIpa.get('dø').find(x=>x.label==='2').strictness,'explicit_convention');
assert.equal(byIpa.get('de').find(x=>x.label==='D').strictness,'explicit_convention');
assert.equal(byIpa.get('œ̃').find(x=>x.label==='1').strictness,'explicit_convention');
assert.equal(byIpa.get('ɔ̃z').find(x=>x.label==='11').strictness,'explicit_convention');
assert.equal(byIpa.get('ɛ̃').find(x=>x.id==='un-vs-in-near').strictness,'playful_near','/ɛ̃/ must not be falsified into strict 1=/œ̃/');
assert.ok(byIpa.get('pi').some(x=>x.label==='pie')&&byIpa.get('li').some(x=>x.label==='lit'),'pili observation needs reusable pie + lit ideas without a pili exception');
assert.ok(byIpa.get('kɥi').some(x=>x.label==='cui')&&byIpa.get('ø').some(x=>x.label==='œufs'),'cuire les œufs laboratory sounds must be represented without hard-coding the phrase');

console.log(`productive-representation-wave1.test.mjs: ${entries.length} retained representations / ${byIpa.size} sounds / ${(bank.rejectedCandidates||[]).length} rejected candidates`);
