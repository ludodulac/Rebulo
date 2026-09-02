import {choosePlayableRebus,playAnswerMatches,safePlayHint} from './play-game.js';

const shell=document.querySelector('.app-shell');
const createMode=document.querySelector('#createMode');
const playMode=document.querySelector('#playMode');
const description=document.querySelector('#modeDescription');
const arena=document.querySelector('#playArena');
const creatorResult=document.querySelector('#result');
const creatorRebus=document.querySelector('#creatorRebus');
const creatorFeedback=document.querySelector('#creatorFeedback');
const badge=document.querySelector('.strict-badge');
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

function selectedAge(){return Number(shell?.dataset.age||7);}
function ageCatalog(items=[]){const age=selectedAge();return items.filter(item=>Number(item?.minAge||5)<=age);}
function clearRoundState(){if(answer)answer.value='';if(feedback){feedback.textContent='';feedback.className='feedback';}if(hint){hint.hidden=true;hint.textContent='';}}
function resetCreatorSurface(){
  if(creatorResult)creatorResult.hidden=true;
  if(creatorRebus){creatorRebus.replaceChildren();creatorRebus.classList.remove('phrase-flow');}
  if(creatorFeedback)creatorFeedback.textContent='';
  if(shell)shell.dataset.creatorReady='false';
  if(badge){badge.textContent='✓ Exact';badge.title='Rebulo garde tous les sons';badge.classList.remove('general-badge');}
}
function setMode(mode){
  const playing=mode==='play';
  if(shell)shell.dataset.experience=playing?'play':'create';
  if(createMode){createMode.setAttribute('aria-pressed',String(!playing));createMode.classList.toggle('secondary',playing);}
  if(playMode){playMode.setAttribute('aria-pressed',String(playing));playMode.classList.toggle('secondary',!playing);}
  if(description)description.textContent=playing?'Regarde les images, dis leur nom à voix haute, puis assemble les sons.':'Écris un mot : Rebulo essaie de le transformer en images.';
  if(arena)arena.hidden=!playing;
  if(playing)startRound();else resetCreatorSurface();
}
async function loadCatalog(){if(catalog)return catalog;const response=await fetch('data/rebus.json',{cache:'no-store'});if(!response.ok)throw new Error('data/rebus.json');catalog=await response.json();return catalog;}
function renderPiece(piece,index){const box=document.createElement('div');box.className='piece play-piece';const img=document.createElement('img');img.src=piece.image;img.alt=`Indice visuel ${index+1}`;box.appendChild(img);return box;}
function renderRound(rebus){current=rebus;clearRoundState();if(!current){if(feedback)feedback.textContent='Aucun rébus pour cet âge pour le moment.';return;}if(rebusNode){rebusNode.replaceChildren();current.pieces.forEach((piece,index)=>{rebusNode.appendChild(renderPiece(piece,index));if(index<current.pieces.length-1){const plus=document.createElement('span');plus.className='plus';plus.textContent='+';rebusNode.appendChild(plus);}});}}
async function startRound(){try{const data=ageCatalog(await loadCatalog());renderRound(choosePlayableRebus(data,current?.id));}catch(error){console.error(error);if(feedback)feedback.textContent='Chargement du jeu impossible.';}}
form?.addEventListener('submit',event=>{event.preventDefault();if(!current)return;const ok=playAnswerMatches(answer?.value||'',current);if(feedback){feedback.textContent=ok?'Bravo ! Tu as trouvé.':'Pas encore. Essaie de nommer les images à voix haute.';feedback.className=`feedback ${ok?'good':'bad'}`;}});
hintButton?.addEventListener('click',()=>{if(!current||!hint)return;hint.textContent=safePlayHint(current);hint.hidden=false;});
solutionButton?.addEventListener('click',()=>{if(!current||!feedback)return;feedback.textContent=`Solution : ${current.answer}`;feedback.className='feedback';});
newButton?.addEventListener('click',startRound);
createMode?.addEventListener('click',()=>setMode('create'));
playMode?.addEventListener('click',()=>setMode('play'));
window.addEventListener('rebulo:agechange',()=>{current=null;if(shell?.dataset.experience==='play')startRound();});
setMode('create');
