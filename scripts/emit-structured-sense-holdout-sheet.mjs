import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync('data/structured-sense-holdout-75.json','utf8'));
const lines=['holdoutId\texactWord\tipa\tstratum\tcategory\tbaseline\trisk\talternatives'];
for(const r of d.rows){lines.push([r.holdoutId,r.exactWord,r.ipa,r.selectionStratum,r.proxyContext.conceptCategory??'',r.baseline.provisionalClass,r.proxyContext.anticipatedNamingRisk??'',(r.proxyContext.anticipatedAlternativeNames??[]).join('|')].join('\t'));}
fs.writeFileSync('data/structured-sense-holdout-75-review-sheet.tsv',lines.join('\n')+'\n');