import fs from 'node:fs';
import assert from 'node:assert/strict';
const rows=fs.readFileSync('data/b-to-c-industrial-sample-2-2000.jsonl','utf8').trim().split('\n').map(JSON.parse);
const metrics=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2-metrics.json','utf8'));
const rescue=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2-rescue-editorial-review.json','utf8'));
const fp=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2-ab-editorial-audit.json','utf8'));
const prior=fs.readFileSync('data/b-to-c-industrial-sample-2000.jsonl','utf8').trim().split('\n').map(JSON.parse);
const weights={concreteness:10,drawability:13,expectedNameability:25,alternativeNameResistance:10,visualAmbiguityResistance:10,visualSimplicity:8,lexicalFamiliarity:10,phoneticReuse:7,compactness:4,multiRepresentationValue:3};
const exactNorm=s=>String(s).trim().toLocaleLowerCase('fr').normalize('NFC').replace(/[’]/g,"'");
assert.equal(rows.length,2000);assert.equal(metrics.selectedRelations,2000);assert.equal(metrics.newRelations,2000);assert.equal(metrics.overlapRelations,0);assert.equal(metrics.examinedRelations,2000);
const priorKeys=new Set(prior.map(r=>`${r.ipa}|${exactNorm(r.exactWord)}`));const ids=new Set(),keys=new Set();
for(const r of rows){assert.ok(!ids.has(r.sampleId));ids.add(r.sampleId);assert.equal(r.lexicalIdentityKey,`${r.ipa}|${exactNorm(r.exactWord)}`);assert.ok(!keys.has(r.lexicalIdentityKey));keys.add(r.lexicalIdentityKey);assert.ok(!priorKeys.has(r.lexicalIdentityKey),`overlap ${r.lexicalIdentityKey}`);assert.ok(Array.isArray(r.lexicalEntries));assert.equal(r.humanNamingEvidence,'none');assert.equal(r.editorialReview,'unreviewed');for(const k of Object.keys(weights))assert.ok(Number.isInteger(r.scores[k])&&r.scores[k]>=0&&r.scores[k]<=4);const agg=Math.round(Object.entries(weights).reduce((s,[k,w])=>s+r.scores[k]*w/4,0)*10)/10;assert.equal(r.aggregateScore,agg);if(r.provisionalClass==='A'){assert.ok(agg>=80&&r.scores.expectedNameability>=3&&r.scores.drawability>=3&&r.scores.visualSimplicity>=3);}if(r.scores.expectedNameability<=1)assert.ok(['C','D'].includes(r.provisionalClass));if(r.scores.drawability<=1)assert.ok(['C','D'].includes(r.provisionalClass));}
assert.notEqual(exactNorm('mur'),exactNorm('mûr'));assert.notEqual(exactNorm('cote'),exactNorm('côte'));assert.notEqual(exactNorm('coté'),exactNorm('côté'));
const dist=rows.reduce((m,r)=>(m[r.provisionalClass]++,m),{A:0,B:0,C:0,D:0});assert.deepEqual(dist,metrics.distribution);assert.equal(rows.filter(r=>r.selectionStratum==='low_score_rescue').length,360);
assert.equal(rescue.reviewedRelations,360);assert.equal(rescue.editorialSeriousRecovered,4);assert.equal(rescue.humanNamingEvidence,'none');for(const r of rescue.recovered){assert.ok(ids.has(r.sampleId));assert.equal(r.provisionalClass,'B');const agg=Math.round(Object.entries(weights).reduce((s,[k,w])=>s+r.scores[k]*w/4,0)*10)/10;assert.equal(r.aggregateScore,agg);assert.equal(r.humanNamingEvidence,'none');}
assert.equal(fp.auditedAutomaticAB,metrics.AB);assert.equal(fp.falsePositivesFound,32);assert.equal(fp.humanNamingEvidence,'none');assert.ok(fp.falsePositivesFound<fp.auditedAutomaticAB);
console.log(JSON.stringify({ok:true,rows:rows.length,distribution:dist,rescueRecovered:rescue.editorialSeriousRecovered,falsePositives:fp.falsePositivesFound},null,2));
