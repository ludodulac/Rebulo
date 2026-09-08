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
const seed=JSON.parse(fs.readFileSync('data/lexicon-seed.json','utf8'));
const technicalInventory=mergeProductivityInventory(seed,[...OPEN_PICTOGRAMS,...OPEN_PICTOGRAMS_WAVE_2,...OPEN_PICTOGRAMS_WAVE_3]);
const rows=buildHardSegmentWordRoutes(strategies.segments||[],brickMap.topBrickOpportunities||[],technicalInventory,{maxOperations:4,maxRoutesPerTarget:5});
const stats=hardSegmentWordRouteStats(rows);
const report={
  generatedAt:new Date().toISOString(),
  status:'research_only',
  sourceBrickMapGeneratedAt:brickMap.generatedAt||null,
  strategyVersion:strategies.version||null,
  methodology:{
    exactness:'Every route reconstructs the complete target IPA with complete visible operation readings.',
    alternateRequirement:'A route must use the tested alternative brick and contain at least two operations; trivial whole-target replacement is excluded.',
    strictPreference:'Strict routes rank before general routes. General routes remain explicit and visible only.',
    activation:'No route, lexical lead, pictogram or grapheme is activated by this report.'
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
  `- Cibles avec au moins une route alternative exacte : ${stats.targetsWithAlternativeRoutes}.`,
  `- Cibles encore bloquées : ${stats.targetsStillBlocked}.`,
  `- Cibles avec route alternative stricte : ${stats.strictAlternativeTargets}.`,
  `- Cibles avec au moins une route générale visible : ${stats.generalAlternativeTargets}.`,'',
  '> Une route n’est comptée que si elle reconstruit toute la prononciation, utilise réellement la brique alternative testée et comporte au moins deux opérations. Rien ici n’est activé automatiquement.',''
];
for(const segment of rows){
  lines.push(`## /${segment.ipa}/ — ${segment.strategy}`,'',`- ${segment.targetsWithAlternativeRoutes}/${segment.targetCount} cibles ont une route exacte concurrente; ${segment.targetsStillBlocked} restent réellement bloquées.`,'');
  lines.push('| Mot | IPA | État | Meilleure route alternative | Piste lexicale de la nouvelle brique |','|---|---|---|---|---|');
  for(const target of segment.targets){
    const route=target.routes?.[0];
    const routeText=route?(route.operations||[]).map(opLabel).join(' + '):'—';
    const leads=route?(route.lexicalLeads||[]).map(item=>item.word).filter(Boolean).slice(0,3).join(', ')||'—':'—';
    lines.push(`| ${target.word} | /${target.targetIpa}/ | ${target.resolutionState} | ${routeText} | ${leads} |`);
  }
  lines.push('');
}
fs.mkdirSync(path.dirname(markdownOutput),{recursive:true});
fs.writeFileSync(markdownOutput,lines.join('\n')+'\n');
console.log(`Hard segment routes: ${stats.targetsWithAlternativeRoutes}/${stats.targetCount} targets have exact alternatives; ${stats.targetsStillBlocked} remain blocked.`);
console.log(`Wrote ${jsonOutput} and ${markdownOutput}`);
