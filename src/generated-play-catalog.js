import {buildCreatorTargets} from './creator-catalog.js';
import {buildCreatorCandidate} from './creator-runtime.js';

function normalizeKey(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
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
  const rounds=[];
  for(const target of buildCreatorTargets(coverage)){
    const candidate=buildCreatorCandidate(target,lexicon,[]);
    if(!candidate||!Array.isArray(candidate.pieces)||candidate.pieces.length<2)continue;
    const difficulty=difficultyFromPieces(candidate.pieces.length);
    rounds.push({
      id:`generated-${normalizeKey(candidate.answer)}`,
      answer:candidate.answer,
      targetIpa:candidate.targetIpa,
      minAge:minimumAgeFromDifficulty(difficulty),
      difficulty,
      presentationStatus:'showcase',
      source:'coverage-report',
      generated:true,
      validation:'strict',
      pieces:candidate.pieces.map(piece=>({
        id:piece.id,
        image:piece.image,
        reading:piece.reading||piece.label,
        ipa:piece.ipa
      })),
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
