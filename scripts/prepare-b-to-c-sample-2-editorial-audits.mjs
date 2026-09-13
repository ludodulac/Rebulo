import fs from 'node:fs';
const rescue=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2-rescue-candidates.json','utf8')).rows;
const ab=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2-ab-audit-candidates.json','utf8')).rows;
function esc(s){return String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');}
const r=['# Sample 2 rescue review sheet','','| id | ipa | word | lemma | pos | freq | cat | pre | base | lexical entries |','|---|---|---|---|---|---:|---|---:|---|---|'];
for(const x of rescue){r.push(`| ${x.sampleId} | ${esc(x.ipa)} | ${esc(x.exactWord)} | ${esc(x.lemma)} | ${x.pos} | ${x.frequency} | ${x.conceptCategory} | ${x.preselectionScore} | ${x.baselineClass} | ${x.lexicalEntries.map(e=>`${esc(e.lemma)}:${e.pos}:${e.frequency}`).join('; ')} |`);}
const a=['# Sample 2 A/B false-positive audit sheet','','| id | ipa | word | lemma | pos | freq | cat | base | score | alternatives | lexical entries |','|---|---|---|---|---|---:|---|---|---:|---|---|'];
for(const x of ab){a.push(`| ${x.sampleId} | ${esc(x.ipa)} | ${esc(x.exactWord)} | ${esc(x.lemma)} | ${x.pos} | ${x.frequency} | ${x.conceptCategory} | ${x.baselineClass} | ${x.baselineAggregate} | ${(x.anticipatedAlternativeNames||[]).map(esc).join(', ')} | ${x.lexicalEntries.map(e=>`${esc(e.lemma)}:${e.pos}:${e.frequency}`).join('; ')} |`);}
fs.writeFileSync('docs/B_TO_C_SAMPLE_2_RESCUE_REVIEW_SHEET.md',r.join('\n')+'\n');
fs.writeFileSync('docs/B_TO_C_SAMPLE_2_AB_AUDIT_SHEET.md',a.join('\n')+'\n');
console.log(JSON.stringify({rescue:rescue.length,ab:ab.length}));
