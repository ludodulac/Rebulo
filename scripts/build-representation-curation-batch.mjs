import fs from 'node:fs';
import path from 'node:path';
import {ALL_OPEN_PICTOGRAMS} from '../src/pictogram-print-sheets.js';
import {representationCurationCandidates} from '../src/rebus-representation-curation.js';

const auditPath=process.argv[2]||'data/rebus-representation-bank-audit.json';
const curationPath=process.argv[3]||'data/rebus-sound-visual-curation.json';
const outputPath=process.argv[4]||'data/rebus-representation-curation-batch.json';
const reportPath=process.argv[5]||'docs/REBUS_REPRESENTATION_CURATION_BATCH.md';
for(const file of [auditPath,curationPath,'data/lexicon-seed.json'])if(!fs.existsSync(file)){console.error(`Missing required file: ${file}`);process.exit(1);}

const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
const curation=JSON.parse(fs.readFileSync(curationPath,'utf8'));
const seed=JSON.parse(fs.readFileSync('data/lexicon-seed.json','utf8'));
const existingAssets=[
  ...seed.map(item=>({...item,source:'lexicon_seed'})),
  ...ALL_OPEN_PICTOGRAMS.map(item=>({...item,source:'open_pictogram_library'}))
];
const rows=representationCurationCandidates(audit,curation,existingAssets,{limit:250});
const counts={
  total:rows.length,
  existingExactAsset:rows.filter(row=>row.preferredCandidate.visualRoute==='existing_exact_asset').length,
  nounVisualReview:rows.filter(row=>row.preferredCandidate.visualRoute==='noun_visual_review').length,
  lexicalVisualReview:rows.filter(row=>row.preferredCandidate.visualRoute==='lexical_visual_review').length,
  assetPhonologyConflict:rows.filter(row=>row.preferredCandidate.visualRoute==='asset_phonology_conflict').length
};
const output={
  schemaVersion:'1.0',
  generatedAt:new Date().toISOString(),
  status:'human_curation_queue_only',
  purpose:'Prioritize exact lexical gaps for visual curation without inflating usable coverage before naming evidence exists.',
  policy:{
    exactness:'Every candidate comes from the exact-word visual backlog for the same IPA.',
    rejection:'Previously rejected or deferred candidate/IPA pairs are excluded.',
    reuse:'An existing asset is surfaced only when its stored whole-word IPA is exactly the same as the target sound.',
    namability:'Noun status is only a research prioritization hint. It never means visually obvious or validated.',
    activation:'Nothing in this file activates a pictogram automatically.'
  },
  counts,
  rows
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');

const lines=[
  '# Rebulo — lot prioritaire de curation visuelle',
  '',
  '> File de travail conservatrice : mot exact ≠ bon pictogramme. Aucun candidat de cette liste n’est activé automatiquement.',
  '',
  `- Segments proposés à la revue : ${counts.total}.`,
  `- Réutilisation exacte d’un asset existant détectée : ${counts.existingExactAsset}.`,
  `- Candidat nominal à examiner visuellement : ${counts.nounVisualReview}.`,
  `- Autre candidat lexical à examiner : ${counts.lexicalVisualReview}.`,
  `- Conflit de phonologie avec un asset de même libellé : ${counts.assetPhonologyConflict}.`,
  '',
  '## Priorités',
  '',
  '| Rang | Son | Cibles utiles | Candidat | POS | Route | Exemples |',
  '|---:|---|---:|---|---|---|---|',
  ...rows.slice(0,100).map((row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.usefulTargetCount} | ${row.preferredCandidate.word} | ${row.preferredCandidate.pos||'—'} | ${row.preferredCandidate.visualRoute} | ${row.usefulExamples.slice(0,4).join(', ')||'—'} |`),
  '',
  '## Règle de décision',
  '',
  'Le prochain gain de couverture doit provenir de candidats qui restent compréhensibles sans légende. Les mots exacts abstraits, rares ou lexicalement instables restent dans la recherche même s’ils amélioreraient artificiellement un pourcentage de couverture.'
];
fs.mkdirSync(path.dirname(reportPath),{recursive:true});
fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(JSON.stringify(counts,null,2));
