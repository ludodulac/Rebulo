import fs from 'node:fs';
import {normalizeIPA} from '../src/phonetic-engine.js';

const lexiquePath=process.argv[2]||'.cache/lexique4.compact.json';
const pictogramPath=process.argv[3]||'data/lexicon-seed.json';
const prioritiesPath=process.argv[4]||'data/pictogram-priorities.json';
const outputPath=process.argv[5]||'data/expansion-simulation.json';

const lexique=JSON.parse(fs.readFileSync(lexiquePath,'utf8'));
const entries=Array.isArray(lexique)?lexique:(lexique.entries||[]);
const pictograms=JSON.parse(fs.readFileSync(pictogramPath,'utf8'));
const base=pictograms
  .filter(x=>x.active!==false&&x.ipa&&x.label)
  .map(x=>({id:x.id||x.label,label:x.label,ipa:normalizeIPA(x.ipa)}));
const prototypePool=pictograms
  .filter(x=>x.active===false&&x.ipa&&x.label&&x.clinicalStatus==='prototype_research')
  .map(x=>({id:x.id||x.label,label:x.label,ipa:normalizeIPA(x.ipa),assetStatus:x.assetStatus||'unknown'}));
const priorities=JSON.parse(fs.readFileSync(prioritiesPath,'utf8'));
const activeIpas=new Set(base.map(x=>x.ipa));

const allowedStatuses=new Set(['priority_pictogram','candidate_pictogram']);
const pool=priorities.items
  .filter(x=>allowedStatuses.has(x.status)&&x.proposedLabel&&x.sound)
  .map(x=>({
    id:`candidate-${x.proposedLabel}`,
    label:x.proposedLabel,
    ipa:normalizeIPA(x.sound),
    status:x.status,
    rawRank:x.rawRank
  }))
  .filter(x=>!activeIpas.has(x.ipa));

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

function bestDecomposition(target,pieces,maxPieces=4){
  const memo=new Map();
  function walk(offset){
    if(offset===target.length)return [];
    if(memo.has(offset))return memo.get(offset);
    let best=null;
    for(const piece of pieces){
      if(!piece.ipa||!target.startsWith(piece.ipa,offset))continue;
      const rest=walk(offset+piece.ipa.length);
      if(!rest)continue;
      const candidate=[piece,...rest];
      if(candidate.length>maxPieces)continue;
      if(!best||candidate.length<best.length)best=candidate;
    }
    memo.set(offset,best);
    return best;
  }
  return walk(0);
}

function evaluate(pieces,{examplesLimit=12}={}){
  const constructible=new Set();
  const multiPiece=new Set();
  const decompositions=new Map();
  let weightedMultiPiece=0;
  for(const entry of lexical){
    const decomposition=bestDecomposition(entry.ipa,pieces,4);
    if(!decomposition)continue;
    constructible.add(entry.word);
    if(decomposition.length>=2){
      if(!multiPiece.has(entry.word)){
        weightedMultiPiece+=Math.log10(1+entry.frequency)+1;
        decompositions.set(entry.word,{word:entry.word,frequency:entry.frequency,pieces:decomposition.map(piece=>piece.label)});
      }
      multiPiece.add(entry.word);
    }
  }
  const examples=[...decompositions.values()]
    .sort((a,b)=>b.frequency-a.frequency||a.pieces.length-b.pieces.length||a.word.localeCompare(b.word,'fr'))
    .slice(0,examplesLimit);
  return {
    constructibleUniqueWords:constructible.size,
    multiPieceUniqueWords:multiPiece.size,
    weightedMultiPiece:Number(weightedMultiPiece.toFixed(3)),
    examples
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

function scenario(name,added){
  const next=evaluate([...base,...added],{examplesLimit:20});
  const addedIds=new Set(added.map(item=>item.id));
  const examples=next.examples.filter(example=>example.pieces.some(label=>added.some(item=>item.label===label))).slice(0,12);
  return {
    name,
    added:added.map(item=>({label:item.label,ipa:`/${item.ipa}/`,assetStatus:item.assetStatus})),
    strictMultiPieceGain:next.multiPieceUniqueWords-baseline.multiPieceUniqueWords,
    strictConstructibleGain:next.constructibleUniqueWords-baseline.constructibleUniqueWords,
    weightedMultiPieceGain:Number((next.weightedMultiPiece-baseline.weightedMultiPiece).toFixed(3)),
    cumulativeMultiPieceUniqueWords:next.multiPieceUniqueWords,
    examples,
    note:addedIds.size===1?'Gain isolé par rapport à la base active actuelle.':'Gain combiné recalculé ; il ne faut pas additionner les gains isolés.'
  };
}

const prototypeScenarios=[];
for(const prototype of prototypePool)prototypeScenarios.push(scenario(prototype.label,[prototype]));
if(prototypePool.length>=2)prototypeScenarios.push(scenario(prototypePool.map(x=>x.label).join(' + '),prototypePool));

const report={
  generatedAt:new Date().toISOString(),
  lexicalUniquePronouncedForms:lexical.length,
  baseline:{...baseline,examples:undefined},
  candidatePool:pool.map(x=>({label:x.label,ipa:`/${x.ipa}/`,status:x.status,rawRank:x.rawRank})),
  greedyOrder:steps,
  prototypeScenarios,
  interpretation:'Ordre glouton recalculé après chaque ajout. Les briques déjà actives sont exclues du pool candidat ; le gain porte sur les mots uniques devenant constructibles avec au moins deux pièces, ce qui évite de confondre un simple homophone d’une image avec un vrai rébus.',
  prototypeInterpretation:'Les scénarios de prototypes simulent séparément puis ensemble les concepts enregistrés comme prototype_research mais toujours inactifs. Ils n’activent rien dans le produit.',
  caution:'Cette simulation mesure le potentiel lexical strict, pas la qualité clinique. Un prototype doit encore satisfaire les exigences de visuel, de dénomination et de provenance avant toute activation.'
};

fs.writeFileSync(outputPath,JSON.stringify(report,null,2));
console.log(`Baseline multi-piece unique: ${baseline.multiPieceUniqueWords}`);
for(const step of steps)console.log(`${step.step}. ${step.addedLabel} ${step.ipa}: +${step.marginalMultiPieceUniqueWords} -> ${step.cumulativeMultiPieceUniqueWords}`);
for(const item of prototypeScenarios)console.log(`Prototype ${item.name}: +${item.strictMultiPieceGain} strict multi-piece`);
console.log(`Report -> ${outputPath}`);
