import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync('data/independent-sense-gold-150.json','utf8'));
const lines=['goldId\texactWord\tipa\tstratum\tcategory\tbaseline\trisk\talternatives'];
for(const r of d.rows){lines.push([r.goldId,r.exactWord,r.ipa,r.selectionStratum,r.proxyContext.conceptCategory??'',r.baseline.provisionalClass,r.proxyContext.anticipatedNamingRisk??'',(r.proxyContext.anticipatedAlternativeNames??[]).join('|')].join('\t'));}
fs.writeFileSync('data/independent-sense-gold-150-review-sheet.tsv',lines.join('\n')+'\n');