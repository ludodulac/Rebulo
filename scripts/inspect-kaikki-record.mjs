import fs from 'node:fs';
const url='https://kaikki.org/frwiktionary/Fran%C3%A7ais/meaning/s/so/sole.jsonl';
const text=await (await fetch(url)).text();
const rows=text.trim().split('\n').filter(Boolean).map(JSON.parse);
const soleil=rows.filter(r=>r.word==='soleil');
fs.writeFileSync('data/structured-sense-kaikki-record-sample.json',JSON.stringify({url,rowCount:rows.length,matchedCount:soleil.length,records:soleil.slice(0,3)},null,2)+'\n');