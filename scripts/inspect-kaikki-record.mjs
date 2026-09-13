import fs from 'node:fs';
const url='https://kaikki.org/frwiktionary/Fran%C3%A7ais/meaning/s/so/soleil.jsonl';
const rr=await fetch(url); const text=await rr.text();
const rows=rr.ok?text.trim().split('\n').filter(Boolean).map(JSON.parse):[];
const soleil=rows.filter(r=>r.word==='soleil');
fs.writeFileSync('data/structured-sense-kaikki-record-sample.json',JSON.stringify({url,status:rr.status,rowCount:rows.length,matchedCount:soleil.length,records:soleil.slice(0,3)},null,2)+'\n');