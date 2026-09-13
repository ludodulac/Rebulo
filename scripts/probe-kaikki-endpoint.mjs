import fs from 'node:fs';
const url='https://kaikki.org/frwiktionary/Fran%C3%A7ais/meaning/s/so/sole.html';
const r=await fetch(url); const html=await r.text();
const hrefs=[...html.matchAll(/href=["']([^"']+)["']/g)].map(m=>m[1]).filter(x=>/jsonl|download/i.test(x));
const candidates=[url.replace(/\.html$/,'.jsonl'),url.replace(/\.html$/,'.raw.jsonl'),url+'.jsonl'];
const statuses=[];
for(const u of candidates){try{const rr=await fetch(u,{method:'HEAD'});statuses.push({url:u,status:rr.status,contentType:rr.headers.get('content-type'),contentLength:rr.headers.get('content-length')});}catch(e){statuses.push({url:u,error:String(e)})}}
fs.writeFileSync('data/structured-sense-kaikki-probe.json',JSON.stringify({pageStatus:r.status,hrefs,candidates:statuses,htmlBytes:html.length},null,2)+'\n');