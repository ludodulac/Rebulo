import fs from 'node:fs';
import {normalizeIPA} from '../src/phonetic-engine.js';

const lexiquePath=process.argv[2]||'.cache/lexique4.compact.json';
const pictogramPath=process.argv[3]||'data/lexicon-seed.json';
const prioritiesPath=process.argv[4]||'data/pictogram-priorities.json';
const outputPath=process.argv[5]||'data/expansion-simulation.json';

const lexique=JSON.parse(fs.readFileSync(lexiquePath,'utf8'));
const entries=Array.isArray(lexique)?lexique:(lexique.entries||[]);
const base=JSON.parse(fs.readFileSync(pictogramPath,'utf8'))
  .filter(x=>x.active!==false&&x.ipa&&x.label)
  .map(x=>({id:x.id||x.label,label:x.label,ipa:normalizeIPA(x.ipa)}));
const priorities=JSON.parse(fs.readFileSync(prioritiesPath,'utf8'));

const allowedStatuses=new Set(['priority_pictogram','candidate_pictogram']);
const pool=priorities.items
  .filter(x=>allowedStatuses.has(x.status)&&x.proposedLabel&&x.sound)
  .map(x=>({
    id:`candidate-${x.proposedLabel}`,
    label:x.proposedLabel,
    ipa:normalizeIPA(x.sound),
    status:x.status,
    rawRank:x.rawRank
  }));

const lexical=[];
const seenEntry=new Set();
for(const entry of entries){
  if(!entry?.word||!entry?.ipa)continue;
  const ipa=normalizeIPA(entry.ipa);
  if(!ipa)continue;
  const word=String(entry.word).toLowerCase();
  const key=`${word}\u0000${ipa}`;
  if(seenEntry.has(key))continue;
  seenEntry.add(key);
  lexical.push({word,ipa,frequency:Number(entry.frequency)||0});
}

function minPieces(target,pieces,maxPieces=4){
  const memo=new Map();
  function walk(offset){
    if(offset===target.length)return 0;
    if(memo.has(offset))return memo.get(offset);
    let best=Infinity;
    for(const piece of pieces){
      if(!piece.ipa||!target.startsWith(piece.ipa,offset))continue;
      const rest=walk(offset+piece.ipa.length);
      if(Number.isFinite(rest))best=Math.min(best,1+rest);
    }
    memo.set(offset,best);
    return best;
  }
  const result=walk(0);
  return result<=maxPieces?result:Infinity;
}

function evaluate(pieces){
  const constructible=new Set();
  const multiPiece=new Set();
  let weightedMultiPiece=0;
  for(const entry of lexical){
    const n=minPieces(entry.ipa,pieces,4);
    if(!Number.isFinite(n))continue;
    constructible.add(entry.word);
    if(n>=2){
      if(!multiPiece.has(entry.word))weightedMultiPiece+=Math.log10(1+entry.frequency)+1;
      multiPiece.add(entry.word);
    }
  }
  return {
    constructibleUniqueWords:constructible.size,
    multiPieceUniqueWords:multiPiece.size,
    weightedMultiPiece:Number(weightedMultiPiece.toFixed(3))
  };
}

const baseline=evaluate(base);
const selected=[];
const remaining=[...pool];
let currentPieces=[...base];
let current=baseline;
const steps=[];

while(remaining.length){
  let best=null;
  for(const candidate of remaining){
    const next=evaluate([...currentPieces,candidate]);
    const score=(next.multiPieceUniqueWords-current.multiPieceUniqueWords)*1000+(next.weightedMultiPiece-current.weightedMultiPiece);
    const option={candidate,next,score,marginalMultiPiece:next.multiPieceUniqueWords-current.multiPieceUniqueWords,marginalConstructible:next.constructibleUniqueWords-current.constructibleUniqueWords};
    if(!best||option.score>best.score||(option.score===best.score&&candidate.rawRank<best.candidate.rawRank))best=option;
  }
  if(!best)break;
  selected.push(best.candidate);
  currentPieces.push(best.candidate);
  const index=remaining.findIndex(x=>x.id===best.candidate.id);
  remaining.splice(index,1);
  steps.push({
    step:steps.length+1,
    addedLabel:best.candidate.label,
    ipa:`/${best.candidate.ipa}/`,
    status:best.candidate.status,
    marginalMultiPieceUniqueWords:best.marginalMultiPiece,
    marginalConstructibleUniqueWords:best.marginalConstructible,
    cumulativeMultiPieceUniqueWords:best.next.multiPieceUniqueWords,
    cumulativeConstructibleUniqueWords:best.next.constructibleUniqueWords,
    cumulativeWeightedMultiPiece:best.next.weightedMultiPiece
  });
  current=best.next;
}

const report={
  generatedAt:new Date().toISOString(),
  lexicalUniquePronouncedForms:lexical.length,
  baseline,
  candidatePool:pool.map(x=>({label:x.label,ipa:`/${x.ipa}/`,status:x.status,rawRank:x.rawRank})),
  greedyOrder:steps,
  interpretation:'Ordre glouton recalculé après chaque ajout. Le gain porte sur les mots uniques devenant constructibles avec au moins deux pièces, ce qui évite de confondre un simple homophone d’une image avec un vrai rébus.',
  caution:'Cette simulation mesure le potentiel lexical strict, pas la qualité clinique. Les candidats de statut candidate_pictogram doivent encore être testés pour la dénomination spontanée et l’imageabilité.'
};

fs.writeFileSync(outputPath,JSON.stringify(report,null,2));
console.log(`Baseline multi-piece unique: ${baseline.multiPieceUniqueWords}`);
for(const step of steps)console.log(`${step.step}. ${step.addedLabel} ${step.ipa}: +${step.marginalMultiPieceUniqueWords} -> ${step.cumulativeMultiPieceUniqueWords}`);
console.log(`Report -> ${outputPath}`);
