import {choosePlayableRebus,playAnswerMatches,safePlayHint} from './play-game.js';

const shell=document.querySelector('.app-shell');
const createMode=document.querySelector('#createMode');
const playMode=document.querySelector('#playMode');
const description=document.querySelector('#modeDescription');
const arena=document.querySelector('#playArena');
const rebusNode=document.querySelector('#playRebus');
const form=document.querySelector('#playAnswerForm');
const answer=document.querySelector('#playAnswer');
const feedback=document.querySelector('#playFeedback');
const hint=document.querySelector('#playHint');
const hintButton=document.querySelector('#playHintButton');
const solutionButton=document.querySelector('#playSolutionButton');
const newButton=document.querySelector('#playNewButton');

let catalog=null;
let current=null;

function setMode(mode){
  const playing=mode==='play';
  if(shell)shell.dataset.experience=playing?'play':'create';
  if(createMode){createMode.setAttribute('aria-pressed',String(!playing));createMode.classList.toggle('secondary',playing);}
  if(playMode){playMode.setAttribute('aria-pressed',String(playing));playMode.classList.toggle('secondary',!playing);}
  if(description)description.textContent=playing?'Devine le mot à partir des images. La réponse reste cachée jusqu’à ce que tu la demandes.':'Transforme un mot en rébus, puis prépare une activité ou une séance.';
  if(arena)arena.hidden=!playing;
  if(playing)startRound();
}

async function loadCatalog(){
  if(catalog)return catalog;
  const response=await fetch('data/rebus.json',{cache:'no-store'});
  if(!response.ok)throw new Error('data/rebus.json');
  catalog=await response.json();
  return catalog;
}

function renderPiece(piece,index){
  const box=document.createElement('div');
  box.className='piece play-piece';
  const img=document.createElement('img');
  img.src=piece.image;
  img.alt=`Indice visuel ${index+1}`;
  box.appendChild(img);
  return box;
}

function renderRound(rebus){
  current=rebus;
  if(!current){
    if(feedback)feedback.textContent='Aucun rébus de jeu disponible.';
    return;
  }
  if(rebusNode){
    rebusNode.replaceChildren();
    current.pieces.forEach((piece,index)=>{
      rebusNode.appendChild(renderPiece(piece,index));
      if(index<current.pieces.length-1){const plus=document.createElement('span');plus.className='plus';plus.textContent='+';rebusNode.appendChild(plus);}
    });
  }
  if(answer)answer.value='';
  if(feedback){feedback.textContent='';feedback.className='feedback';}
  if(hint){hint.hidden=true;hint.textContent='';}
  answer?.focus();
}

async function startRound(){
  try{
    const data=await loadCatalog();
    renderRound(choosePlayableRebus(data,current?.id));
  }catch(error){
    console.error(error);
    if(feedback)feedback.textContent='Chargement du jeu impossible.';
  }
}

form?.addEventListener('submit',event=>{
  event.preventDefault();
  if(!current)return;
  const ok=playAnswerMatches(answer?.value||'',current);
  if(feedback){feedback.textContent=ok?'Bravo ! Tu as trouvé.':'Pas encore. Essaie de nommer les images à voix haute.';feedback.className=`feedback ${ok?'good':'bad'}`;}
});

hintButton?.addEventListener('click',()=>{
  if(!current||!hint)return;
  hint.textContent=safePlayHint(current);
  hint.hidden=false;
});

solutionButton?.addEventListener('click',()=>{
  if(!current||!feedback)return;
  feedback.textContent=`Solution : ${current.answer}`;
  feedback.className='feedback';
});

newButton?.addEventListener('click',startRound);
createMode?.addEventListener('click',()=>setMode('create'));
playMode?.addEventListener('click',()=>setMode('play'));

setMode('create');
