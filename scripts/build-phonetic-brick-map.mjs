import fs from 'node:fs';
import path from 'node:path';
import {buildTargetVocabulary,targetVocabularyStats} from '../src/target-vocabulary.js';
import {
  buildPhoneticSegmentInventory,
  classifySegmentInventory,
  analyzeTargetConstructibility,
  buildSegmentResearchQueue,
  rankBrickOpportunities,
  rankVisualResearchLeads
} from '../src/phonetic-brick-map.js';
import {mergeProductivityInventory} from '../src/phonetic-productivity.js';
import {OPEN_PICTOGRAMS} from '../src/open-pictogram-library.js';
import {OPEN_PICTOGRAMS_WAVE_2} from '../src/open-pictogram-library-wave2.js';
import {OPEN_PICTOGRAMS_WAVE_3} from '../src/open-pictogram-library-wave3.js';

const input=process.argv[2]||'data/lexique4.compact.json';
const output=process.argv[3]||'data/phonetic-brick-map.json';
const markdownOutput=process.argv[4]||'docs/PHONETIC_BRICK_MAP.md';

if(!fs.existsSync(input)){
  console.error(`Lexique compact introuvable: ${input}`);
  process.exit(1);
}

const source=JSON.parse(fs.readFileSync(input,'utf8'));
const entries=Array.isArray(source?.entries)?source.entries:[];
const seed=JSON.parse(fs.readFileSync('data/lexicon-seed.json','utf8'));
const technicalInventory=mergeProductivityInventory(seed,[...OPEN_PICTOGRAMS,...OPEN_PICTOGRAMS_WAVE_2,...OPEN_PICTOGRAMS_WAVE_3]);
const targets=buildTargetVocabulary(entries);
const targetStats=targetVocabularyStats(targets);
const segments=buildPhoneticSegmentInventory(targets,{minUnits:1,maxUnits:5});
const classifiedSegments=classifySegmentInventory(segments,technicalInventory,4);
const segmentCoverageCounts={whole_word:0,composite_words:0,explicit_grapheme:0,uncovered:0};
for(const row of classifiedSegments)segmentCoverageCounts[row.coverage.coverageType]=(segmentCoverageCounts[row.coverage.coverageType]||0)+1;
const targetCoverage=analyzeTargetConstructibility(targets,technicalInventory,4);
const researchQueue=buildSegmentResearchQueue(classifiedSegments,entries,{candidateLimit:8,maxSegments:250});
const opportunities=rankBrickOpportunities(researchQueue,targets,technicalInventory,{limit:60,maxOperations:4});
const visualResearchLeads=rankVisualResearchLeads(opportunities,{limit:60});

const report={
  generatedAt:new Date().toISOString(),
  source:source?.source||'Lexique 4',
  sourceLicense:source?.license||'CC BY-SA 4.0',
  status:'research_mapping_only',
  methodology:{
    targetVocabulary:'One preferred lexical form per eligible lemma; age bands remain heuristic preselection, not acquisition ages.',
    segments:'All contiguous IPA-unit sequences of length 1 to 5 found inside target pronunciations. These are candidate rebus segments, not asserted linguistic syllables.',
    validity:'All coverage is exact concatenation of complete visible brick readings. Letters are explicit general-mode operations only.',
    candidateSearch:'Whole Lexique entries whose complete IPA pronunciation exactly equals an uncovered segment.',
    gain:'For each prioritized segment, add one virtual exact whole-word brick and count previously unresolved target words that become exactly constructible.',
    researchPriority:'A separate automatic research score combines coverage gain, segment size and existence of plausible lexical candidates. It is a queueing heuristic only, never a visual-validity score.',
    visualCaution:'Lexical exactness never implies imageability, spontaneous naming, age suitability, or clinical validation.'
  },
  targetVocabulary:targetStats,
  technicalInventoryCount:technicalInventory.length,
  targetCoverage:targetCoverage.counts,
  segmentInventoryCount:classifiedSegments.length,
  segmentCoverageCounts,
  researchQueueStats:{
    retained:researchQueue.length,
    withExactWholeWordCandidates:researchQueue.filter(row=>row.wholeWordCandidates.length>0).length,
    withoutExactWholeWordCandidates:researchQueue.filter(row=>row.wholeWordCandidates.length===0).length
  },
  topVisualResearchLeads:visualResearchLeads,
  topBrickOpportunities:opportunities,
  topUncoveredSegments:researchQueue.slice(0,120)
};

fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2));

const pct=(n,d)=>d?`${(100*n/d).toFixed(1)} %`:'0 %';
const totalTargets=targetStats.total;
const top=opportunities.slice(0,30);
const visualTop=visualResearchLeads.slice(0,30);
const candidateLabels=(row,key='wholeWordCandidates')=>(row[key]||[]).slice(0,4).map(x=>x.word).join(', ')||'—';
const lines=[
  '# Rebulo — cartographie des briques phonétiques',
  '',
  `- Vocabulaire cible présélectionné : ${totalTargets} lemmes.`,
  `- Segments IPA candidats inventoriés : ${classifiedSegments.length}.`,
  `- Inventaire pictographique technique analysé : ${technicalInventory.length} concepts.`,
  `- Cibles couvertes par une image entière : ${targetCoverage.counts.whole_image} (${pct(targetCoverage.counts.whole_image,totalTargets)}).`,
  `- Cibles couvertes par plusieurs images : ${targetCoverage.counts.image_composition} (${pct(targetCoverage.counts.image_composition,totalTargets)}).`,
  `- Cibles couvertes avec au moins une lettre explicite : ${targetCoverage.counts.image_plus_letter} (${pct(targetCoverage.counts.image_plus_letter,totalTargets)}).`,
  `- Cibles encore non résolues : ${targetCoverage.counts.unresolved} (${pct(targetCoverage.counts.unresolved,totalTargets)}).`,
  '',
  'Les segments ci-dessous sont des **séquences IPA utiles au rébus**. Ils ne sont pas automatiquement des syllabes linguistiques. Les candidats lexicaux ont une prononciation entière exacte, mais leur qualité visuelle et leur dénomination restent à valider.',
  '',
  '## Priorités de recherche de représentations',
  '',
  'Ce classement pénalise les sons unitaires sans candidat lexical naturel et favorise les segments réutilisables avec plusieurs pistes lexicales. Il sert uniquement à organiser la recherche humaine/visuelle.',
  '',
  '| Rang | Segment | Route de recherche | Mots débloqués | Images seules | Candidats à examiner |',
  '|---:|---|---|---:|---:|---|',
  ...visualTop.map((row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.researchRoute} | ${row.totalUnlocked} | ${row.strictUnlocked} | ${candidateLabels(row,'plausibleLexicalCandidates')} |`),
  '',
  '## Rendement phonétique brut',
  '',
  '| Rang | Segment | Mots débloqués | Dont images seules | Fréquence pondérée | Candidats lexicaux exacts | Exemples débloqués |',
  '|---:|---|---:|---:|---:|---|---|',
  ...top.map((row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.totalUnlocked} | ${row.strictUnlocked} | ${row.weightedGain} | ${candidateLabels(row)} | ${(row.examplesUnlocked||[]).slice(0,5).join(', ')||'—'} |`),
  '',
  '## Règles de lecture du rapport',
  '',
  '- **Mot débloqué** signifie uniquement : construction phonétique exacte avec la brique virtuelle ajoutée.',
  '- Un candidat lexical reste `research_only` tant que sa représentation visuelle et sa dénomination spontanée ne sont pas évaluées.',
  '- Le score de priorité de recherche n’est pas un score de qualité visuelle : les champs visuels, de dénomination, d’âge et cliniques restent explicitement à revoir.',
  '- Une lettre n’est jamais comptée comme une brique stricte : elle reste une opération générale explicitement visible.',
  '- Le classement sert à décider **quoi chercher à illustrer d’abord**, pas à autoriser automatiquement une illustration.'
];
fs.mkdirSync(path.dirname(markdownOutput),{recursive:true});
fs.writeFileSync(markdownOutput,lines.join('\n')+'\n');

console.log(`Target vocabulary: ${totalTargets}`);
console.log(`Segments: ${classifiedSegments.length}; research queue: ${researchQueue.length}`);
console.log(`Target coverage: ${JSON.stringify(targetCoverage.counts)}`);
console.log(`Wrote ${output} and ${markdownOutput}`);
