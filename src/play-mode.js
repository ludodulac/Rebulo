import {choosePlayableRebus,playAnswerMatches,safePlayHint} from './play-game.js';
import {DIFFICULTY_PROFILES,normalizeDifficultyProfile,rebusesForProfile} from './difficulty-profile.js';
import './creator-kind.js';

const shell=document.querySelector('.app-shell');
const createMode=document.querySelector('#createMode');
const playMode=document.querySelector('#playMode');
const description=document.querySelector('#modeDescription');
const tagline=document.querySelector('.product-tagline');
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
let catalog=null;let current=null;
if(tagline)tagline.textContent='Joue avec les sons et les mots grâce aux rébus.';
function currentProfile(){return normalizeDifficultyProfile(shell?.dataset.difficultyProfile||'discovery');}
function profileCatalog(items=[]){return rebusesForProfile(items,currentProfile());}
function clearRoundState(){if(answer)answer.value='';if(feedback){feedback.textContent='';feedback.className='feedback';}if(hint){hint.hidden=true;hint.textContent='';}}
function resetCreatorSurface(){if(creatorResult)creatorResult.hidden=true;if(creatorRebus){creatorRebus.replaceChildren();creatorRebus.classList.remove('phrase-flow');}if(creatorFeedback)creatorFeedback.textContent='';if(shell)shell.dataset.creatorReady='false';if(badge){badge.textContent='✓ Exact';badge.title='Rebulo garde tous les sons';badge.classList.remove('general-badge');}}
function setMode(mode){const playing=mode==='play';if(shell)shell.dataset.experience=playing?'play':'create';if(createMode){createMode.setAttribute('aria-pressed',String(!playing));createMode.classList.toggle('secondary',playing);}if(playMode){playMode.setAttribute('aria-pressed',String(playing));playMode.classList.toggle('secondary',!playing);}if(description)description.textContent=playing?'Regarde les images, nomme-les à voix haute, puis assemble les sons.':'Choisis Mot ou Phrase, puis transforme ton texte en rébus.';if(arena)arena.hidden=!playing;if(playing)startRound();else resetCreatorSurface();}
async function loadCatalog(){if(catalog)return catalog;const response=await fetch('data/rebus.json',{cache:'no-store'});if(!response.ok)throw new Error('data/rebus.json');catalog=await response.json();return catalog;}
function renderPiece(piece,index){const box=document.createElement('div');box.className='piece play-piece';const img=document.createElement('img');img.src=piece.image;img.alt=`Indice visuel ${index+1}`;box.appendChild(img);return box;}
function renderRound(rebus){current=rebus;clearRoundState();if(!current){if(feedback)feedback.textContent='Aucun rébus pour ce niveau pour le moment.';return;}if(rebusNode){rebusNode.replaceChildren();current.pieces.forEach((piece,index)=>{rebusNode.appendChild(renderPiece(piece,index));if(index<current.pieces.length-1){const plus=document.createElement('span');plus.className='plus';plus.textContent='+';rebusNode.appendChild(plus);}});}}
async function startRound(){try{renderRound(choosePlayableRebus(profileCatalog(await loadCatalog()),current?.id));}catch(error){console.error(error);if(feedback)feedback.textContent='Chargement du jeu impossible.';}}
function syncProfileButtons(){document.querySelectorAll('#difficultyProfiles [data-profile]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.profile===currentProfile())));}
function installProfileChooser(){if(!arena||document.querySelector('#difficultyProfiles'))return;const wrap=document.createElement('div');wrap.id='difficultyProfiles';wrap.className='difficulty-profiles';wrap.setAttribute('role','group');wrap.setAttribute('aria-label','Niveau de difficulté');Object.values(DIFFICULTY_PROFILES).forEach(profile=>{const button=document.createElement('button');button.type='button';button.className='secondary';button.dataset.profile=profile.id;button.textContent=profile.label;button.addEventListener('click',()=>{if(shell)shell.dataset.difficultyProfile=profile.id;try{localStorage.setItem('rebulo-difficulty-profile',profile.id);}catch{}syncProfileButtons();current=null;startRound();});wrap.appendChild(button);});arena.insertBefore(wrap,arena.children[2]||null);syncProfileButtons();}
form?.addEventListener('submit',event=>{event.preventDefault();if(!current)return;const ok=playAnswerMatches(answer?.value||'',current);if(feedback){feedback.textContent=ok?'Bravo ! Tu as trouvé.':'Pas encore. Essaie de nommer les images à voix haute.';feedback.className=`feedback ${ok?'good':'bad'}`;}});
hintButton?.addEventListener('click',()=>{if(!current||!hint)return;hint.textContent=safePlayHint(current);hint.hidden=false;});solutionButton?.addEventListener('click',()=>{if(!current||!feedback)return;feedback.textContent=`Solution : ${current.answer}`;feedback.className='feedback';});newButton?.addEventListener('click',startRound);createMode?.addEventListener('click',()=>setMode('create'));playMode?.addEventListener('click',()=>setMode('play'));
window.addEventListener('rebulo:agechange',event=>{if(!shell)return;const suggested=event.detail?.profile;if(suggested){shell.dataset.difficultyProfile=suggested;try{localStorage.setItem('rebulo-difficulty-profile',suggested);}catch{}}syncProfileButtons();current=null;if(shell.dataset.experience==='play')startRound();});
let storedProfile=null;try{storedProfile=localStorage.getItem('rebulo-difficulty-profile');}catch{}if(shell)shell.dataset.difficultyProfile=normalizeDifficultyProfile(storedProfile||'discovery');installProfileChooser();setMode('play');
