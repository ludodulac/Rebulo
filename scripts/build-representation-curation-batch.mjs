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
  curatedPrototype:rows.filter(row=>row.preferredCandidate.visualRoute==='curated_prototype').length,
  existingExactAsset:rows.filter(row=>row.preferredCandidate.visualRoute==='existing_exact_asset').length,
  nounLexicalPrecheck:rows.filter(row=>row.preferredCandidate.visualRoute==='noun_lexical_precheck').length,
  lexicalPrecheck:rows.filter(row=>row.preferredCandidate.visualRoute==='lexical_precheck').length,
  assetPhonologyConflict:rows.filter(row=>row.preferredCandidate.visualRoute==='asset_phonology_conflict').length
};
const output={
  schemaVersion:'1.1',
  generatedAt:new Date().toISOString(),
  status:'human_curation_queue_only',
  purpose:'Prioritize exact lexical gaps for visual curation without inflating usable coverage before naming evidence exists.',
  policy:{
    exactness:'Every candidate is tied to the same complete IPA as the target sound.',
    evidenceTiers:'Editorial prototype decisions are listed first. Uncurated exact Lexique words remain lexical prechecks, not visual hypotheses.',
    rejection:'Previously rejected or deferred candidate/IPA pairs are excluded.',
    reuse:'An existing asset is surfaced only when its stored whole-word IPA is exactly the same as the target sound.',
    symbols:'Single-letter lexical artifacts are excluded from image curation because visible-letter conventions are modeled separately.',
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
  `- Hypothèses visuelles déjà curatées : ${counts.curatedPrototype}.`,
  `- Réutilisation exacte d’un asset existant détectée : ${counts.existingExactAsset}.`,
  `- Noms exacts restant au stade de pré-tri lexical : ${counts.nounLexicalPrecheck}.`,
  `- Autres mots exacts restant au stade de pré-tri lexical : ${counts.lexicalPrecheck}.`,
  `- Conflits de phonologie avec un asset de même libellé : ${counts.assetPhonologyConflict}.`,
  '',
  '## Priorités',
  '',
  '| Rang | Son | Cibles utiles | Candidat | Niveau | Risque de dénomination | Exemples |',
  '|---:|---|---:|---|---|---|---|',
  ...rows.slice(0,100).map((row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.usefulTargetCount} | ${row.preferredCandidate.word} | ${row.preferredCandidate.visualRoute} | ${row.preferredCandidate.spontaneousNamingRisk||'à évaluer'} | ${row.usefulExamples.slice(0,4).join(', ')||'—'} |`),
  '',
  '## Règle de décision',
  '',
  'Les hypothèses visuelles déjà curatées passent avant les simples homophones lexicaux. Un nom exact issu de Lexique reste un pré-tri tant qu’un concept visuel précis et ses confusions de dénomination n’ont pas été explicitement examinés.'
];
fs.mkdirSync(path.dirname(reportPath),{recursive:true});
fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(JSON.stringify(counts,null,2));
