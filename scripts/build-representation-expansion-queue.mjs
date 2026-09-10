import fs from 'node:fs';
import path from 'node:path';
import {OPEN_PICTOGRAMS} from '../src/open-pictogram-library.js';
import {OPEN_PICTOGRAMS_WAVE_2} from '../src/open-pictogram-library-wave2.js';
import {OPEN_PICTOGRAMS_WAVE_3} from '../src/open-pictogram-library-wave3.js';
import {buildKnownAssetIndex,buildRepresentationExpansionQueue,summarizeExpansionQueue,REPRESENTATION_EXPANSION_POLICY} from '../src/rebus-representation-expansion.js';

const landscapePath=process.argv[2]||'data/rebus-representation-landscape.json';
const seedPath=process.argv[3]||'data/lexicon-seed.json';
const outputPath=process.argv[4]||'data/rebus-representation-expansion-queue.json';
const reportPath=process.argv[5]||'docs/REBUS_REPRESENTATION_EXPANSION_QUEUE.md';
for(const file of [landscapePath,seedPath])if(!fs.existsSync(file)){console.error(`Missing required file: ${file}`);process.exit(1);}

function normalizeResearchLabel(filename=''){
  return String(filename).replace(/\.[^.]+$/,'').split('-')[0].replace(/_/g,' ').trim();
}
function listResearchAssets(root='assets/research'){
  if(!fs.existsSync(root))return [];
  return fs.readdirSync(root,{withFileTypes:true}).filter(entry=>entry.isFile()).map(entry=>({path:path.join(root,entry.name).replace(/\\/g,'/'),inferredLabel:normalizeResearchLabel(entry.name)}));
}

const landscape=JSON.parse(fs.readFileSync(landscapePath,'utf8'));
const seed=JSON.parse(fs.readFileSync(seedPath,'utf8'));
const researchAssets=listResearchAssets();
const assetIndex=buildKnownAssetIndex({seed,openLibraries:[OPEN_PICTOGRAMS,OPEN_PICTOGRAMS_WAVE_2,OPEN_PICTOGRAMS_WAVE_3],researchAssets});
const queue=buildRepresentationExpansionQueue(landscape.rows||[],assetIndex,{globalLimit:600,twoSyllableReserve:300});
const stats=summarizeExpansionQueue(queue);
const output={
  schemaVersion:'1.0',generatedAt:new Date().toISOString(),status:'research_mapping_only',
  purpose:'Élargir de façon conservatrice la banque SON → MOT(S) → REPRÉSENTATION en faisant émerger un lot substantiel à fort rendement sans convertir des indices en preuve visuelle.',
  policy:REPRESENTATION_EXPANSION_POLICY,
  selection:{globalYieldLimit:600,twoSyllableReserve:300,note:'Union des 600 sons les plus rentables et des 300 fenêtres de deux syllabes les plus rentables; les doublons sont retirés. Aucun bonus/malus de vérité visuelle.'},
  assetInventory:{activeSeedCount:seed.filter(item=>item?.active!==false&&item?.image).length,openLibraryCount:OPEN_PICTOGRAMS.length+OPEN_PICTOGRAMS_WAVE_2.length+OPEN_PICTOGRAMS_WAVE_3.length,researchFileCount:researchAssets.length,note:'Les correspondances de nom de fichier de recherche sont des pistes d’inspection uniquement.'},
  stats,rows:queue
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');

const laneLabel={asset_existing_to_review:'asset existant à examiner/tester',visible_convention_preferable:'convention visible préférable',multiple_exact_homophones_to_compare:'plusieurs homophones exacts à départager',exact_image_candidate_precheck:'candidat lexical exact à préexaminer',approximation_only_after_rejected_exacts:'approximation ludique seulement après rejets exacts',insufficient_information:'information insuffisante'};
const top=queue.slice(0,180);
const candidateText=row=>row.exactCandidates.slice(0,5).map(c=>`${c.word}${c.knownAssets?.length?' [asset]':''}${c.proofStatus==='visual_route_rejected'?' [rejet visuel]':c.proofStatus==='visual_hypothesis_curated'?' [hypothèse curatée]':''}`).join(', ')||'—';
const lines=[
  '# Rebulo — file d’expansion SON → MOT(S) → REPRÉSENTATION',
  '',
  '> Cette sortie est une file d’exploration, pas un score de vérité. Fréquence, POS, rendement et présence d’un asset servent à organiser l’examen; ils ne prouvent ni dessinabilité ni nommabilité.',
  '',
  `- Sons sélectionnés : ${stats.soundCount}.`,
  `- Fenêtres de deux syllabes : ${stats.twoSyllableSoundCount}.`,
  `- Sons avec plusieurs homophones exacts : ${stats.multipleExactHomophoneSoundCount}.`,
  `- Sons avec au moins un asset de même libellé : ${stats.existingAssetSoundCount}.`,
  `- Sons avec asset dont l’IPA enregistrée correspond exactement : ${stats.phoneticAssetSoundCount}.`,
  `- Sons avec convention visible : ${stats.visibleConventionSoundCount}.`,
  `- Sons qui nécessitent probablement un nouvel asset si un concept exact est retenu : ${stats.likelyNewAssetSoundCount}.`,
  `- Sons avec risque visuel/lexical déjà documenté : ${stats.highKnownRiskSoundCount}.`,
  `- Sons avec approximation légère disponible séparément : ${stats.approximationAvailableSoundCount}.`,
  '',
  '## Répartition des décisions',
  '',
  ...Object.entries(stats.laneCounts).map(([key,value])=>`- ${laneLabel[key]||key} : ${value}.`),
  '',
  '## File prioritaire auditable',
  '',
  '| Rang | Son | Cibles utiles | Fenêtre | Candidats exacts retenus | Convention | Asset exact IPA | File de décision |',
  '|---:|---|---:|---|---|---|---|---|',
  ...top.map((row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.usefulTargetCount} | ${row.syllableSpans.join('/')||'—'} syll. | ${candidateText(row)} | ${row.visibleConventions.map(x=>x.label).join(', ')||'—'} | ${row.phoneticAssetCandidateCount} | ${laneLabel[row.lane]||row.lane} |`),
  '',
  '## Lecture des propriétés',
  '',
  '- Plusieurs homophones exacts restent visibles ensemble : on ne choisit pas arbitrairement le premier mot Lexique.',
  '- Un asset existant déclenche une inspection avant dessin; il ne devient pas preuve de dénomination.',
  '- Une convention visible peut être préférable lorsque les routes pictographiques exactes connues ont été rejetées ou différées.',
  '- Une fenêtre de deux syllabes reste une pièce de première classe et peut rivaliser avec plusieurs briques courtes.',
  '- `likelyNeedsNewAsset` signifie seulement qu’aucun asset/convention connu ne couvre la piste viable; cela ne signifie pas que le concept mérite déjà d’être dessiné.',
  '',
  '## Prochaine utilisation',
  '',
  'Former les prochains lots de curation à partir de plusieurs files : assets existants à examiner, homophones exacts à départager, fenêtres longues prometteuses et pistes sans asset. Les observations humaines servent ensuite à apprendre quels motifs sont réellement généralisables; elles ne sont jamais simulées.'
];
fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(JSON.stringify(stats,null,2));
