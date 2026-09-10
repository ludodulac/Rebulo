import fs from 'node:fs';
import path from 'node:path';
import {planPhraseRepresentationPaths} from '../src/rebus-phrase-phonetics.js';
import {splitIPAUnits} from '../src/phonetic-engine.js';

const lexiconPath=process.argv[2]||'data/rebus-pronunciation-lexicon.json';
const auditPath=process.argv[3]||'data/rebus-representation-bank-audit.json';
const outputPath=process.argv[4]||'data/rebus-real-phrase-benchmark.json';
const reportPath=process.argv[5]||'docs/REBUS_REAL_PHRASE_BENCHMARK.md';
for(const file of [lexiconPath,auditPath])if(!fs.existsSync(file)){console.error(`Missing required file: ${file}`);process.exit(1);}
const lexicon=JSON.parse(fs.readFileSync(lexiconPath,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
const bankRows=audit.usefulRows||[];

const phrases=[
  'Elles ne sont pas cuites les pâtes',
  'Elle a mis le livre sur la table',
  'Le petit chat regarde la pluie',
  'On prépare un gâteau pour demain',
  'Tu prends le train ce matin',
  'Il range son manteau dans la voiture'
];

function routeSignature(route={}){return (route.operations||[]).map(item=>`${item.kind}:${item.targetIpa}:${item.label||item.symbol||''}`).join('|');}
function summarizePhrase(phrase){
  const result=planPhraseRepresentationPaths(phrase,lexicon,bankRows,{mode:'general',limit:20,maxPieces:18,allowGaps:true});
  const routes=result.routes||[];
  const complete=routes.filter(route=>route.complete);
  const distinct=new Set(complete.map(routeSignature));
  const crossWord=complete.filter(route=>route.crossWordOperationCount>0);
  const longestPiece=Math.max(0,...routes.flatMap(route=>(route.operations||[]).filter(item=>item.kind!=='gap').map(item=>splitIPAUnits(item.targetIpa||'').length)));
  const best=routes[0]||null;
  return {
    phrase,
    status:result.status,
    pronunciationComplete:Boolean(result.phonetics?.complete),
    continuousIpa:result.phonetics?.continuousIpa||'',
    wordCount:result.phonetics?.wordCount||0,
    routeCount:routes.length,
    completeRouteCount:complete.length,
    distinctCompleteDecompositionCount:distinct.size,
    completeCrossWordRouteCount:crossWord.length,
    longestRepresentationUnitCount:longestPiece,
    bestRoute:best?{
      complete:best.complete,coverageRatio:best.scoreBreakdown?.coverageRatio??0,pieceCount:best.scoreBreakdown?.pieceCount??0,crossWordOperationCount:best.crossWordOperationCount||0,
      operations:(best.operations||[]).map(item=>({kind:item.kind,label:item.label||item.symbol||'',targetIpa:item.targetIpa,phoneticTier:item.phoneticTier,crossesWordBoundary:Boolean(item.crossesWordBoundary),sourceWords:(item.sourceWords||[]).map(word=>word.text)}))
    }:null
  };
}

const rows=phrases.map(summarizePhrase);
const output={
  schemaVersion:'1.0',generatedAt:new Date().toISOString(),status:'regression_benchmark_not_training_target',
  purpose:'Periodically test whether representation-bank growth creates more useful competing paths on ordinary French phrases without optimizing for one sentence.',
  policy:{
    targetPhrase:'The historical phrase « Elles ne sont pas cuites les pâtes » remains included as one benchmark among several; no scoring rule is specialized for it.',
    interpretation:'Route counts are engineering observables, not a human quality score. Human naming and orthophonic validation remain separate.',
    longPieces:'longestRepresentationUnitCount tracks whether longer exact pieces remain available instead of forcing syllable-by-syllable fragmentation.'
  },
  summary:{phraseCount:rows.length,pronunciationResolvedCount:rows.filter(row=>row.pronunciationComplete).length,phrasesWithCompleteRoute:rows.filter(row=>row.completeRouteCount>0).length,phrasesWithCrossWordCompleteRoute:rows.filter(row=>row.completeCrossWordRouteCount>0).length,meanDistinctCompleteDecompositions:Number((rows.reduce((sum,row)=>sum+row.distinctCompleteDecompositionCount,0)/Math.max(1,rows.length)).toFixed(2))},
  rows
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');
const lines=['# Rebulo — benchmark de phrases réelles','', '> Indicateur de régression : il mesure la diversité et la couverture des chemins, pas leur qualité humaine finale.','',`- Phrases : ${output.summary.phraseCount}.`,`- Prononciations lexicales entièrement résolues : ${output.summary.pronunciationResolvedCount}.`,`- Phrases avec au moins un chemin complet : ${output.summary.phrasesWithCompleteRoute}.`,`- Phrases avec au moins un chemin complet traversant une frontière de mots : ${output.summary.phrasesWithCrossWordCompleteRoute}.`,`- Nombre moyen de découpages complets distincts : ${output.summary.meanDistinctCompleteDecompositions}.`,'','| Phrase | IPA résolue | Chemins complets | Découpages distincts | Traversée de mots | Plus longue pièce |','|---|---|---:|---:|---:|---:|',...rows.map(row=>`| ${row.phrase} | ${row.pronunciationComplete?'oui':'non'} | ${row.completeRouteCount} | ${row.distinctCompleteDecompositionCount} | ${row.completeCrossWordRouteCount} | ${row.longestRepresentationUnitCount} |`),'','## Lecture','','Une progression saine augmente les alternatives intéressantes sans dégrader les garanties de preuve. Une hausse du nombre de chemins n’est pas automatiquement un progrès : les prototypes et observations humaines doivent ensuite dire si les nouvelles routes sont réellement nommables et compréhensibles.'];
fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(JSON.stringify(output.summary,null,2));
