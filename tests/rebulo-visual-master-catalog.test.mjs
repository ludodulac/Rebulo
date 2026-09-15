import fs from 'node:fs';
import assert from 'node:assert/strict';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const c=j('data/rebulo-visual-master-catalog.json');
const rows=c.catalog||[];
assert.equal(c.status,'editorial_master_catalog_not_runtime_active');
assert.ok(rows.length>72,'master catalog must be broader than the 72-concept pilot');
const exact=rows.filter(r=>r.relation==='exact');
assert.ok(exact.length>0);
for(const r of exact){assert.ok(r.ipa&&r.word);assert.ok(Array.isArray(r.source)&&r.source.length>0,`missing exact provenance ${r.ipa}/${r.word}`);}
const ids=new Set();for(const r of rows){const k=[r.ipa,String(r.word).toLocaleLowerCase('fr'),String(r.concept).toLocaleLowerCase('fr'),r.relation].join('|');assert.ok(!ids.has(k),`artificial duplicate ${k}`);ids.add(k);}
const byIpa=new Map();for(const r of exact){if(!byIpa.has(r.ipa))byIpa.set(r.ipa,[]);byIpa.get(r.ipa).push(r.word);}for(const [ipa,words] of byIpa){const expected=[...new Set(words)].sort((a,b)=>a.localeCompare(b,'fr'));for(const r of exact.filter(x=>x.ipa===ipa))assert.deepEqual(r.homophonesExact,expected,`homophones lost for ${ipa}`);}
for(const r of rows.filter(r=>r.representationType==='IMAGE')){assert.ok(r.source.length,`production row missing source ${r.ipa}/${r.word}`);if(r.assetExists)assert.ok(r.assetEvidence,`asset without proof ${r.ipa}/${r.word}`);}
const csv=fs.readFileSync('data/rebulo-visual-production-queue.csv','utf8');assert.ok(csv.startsWith('priority,ipa,word,concept,representationType,homophoneGroup,productivity,assetExists,assetStatus,needsProduction,source\n'));assert.equal(csv.trim().split('\n').length-1,rows.filter(r=>r.representationType==='IMAGE').length);
const pilot=rows.filter(r=>r.pilot72);assert.ok(pilot.length>0);assert.ok(rows.length>pilot.length,'72 pilot must not define master catalog boundary');
assert.equal(c.counts.toProduce,rows.filter(r=>r.representationType==='IMAGE'&&r.needsProduction).length);
console.log(JSON.stringify({ok:true,counts:c.counts}));
