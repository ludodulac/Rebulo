import fs from 'node:fs';
import path from 'node:path';
import {representationLandscapeRows} from '../src/rebus-representation-landscape.js';

const auditPath=process.argv[2]||'data/rebus-representation-bank-audit.json';
const curationPath=process.argv[3]||'data/rebus-sound-visual-curation.json';
const conventionPath=process.argv[4]||'data/rebus-visible-conventions.json';
const approximationPath=process.argv[5]||'.cache/rebus-approximation-research.json';
const outputPath=process.argv[6]||'data/rebus-representation-landscape.json';
const reportPath=process.argv[7]||'docs/REBUS_REPRESENTATION_LANDSCAPE.md';
for(const file of [auditPath,curationPath,conventionPath])if(!fs.existsSync(file)){console.error(`Missing required file: ${file}`);process.exit(1);}

const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
const curation=JSON.parse(fs.readFileSync(curationPath,'utf8'));
const conventions=JSON.parse(fs.readFileSync(conventionPath,'utf8'));
const exactBacklog=(audit.usefulRows||[]).filter(row=>row?.categories?.C_exactWordVisualNotReady);

function approximationMapFromAudit(rows=[]){
  const map=new Map();
  for(const row of rows){
    const candidates=(row.lightApproximations||[]).map(item=>({
      word:item.word||'',sourceIpa:item.sourceIpa||'',targetIpa:row.ipa,pos:'',frequency:0,
      approximation:{tier:item.tier||'light',editorialApproximationPercent:item.percent??null,operations:[]}
    }));
    if(candidates.length)map.set(row.ipa,candidates);
  }
  return map;
}

function approximationMapFromResearch(report={}){
  const map=new Map();
  for(const row of report.rows||[]){
    const candidates=(row.candidates||[]).map(item=>({
      word:item.word||'',pos:item.pos||'',frequency:Number(item.frequency)||0,sourceIpa:item.sourceIpa||'',targetIpa:row.ipa,
      approximation:{tier:item.tier||item.approximation?.tier||null,editorialApproximationPercent:item.editorialApproximationPercent??item.percent??item.approximation?.editorialApproximationPercent??null,operations:item.operations||item.approximation?.operations||[]}
    }));
    if(candidates.length)map.set(row.ipa,candidates);
  }
  return map;
}

let approximationByIpa=approximationMapFromAudit(exactBacklog);
let approximationSource='representation_bank_audit_compact';
if(fs.existsSync(approximationPath)){
  approximationByIpa=approximationMapFromResearch(JSON.parse(fs.readFileSync(approximationPath,'utf8')));
  approximationSource='full_approximation_research';
}

const rows=representationLandscapeRows(exactBacklog,curation,conventions,approximationByIpa,{candidateLimit:8});
const statusCounts={};for(const row of rows)statusCounts[row.evidenceStatus]=(statusCounts[row.evidenceStatus]||0)+1;
const twoSyllable=rows.filter(row=>row.longWindowPotential?.coversTwoSyllables);
const curated=rows.filter(row=>row.curatedVisualHypothesisCount>0);
const conventionsOnlyOrAvailable=rows.filter(row=>row.visibleConventionCount>0);
const approximate=rows.filter(row=>row.approximateCandidateCount>0);
const difficult=rows.filter(row=>row.evidenceStatus==='difficult_sound');
const output={
  schemaVersion:'1.0',generatedAt:new Date().toISOString(),status:'research_mapping_only',
  purpose:'SON -> candidats lexicaux -> type de représentation -> potentiel visuel -> risque de dénomination -> rendement utile -> statut de preuve',
  proofLadder:['phonetic_exactness','general_rebus_approximation','lexical_relevance','drawable_concept','spontaneous_namability','orthophonic_validation'],
  methodology:{
    denominator:'All useful sounds currently classified C_exactWordVisualNotReady in the representation-bank audit; this is the large exact lexical reservoir, not a list of approved images.',
    visualPrediction:'Only explicit curation contributes visualPotential or namingRisk. Unreviewed lexical candidates remain unknown; noun/frequency metadata are cues, not visual truth.',
    conventions:'Letters, numbers and notes are represented as explicit visible conventions and remain distinct from pictograms.',
    approximations:`Approximation evidence source: ${approximationSource}. Approximate routes never become strict or clinically eligible from this map.`,
    longWindows:'One- and two-syllable windows compete. A two-syllable exact concept is retained as a first-class route and is not downgraded merely because it covers more sound.',
    activation:'Nothing in this landscape activates an image or grants clinical status.'
  },
  stats:{exactLexicalBacklogSoundCount:rows.length,curatedVisualHypothesisSoundCount:curated.length,twoSyllableSoundCount:twoSyllable.length,visibleConventionSoundCount:conventionsOnlyOrAvailable.length,approximationSoundCount:approximate.length,difficultSoundCount:difficult.length,statusCounts},
  rows
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');

const rankRows=items=>[...items].sort((a,b)=>b.usefulTargetCount-a.usefulTargetCount||b.usefulWeightedGain-a.usefulWeightedGain||a.ipa.localeCompare(b.ipa));
const top=rankRows(rows).slice(0,120);const topTwo=rankRows(twoSyllable).slice(0,60);
const candidateCell=row=>row.exactCandidates.slice(0,4).map(item=>`${item.word} [${item.proofStatus}]`).join(', ')||'—';
const lines=[
  '# Rebulo — cartographie SON → MOT → REPRÉSENTATION',
  '',
  '> Cette vue transforme le grand réservoir lexical exact en carte de décision. Elle ne convertit pas un homophone Lexique en pictogramme validé.',
  '',
  `- Sons utiles avec mot exact mais représentation visuelle non prête : ${rows.length}.`,
  `- Sons possédant déjà une hypothèse visuelle explicitement curatée : ${curated.length}.`,
  `- Fenêtres de deux syllabes conservées comme candidates de première classe : ${twoSyllable.length}.`,
  `- Sons ayant aussi une convention visible explicite : ${conventionsOnlyOrAvailable.length}.`,
  `- Sons ayant une approximation légère recensée dans la source disponible : ${approximate.length}.`,
  '',
  '## Échelle de preuve',
  '',
  '`phonétiquement exact ≠ approximation ludique acceptable ≠ mot pertinent ≠ concept dessinable ≠ image spontanément nommable ≠ stimulus orthophonique validé`',
  '',
  'Les champs de potentiel visuel et de risque de dénomination restent `unknown` tant qu’une décision éditoriale ou une observation humaine ne les renseigne pas. Le POS `NOM` et la fréquence ne sont jamais promus au rang de preuve visuelle.',
  '',
  '## Priorités informatives',
  '',
  '| Rang | Son | Cibles utiles | Fenêtre | Candidats exacts | Convention | Approx. | État de preuve |',
  '|---:|---|---:|---|---|---|---|---|',
  ...top.map((row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.usefulTargetCount} | ${row.syllableSpans.join('/')||'—'} syll. | ${candidateCell(row)} | ${row.visibleConventions.map(item=>item.label).join(', ')||'—'} | ${row.approximateCandidates.slice(0,2).map(item=>`${item.word} (${item.editorialApproximationPercent??'?'}%)`).join(', ')||'—'} | ${row.evidenceStatus} |`),
  '',
  '## Fenêtres de deux syllabes à ne pas casser artificiellement',
  '',
  '| Rang | Son | Cibles utiles | Meilleure piste actuelle | État | Exemples |',
  '|---:|---|---:|---|---|---|',
  ...topTwo.map((row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.usefulTargetCount} | ${row.longWindowPotential.candidate||'—'} | ${row.longWindowPotential.status} | ${row.usefulExamples.slice(0,4).join(', ')||'—'} |`),
  '',
  '## Boucle d’apprentissage',
  '',
  'Les prototypes servent d’étalons : chaque observation de dénomination doit modifier les propriétés de sélection seulement si elle révèle un motif généralisable (fréquence, ambiguïté d’objet, concurrence lexicale, simplicité de scène, etc.). On corrige alors la curation ou le modèle de priorité avant d’industrialiser une vague graphique.',
  '',
  '## Décision',
  '',
  '**CONTINUE — cartographier largement et prototyper parcimonieusement.** La prochaine preuve utile est une meilleure séparation entre bonnes pistes visuelles et homophones exacts trompeurs, vérifiée périodiquement sur des phrases naturelles.'
];
fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(JSON.stringify(output.stats,null,2));
