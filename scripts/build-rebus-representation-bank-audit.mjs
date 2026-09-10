import fs from 'node:fs';
import path from 'node:path';
import {classifyRepresentationBank,representationBankStats} from '../src/rebus-representation-bank.js';
import {ALL_OPEN_PICTOGRAMS} from '../src/pictogram-print-sheets.js';
import {buildAssetInventory} from './audit-asset-library.mjs';

const catalogPath=process.argv[2]||'data/rebus-sound-catalog.json';
const approximationPath=process.argv[3]||'.cache/rebus-approximation-research.json';
const outputPath=process.argv[4]||'data/rebus-representation-bank-audit.json';
const reportPath=process.argv[5]||'docs/REBUS_REPRESENTATION_BANK_AUDIT.md';
for(const file of [catalogPath,approximationPath,'data/lexicon-seed.json'])if(!fs.existsSync(file)){console.error(`Missing required file: ${file}`);process.exit(1);}

const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const approximation=JSON.parse(fs.readFileSync(approximationPath,'utf8'));
const seed=JSON.parse(fs.readFileSync('data/lexicon-seed.json','utf8'));
const rows=classifyRepresentationBank(catalog,approximation);
const stats=representationBankStats(rows);
const usefulRows=rows.filter(row=>row.usefulTargetCount>0);

function normalizeKey(value=''){
  return String(value||'').toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

const seedIds=new Set(seed.map(item=>item?.id).filter(Boolean));
const seedLabels=new Set(seed.map(item=>normalizeKey(item?.label)).filter(Boolean));
const shadowedOpenPictograms=ALL_OPEN_PICTOGRAMS.filter(item=>seedIds.has(item.id)||seedLabels.has(normalizeKey(item.label))).map(item=>({id:item.id,label:item.label,ipa:item.ipa,image:item.image,reason:seedIds.has(item.id)?'seed_id_wins':'seed_label_wins'}));
const openRuntimePictograms=ALL_OPEN_PICTOGRAMS.filter(item=>!seedIds.has(item.id)&&!seedLabels.has(normalizeKey(item.label)));
const assetInventory=await buildAssetInventory(process.cwd());
const researchComicAssets=assetInventory.assets.filter(item=>item.lifecycle==='research'&&item.style==='comic').map(item=>({reading:item.reading,ipa:item.ipa,path:item.path,revision:item.revision,clinicalStatus:item.clinicalStatus,references:item.references}));
const activeLocalProduction=assetInventory.assets.filter(item=>item.lifecycle==='production'&&item.active).map(item=>({reading:item.reading,ipa:item.ipa,path:item.path,style:item.style,revision:item.revision,clinicalStatus:item.clinicalStatus,provenance:item.provenance}));

const categoryLabels={
  A_exactFrenchWord:'A — mot français exact disponible',
  B_multipleExactFrenchWords:'B — plusieurs mots français exacts',
  C_exactWordVisualNotReady:'C — mot exact mais aucune image prête/évidente',
  D_obviousOrReadyPictogram:'D — pictogramme exact déjà prêt',
  E_lightApproximation:'E — approximation légère disponible',
  F_exactMultiPictogram:'F — composition exacte de plusieurs pictogrammes',
  G_letter:'G — lettre utilisable',
  H_number:'H — chiffre/nombre utilisable',
  I_noCurrentReasonableRepresentation:'I — aucune représentation raisonnable actuellement disponible'
};

const compactRow=row=>({
  ipa:row.ipa,
  syllableSpans:row.syllableSpans,
  usefulTargetCount:row.usefulTargetCount,
  usefulWeightedGain:row.usefulWeightedGain,
  schoolTargetCount:row.schoolTargetCount,
  researchPriorityScore:row.researchPriorityScore,
  visualStatus:row.visualStatus,
  categories:row.categories,
  exactWords:row.exactLexicalCandidates.slice(0,5),
  nounWords:row.nounLexicalCandidates.slice(0,5),
  exactImages:row.exactImageRepresentations.slice(0,5).map(item=>({id:item.id,label:item.label,image:item.image,source:item.source})),
  exactImageCombinations:row.exactImageCombinations,
  letters:row.letterRepresentations.map(item=>item.label),
  numbers:row.numberRepresentations.map(item=>item.label),
  musicNotes:row.musicRepresentations.map(item=>item.label),
  lightApproximations:row.lightApproximationCandidates.map(item=>({word:item.word,sourceIpa:item.sourceIpa,tier:item.tier,percent:item.editorialApproximationPercent,existingAsset:item.existingAsset,image:item.image||null})),
  usefulExamples:row.usefulExamples.slice(0,6)
});

const usefulRanked=[...usefulRows].sort((a,b)=>b.researchPriorityScore-a.researchPriorityScore||b.usefulWeightedGain-a.usefulWeightedGain||b.usefulTargetCount-a.usefulTargetCount||a.ipa.localeCompare(b.ipa));
const holes=usefulRanked.filter(row=>row.categories.I_noCurrentReasonableRepresentation);
const exactVisualBacklog=usefulRanked.filter(row=>row.categories.C_exactWordVisualNotReady);
const reusableApproximation=usefulRanked.filter(row=>row.lightExistingAssetCandidates.length>0);
const compositionWins=usefulRanked.filter(row=>row.categories.F_exactMultiPictogram&&!row.categories.D_obviousOrReadyPictogram);

const output={
  schemaVersion:'1.0',
  generatedAt:new Date().toISOString(),
  status:'product_research_mapping',
  purpose:'SON/SEGMENT -> mots -> images/conventions/compositions -> qualite phonétique -> état visuel',
  categoryDefinitions:categoryLabels,
  methodology:{
    usefulScope:'Rows with usefulTargetCount > 0 are the product-priority denominator; the exhaustive 1–2 syllable catalog remains canonical and untouched.',
    exactWords:'Lexique whole-pronunciation candidates are evidence of lexical existence, not visual approval.',
    visual:'A ready image is distinct from an exact lexical lead. Curated prototypes remain research until naming evidence exists.',
    combinations:'F routes concatenate 2–3 exact ready-image pronunciations with no deletion or substitution.',
    approximations:'E only reports candidates already classified light by the existing approximation engine; strict eligibility is never inferred.',
    unresolved:'I means no current ready image, exact ready-image composition, visible letter/number/note, curated prototype, or light approximation using an existing asset. An unreviewed Lexique word alone does not count as a reasonable representation.'
  },
  stats,
  queues:{
    currentHoles:holes.slice(0,500).map(compactRow),
    exactWordVisualBacklog:exactVisualBacklog.slice(0,500).map(compactRow),
    reusableLightApproximation:reusableApproximation.slice(0,300).map(compactRow),
    exactCompositionWithoutSingleImage:compositionWins.slice(0,300).map(compactRow)
  },
  usefulRows:usefulRanked.map(compactRow),
  productionVisualBoundary:{
    seedEntryCount:seed.length,
    openLibraryEntryCount:ALL_OPEN_PICTOGRAMS.length,
    openLibraryRuntimeAdditionCount:openRuntimePictograms.length,
    runtimeLexiconCountBeforeOtherMerges:seed.length+openRuntimePictograms.length,
    shadowedOpenPictogramCount:shadowedOpenPictograms.length,
    shadowedOpenPictograms,
    activeLocalProductionCount:activeLocalProduction.length,
    activeLocalProduction,
    activeLegacyStyle:assetInventory.summary.activeLegacyStyle,
    researchComicAssetCount:researchComicAssets.length,
    researchComicAssets,
    explanation:'Production loads lexicon-seed first, then merges OpenMoji waves while skipping duplicate ids/labels. Therefore a seed entry intentionally keeps its local asset even when an OpenMoji pictogram with the same concept exists.'
  }
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');

const percent=(value,total)=>total?`${(value*100/total).toFixed(1)}%`:'0.0%';
const topTable=(items,mapper)=>items.slice(0,40).map(mapper);
const lines=[
  '# Rebulo — audit produit de la banque de représentations',
  '',
  '> Ce rapport mesure la banque réellement exploitable. Il ne remplace ni Lexique 4, ni le catalogue phonétique exhaustif, ni la politique d’approximation, ni les validations humaines.',
  '',
  '## Dénominateur produit',
  '',
  `- Sons/fenêtres utiles distincts : ${stats.useful.soundCount}.`,
  `- Catalogue exhaustif conservé : ${stats.all.soundCount} fenêtres sonores distinctes.`,
  `- Pictogrammes OpenMoji agrégés dans la banque : ${ALL_OPEN_PICTOGRAMS.length}.`,
  `- Entrées locales historiques/canoniques du seed : ${seed.length}.`,
  '',
  '## Cartographie A–I sur les sons utiles',
  '',
  '| Catégorie | Sons | Part des sons utiles |',
  '|---|---:|---:|',
  ...Object.entries(categoryLabels).map(([key,label])=>`| ${label} | ${stats.useful[key]} | ${percent(stats.useful[key],stats.useful.soundCount)} |`),
  '',
  'Les catégories se chevauchent volontairement : un son peut avoir plusieurs mots exacts, une image prête et une lettre. La catégorie I est au contraire une frontière opérationnelle conservatrice.',
  '',
  '## Goulot d’étranglement actuel',
  '',
  `- ${stats.useful.C_exactWordVisualNotReady} sons utiles ont déjà au moins un mot français exact mais pas encore d’image prête/évidente : c’est le principal réservoir à curater avant d’inventer davantage d’heuristiques phonétiques.`,
  `- ${stats.useful.I_noCurrentReasonableRepresentation} sons utiles n’ont actuellement aucune route que la banque considère raisonnablement exploitable.`,
  `- ${stats.useful.F_exactMultiPictogram} sons utiles peuvent déjà être couverts par 2–3 pictogrammes exacts, même sans pictogramme unique.`,
  `- ${stats.useful.E_lightApproximation} sons utiles ont au moins une petite approximation dans la file de recherche ; elle reste générale/non stricte.`,
  '',
  '## Premiers trous à examiner',
  '',
  '| Rang | Son | Cibles utiles | Mot(s) exact(s) | État visuel | Approximation légère | Exemples |',
  '|---:|---|---:|---|---|---|---|',
  ...topTable(holes,(row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.usefulTargetCount} | ${row.exactLexicalCandidates.slice(0,3).map(item=>item.word).join(', ')||'—'} | ${row.visualStatus} | ${row.lightApproximationCandidates.slice(0,2).map(item=>`${item.word} /${item.sourceIpa}/`).join(', ')||'—'} | ${row.usefulExamples.slice(0,4).join(', ')||'—'} |`),
  '',
  '## Exact lexical, mais travail visuel encore à faire',
  '',
  '| Rang | Son | Cibles utiles | Candidats exacts | Statut |',
  '|---:|---|---:|---|---|',
  ...topTable(exactVisualBacklog,(row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.usefulTargetCount} | ${row.exactLexicalCandidates.slice(0,4).map(item=>item.word).join(', ')||'—'} | ${row.visualStatus} |`),
  '',
  '## Compositions exactes déjà disponibles',
  '',
  '| Rang | Son | Route image exacte | Cibles utiles |',
  '|---:|---|---|---:|',
  ...topTable(compositionWins,(row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.exactImageCombinations[0]?.map(piece=>piece.label).join(' + ')||'—'} | ${row.usefulTargetCount} |`),
  '',
  '## Pourquoi les anciens dessins apparaissent encore',
  '',
  `Le runtime charge d’abord les ${seed.length} entrées de \`data/lexicon-seed.json\`, puis ajoute les vagues OpenMoji. Une entrée OpenMoji dont l’id ou le label existe déjà dans le seed est volontairement ignorée : **le seed gagne**. Il y a actuellement ${shadowedOpenPictograms.length} concepts OpenMoji masqués de cette manière. C’est pourquoi remplacer ou ajouter une image dans une autre bibliothèque ne change pas automatiquement le visuel affiché pour un concept déjà présent dans le seed.`,
  '',
  `L’audit local recense ${activeLocalProduction.length} SVG de production actifs. Parmi eux, ${assetInventory.summary.activeLegacyStyle.length} sont encore classés \`legacy_or_external\` par l’audit de style. Ils ne sont pas supprimés : ils forment une file de migration explicite.`,
  '',
  '## Nouveaux dessins retrouvés',
  '',
  `Le dépôt contient ${researchComicAssets.length} assets de recherche au style comic qui ne sont pas automatiquement utilisés en production. Ils sont conservés avec leur révision et leur statut de validation. Exemples : ${researchComicAssets.slice(0,12).map(item=>`${item.reading} (${item.path})`).join(', ')||'—'}.`,
  '',
  '## Décision de boucle',
  '',
  '**CONTINUE — mais sur la banque de représentations.** La prochaine production doit d’abord réduire le backlog C/I par curation de mots exacts et réutilisation d’images/compositions existantes. L’approximation reste un outil de remplissage des trous, pas le chantier principal.'
];
fs.mkdirSync(path.dirname(reportPath),{recursive:true});
fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(JSON.stringify({stats,productionVisualBoundary:output.productionVisualBoundary,currentHoleCount:holes.length,exactWordVisualBacklogCount:exactVisualBacklog.length},null,2));
