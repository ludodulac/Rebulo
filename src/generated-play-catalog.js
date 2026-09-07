import {validateStrictRebus} from './phonetic-engine.js';

function normalizeKey(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

function exactWordKey(value=''){
  return String(value||'').toLocaleLowerCase('fr-FR').normalize('NFC');
}

function difficultyFromPieces(count){
  if(count>=4)return 3;
  if(count===3)return 2;
  return 1;
}

function minimumAgeFromDifficulty(difficulty){
  if(difficulty>=3)return 9;
  if(difficulty===2)return 7;
  return 5;
}

export function generatedPlayableRebuses(coverage={},lexicon=[]){
  const rows=Array.isArray(coverage?.constructibleMultiPiece)
    ?coverage.constructibleMultiPiece
    :(Array.isArray(coverage?.constructible)?coverage.constructible:[]);
  const activeById=new Map((lexicon||[]).filter(piece=>piece?.active!==false&&piece?.id&&piece?.image).map(piece=>[piece.id,piece]));
  const seenWords=new Set();
  const rounds=[];
  for(const row of rows){
    const decomposition=Array.isArray(row?.decomposition)?row.decomposition:[];
    if(!row?.word||!row?.ipa||decomposition.length<2||decomposition.length>4)continue;
    const wordKey=exactWordKey(row.word);
    if(!wordKey||seenWords.has(wordKey))continue;
    const pieces=decomposition.map(id=>activeById.get(id)||null);
    if(pieces.some(piece=>!piece))continue;
    const strictCandidate={answer:row.word,targetIpa:row.ipa,pieces:pieces.map(piece=>({...piece,reading:piece.label}))};
    if(!validateStrictRebus(strictCandidate).ok)continue;
    seenWords.add(wordKey);
    const difficulty=difficultyFromPieces(pieces.length);
    rounds.push({
      id:`generated-${rounds.length+1}-${normalizeKey(row.word)}`,
      answer:row.word,
      targetIpa:row.ipa,
      minAge:minimumAgeFromDifficulty(difficulty),
      difficulty,
      presentationStatus:'showcase',
      source:'coverage-report',
      generated:true,
      validation:'strict',
      frequency:Number(row?.frequency||0),
      pieces:pieces.map(piece=>({id:piece.id,image:piece.image,reading:piece.label,ipa:piece.ipa})),
      hint:'Nomme chaque image, puis assemble les sons sans en ajouter ni en retirer.'
    });
  }
  return rounds;
}

export function mergePlayableCatalog(manual=[],generated=[]){
  const byAnswer=new Map();
  for(const item of generated||[]){
    const key=normalizeKey(item?.answer);
    if(key&&!byAnswer.has(key))byAnswer.set(key,item);
  }
  for(const item of manual||[]){
    const key=normalizeKey(item?.answer);
    if(!key||byAnswer.has(key))continue;
    byAnswer.set(key,item);
  }
  return [...byAnswer.values()];
}
