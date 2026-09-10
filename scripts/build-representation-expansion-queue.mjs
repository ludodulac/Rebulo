import fs from 'node:fs';
import path from 'node:path';
import {OPEN_PICTOGRAMS} from '../src/open-pictogram-library.js';
import {OPEN_PICTOGRAMS_WAVE_2} from '../src/open-pictogram-library-wave2.js';
import {OPEN_PICTOGRAMS_WAVE_3} from '../src/open-pictogram-library-wave3.js';
import {buildKnownAssetIndex,buildRepresentationExpansionQueue,buildExpansionSubqueues,summarizeExpansionQueue,REPRESENTATION_EXPANSION_POLICY} from '../src/rebus-representation-expansion.js';

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
const queue=buildRepresentationExpansionQueue(landscape.rows||[],assetIndex,{globalLimit:800,twoSyllableReserve:400});
const stats=summarizeExpansionQueue(queue);
const subqueues=buildExpansionSubqueues(queue);
const output={
  schemaVersion:'1.2',generatedAt:new Date().toISOString(),status:'research_mapping_only',
  purpose:'Élargir de façon conservatrice la banque SON → MOT(S) → REPRÉSENTATION en faisant émerger un lot substantiel à fort rendement sans convertir des indices en preuve visuelle.',
  policy:REPRESENTATION_EXPANSION_POLICY,
  selection:{globalYieldLimit:800,twoSyllableReserve:400,note:'Union des 800 sons les plus rentables et des 400 fenêtres de deux syllabes les plus rentables; les doublons sont retirés. Aucun bonus/malus de vérité visuelle.'},
  assetInventory:{activeSeedCount:seed.filter(item=>item?.active!==false&&item?.image).length,openLibraryCount:OPEN_PICTOGRAMS.length+OPEN_PICTOGRAMS_WAVE_2.length+OPEN_PICTOGRAMS_WAVE_3.length,researchFileCount:researchAssets.length,note:'Les assets enregistrés et les correspondances de nom de fichier de recherche sont comptés séparément. Les fichiers de recherche restent des pistes d’inspection uniquement.'},
  stats,subqueues,rows:queue
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');

const laneLabel={asset_existing_to_review:'asset enregistré à examiner/tester',research_asset_lead_to_inspect:'fichier de recherche à inspecter séparément',visible_convention_preferable:'convention visible préférable',multiple_exact_homophones_to_compare:'plusieurs homophones exacts à départager',exact_image_candidate_precheck:'candidat lexical exact à préexaminer',approximation_only_after_rejected_exacts:'approximation ludique seulement après rejets exacts',insufficient_information:'information insuffisante'};
const top=queue.slice(0,200);
const candidateText=row=>row.exactCandidates.slice(0,5).map(c=>`${c.word}${c.knownAssets?.some(a=>a.assetKind!=='research_filename_match')?' [asset enregistré]':''}${c.knownAssets?.some(a=>a.assetKind==='research_filename_match')?' [fichier recherche]':''}${c.proofStatus==='visual_route_rejected'?' [rejet visuel]':c.proofStatus==='visual_hypothesis_curated'?' [hypothèse curatée]':''}`).join(', ')||'—';
const lines=[
  '# Rebulo — file d’expansion SON → MOT(S) → REPRÉSENTATION',
  '',
  '> Cette sortie est une file d’exploration, pas un score de vérité. Fréquence, POS, rendement et présence d’un asset servent à organiser l’examen; ils ne prouvent ni dessinabilité ni nommabilité.',
  '',
  `- Sons sélectionnés : ${stats.soundCount}.`,
  `- Fenêtres de deux syllabes : ${stats.twoSyllableSoundCount}.`,
  `- Sons avec plusieurs homophones exacts : ${stats.multipleExactHomophoneSoundCount}.`,
  `- Sons avec au moins une piste de fichier/asset de même libellé : ${stats.existingAssetSoundCount}.`,
  `- Sons avec au moins un asset enregistré de même libellé : ${stats.registeredAssetSoundCount}.`,
  `- Sons avec seulement/au moins une piste issue d’un nom de fichier de recherche : ${stats.researchAssetLeadSoundCount}.`,
  `- Sons avec asset enregistré dont l’IPA est explicitement enregistrée et exacte : ${stats.registeredPhoneticAssetSoundCount}.`,
  `- Sons avec convention visible : ${stats.visibleConventionSoundCount}.`,
  `- Sons qui nécessitent probablement un nouvel asset si un concept exact est retenu : ${stats.likelyNewAssetSoundCount}.`,
  `- Sons avec risque visuel/lexical déjà documenté : ${stats.highKnownRiskSoundCount}.`,
  `- Sons avec approximation légère disponible séparément : ${stats.approximationAvailableSoundCount}.`,
  `- Sons dont les preuves visuelles restent insuffisantes : ${stats.informationInsufficientSoundCount}.`,
  '',
  '## Répartition des décisions',
  '',
  ...Object.entries(stats.laneCounts).map(([key,value])=>`- ${laneLabel[key]||key} : ${value}.`),
  '',
  '## Files opérationnelles',
  '',
  `- Assets enregistrés à examiner : ${subqueues.existingAssetReview.length} sons (${subqueues.existingAssetReview.slice(0,20).map(x=>`/${x}/`).join(', ')}).`,
  `- Fichiers de recherche à inspecter séparément : ${subqueues.researchAssetLeads.length} sons (${subqueues.researchAssetLeads.slice(0,20).map(x=>`/${x}/`).join(', ')}).`,
  `- Homophones exacts à départager : ${subqueues.multipleExactHomophones.length} sons prioritaires.`,
  `- Conventions visibles préférables : ${subqueues.visibleConventionPreferable.length} sons (${subqueues.visibleConventionPreferable.slice(0,20).map(x=>`/${x}/`).join(', ')}).`,
  `- Préexamen de candidat image exact : ${subqueues.exactImagePrecheck.length} sons prioritaires.`,
  `- Fenêtres de deux syllabes à préserver : ${subqueues.twoSyllableFirstClass.length} sons prioritaires.`,
  `- Pistes susceptibles de nécessiter un nouvel asset : ${subqueues.likelyNewAsset.length} sons prioritaires.`,
  '',
  '## File prioritaire auditable',
  '',
  '| Rang | Son | Cibles utiles | Fenêtre | Candidats exacts retenus | Convention | Assets enregistrés | Fichiers recherche | File de décision |',
  '|---:|---|---:|---|---|---|---:|---:|---|',
  ...top.map((row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.usefulTargetCount} | ${row.syllableSpans.join('/')||'—'} syll. | ${candidateText(row)} | ${row.visibleConventions.map(x=>x.label).join(', ')||'—'} | ${row.registeredAssetCandidateCount} | ${row.researchAssetLeadCandidateCount} | ${laneLabel[row.lane]||row.lane} |`),
  '',
  '## Lecture des propriétés',
  '',
  '- Plusieurs homophones exacts restent visibles ensemble : on ne choisit pas arbitrairement le premier mot Lexique. `additionalExactCandidateCount` signale quand la vue compacte n’affiche pas tous les candidats existants.',
  '- Un asset enregistré déclenche une inspection avant dessin. Un simple nom de fichier de recherche reste dans une file séparée : il ne devient ni un asset enregistré, ni une preuve phonétique, ni une preuve de dénomination.',
  '- Une convention visible peut être préférable lorsque les routes pictographiques exactes connues ont été rejetées/différées ou que les formes lexicales disponibles sont descriptivement de mauvais supports pictographiques. Cette file reste éditoriale.',
  '- Une fenêtre de deux syllabes reste une pièce de première classe et peut rivaliser avec plusieurs briques courtes.',
  '- `likelyNeedsNewAsset` signifie seulement qu’aucun asset/convention/piste de fichier connu ne couvre la piste viable; cela ne signifie pas que le concept mérite déjà d’être dessiné.',
  '',
  '## Prochaine utilisation',
  '',
  'Former les prochains lots de curation à partir de plusieurs files : assets enregistrés à examiner, fichiers de recherche à inspecter, homophones exacts à départager, fenêtres longues prometteuses et pistes sans asset. Les observations humaines servent ensuite à apprendre quels motifs sont réellement généralisables; elles ne sont jamais simulées.'
];
fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(JSON.stringify(stats,null,2));
