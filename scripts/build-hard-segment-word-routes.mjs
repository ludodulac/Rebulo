import fs from 'node:fs';
import path from 'node:path';
import {buildHardSegmentWordRoutes,hardSegmentWordRouteStats} from '../src/hard-segment-word-routes.js';
import {mergeProductivityInventory} from '../src/phonetic-productivity.js';
import {OPEN_PICTOGRAMS} from '../src/open-pictogram-library.js';
import {OPEN_PICTOGRAMS_WAVE_2} from '../src/open-pictogram-library-wave2.js';
import {OPEN_PICTOGRAMS_WAVE_3} from '../src/open-pictogram-library-wave3.js';

const brickMapPath=process.argv[2]||'data/phonetic-brick-map.json';
const strategyPath=process.argv[3]||'data/hard-segment-strategies.json';
const jsonOutput=process.argv[4]||'data/hard-segment-word-routes.json';
const markdownOutput=process.argv[5]||'docs/HARD_SEGMENT_WORD_ROUTES.md';
if(!fs.existsSync(brickMapPath)){console.error(`Cartographie absente: ${brickMapPath}`);process.exit(1);}
if(!fs.existsSync(strategyPath)){console.error(`Stratégies absentes: ${strategyPath}`);process.exit(1);}
const brickMap=JSON.parse(fs.readFileSync(brickMapPath,'utf8'));
const strategies=JSON.parse(fs.readFileSync(strategyPath,'utf8'));
const visualCandidateBank=JSON.parse(fs.readFileSync('data/phonetic-brick-candidates.json','utf8'));
const seed=JSON.parse(fs.readFileSync('data/lexicon-seed.json','utf8'));
const technicalInventory=mergeProductivityInventory(seed,[...OPEN_PICTOGRAMS,...OPEN_PICTOGRAMS_WAVE_2,...OPEN_PICTOGRAMS_WAVE_3]);
const rows=buildHardSegmentWordRoutes(strategies.segments||[],brickMap.topBrickOpportunities||[],technicalInventory,{maxOperations:4,maxRoutesPerTarget:5,visualCandidateBank});
const stats=hardSegmentWordRouteStats(rows);
const report={
  generatedAt:new Date().toISOString(),
  status:'research_only',
  sourceBrickMapGeneratedAt:brickMap.generatedAt||null,
  strategyVersion:strategies.version||null,
  visualCandidateBankVersion:visualCandidateBank.version||null,
  methodology:{
    exactness:'Every route reconstructs the complete target IPA with complete visible operation readings.',
    alternateRequirement:'A route must use the tested alternative brick and contain at least two operations; trivial whole-target replacement is excluded.',
    representationReadiness:'Exact phonetic routes are counted separately from routes whose tested alternative has a non-trivial lexical representation candidate. Single-letter Lexique artifacts never make a route representation-ready.',
    visualResearchReadiness:'A lexical candidate counts as visually curated only when the same whole word and IPA already exist in the research candidate bank with an explicit pictogram/scene concept and a non-rejected visual research decision. This remains research-only, not naming validation.',
    strictPreference:'Strict routes rank before general routes. General routes remain explicit and visible only.',
    activation:'No route, lexical lead, pictogram, scene or grapheme is activated by this report.'
  },
  stats,
  segments:rows
};
fs.mkdirSync(path.dirname(jsonOutput),{recursive:true});
fs.writeFileSync(jsonOutput,JSON.stringify(report,null,2));

const opLabel=operation=>operation.type==='whole_word'?`${operation.label||operation.pieceId} /${operation.ipa}/`:`${operation.grapheme} /${operation.ipa}/`;
const lines=[
  '# Rebulo — routes mot-par-mot pour segments difficiles','',
  `- Segments analysés : ${stats.segmentCount}.`,
  `- Cibles utiles concernées : ${stats.targetCount}.`,
  `- Cibles avec au moins une route phonétiquement exacte : ${stats.targetsWithAlternativeRoutes}.`,
  `- Cibles dont une route exacte dispose aussi d’un candidat lexical de représentation : ${stats.targetsWithRepresentableAlternativeRoutes}.`,
  `- Cibles dont une route dispose déjà d’un candidat visuel curaté en recherche : ${stats.targetsWithCuratedVisualAlternativeRoutes}.`,
  `- Cibles sans aucune route exacte : ${stats.targetsStillBlocked}.`,
  `- Cibles qui nécessitent encore un candidat lexical de représentation : ${stats.targetsStillNeedingRepresentableAlternative}.`,
  `- Cibles qui nécessitent encore une piste visuelle curatée : ${stats.targetsStillNeedingCuratedVisualAlternative}.`,
  `- Cibles avec route alternative stricte : ${stats.strictAlternativeTargets}.`,
  `- Cibles avec route stricte et candidat lexical de représentation : ${stats.strictRepresentableAlternativeTargets}.`,
  `- Cibles avec route stricte et candidat visuel curaté : ${stats.strictCuratedVisualAlternativeTargets}.`,
  `- Cibles avec au moins une route générale visible : ${stats.generalAlternativeTargets}.`,'',
  '> Exactitude phonétique ≠ représentation lexicale ≠ piste visuelle curatée ≠ validation de dénomination. Une entrée Lexique d’une seule lettre ne compte jamais comme candidat pictographiable. Rien dans ce rapport n’est activé automatiquement.',''
];
for(const segment of rows){
  lines.push(`## /${segment.ipa}/ — ${segment.strategy}`,'',`- ${segment.targetsWithAlternativeRoutes}/${segment.targetCount} cibles ont une route phonétiquement exacte; ${segment.targetsWithRepresentableAlternativeRoutes}/${segment.targetCount} ont une piste lexicale; ${segment.targetsWithCuratedVisualAlternativeRoutes}/${segment.targetCount} ont déjà une piste visuelle curatée; ${segment.targetsStillNeedingCuratedVisualAlternative} nécessitent encore une piste visuelle.`,'');
  lines.push('| Mot | IPA | Route exacte | Lexical | Visuel curaté | Meilleure route | Nouvelle brique | Prochaine porte |','|---|---|---|---|---|---|---|---|');
  for(const target of segment.targets){
    const visual=(target.routes||[]).find(route=>route.visualResearchStatus==='curated_visual_research_candidate');
    const representable=(target.routes||[]).find(route=>route.representationStatus==='lexical_representation_candidate');
    const route=visual||representable||target.routes?.[0];
    const routeText=route?(route.operations||[]).map(opLabel).join(' + '):'—';
    const visualLead=route?.visualResearchLeads?.[0]||null;
    const lexical=(route?.representationLeads||[]).map(item=>item.word).filter(Boolean).slice(0,3).join(', ')||'—';
    const newBrick=visualLead?.label||lexical;
    const nextGate=visualLead?.nextGate||'—';
    lines.push(`| ${target.word} | /${target.targetIpa}/ | ${target.resolutionState} | ${target.representationResolutionState} | ${target.visualResolutionState} | ${routeText} | ${newBrick} | ${nextGate} |`);
  }
  lines.push('');
}
fs.mkdirSync(path.dirname(markdownOutput),{recursive:true});
fs.writeFileSync(markdownOutput,lines.join('\n')+'\n');
console.log(`Hard segment routes: ${stats.targetsWithAlternativeRoutes}/${stats.targetCount} exact; ${stats.targetsWithRepresentableAlternativeRoutes} lexical; ${stats.targetsWithCuratedVisualAlternativeRoutes} visually curated research candidates; ${stats.targetsStillNeedingCuratedVisualAlternative} still need visual research.`);
console.log(`Wrote ${jsonOutput} and ${markdownOutput}`);
