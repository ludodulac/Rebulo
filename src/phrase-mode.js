import {buildAutomaticCreatorTargets,mergeCreatorTargets} from './creator-catalog.js';
import {buildPhrasePlan,isPhraseInput,playfulPhraseAt,PLAYFUL_PHRASES} from './phrase-creator.js';

const form=document.querySelector('#creatorForm');
const input=document.querySelector('#target');
const surprise=document.querySelector('#phraseSurprise');
const feedback=document.querySelector('#creatorFeedback');
const result=document.querySelector('#result');
const resultLabel=document.querySelector('#resultLabel');
const resultWord=document.querySelector('#resultWord');
const instruction=document.querySelector('#sheetInstruction');
const rebus=document.querySelector('#creatorRebus');
const proof=document.querySelector('#phoneticProof');
const badge=document.querySelector('.strict-badge');
const therapy=document.querySelector('#therapyPanel');
const worksheetAnswer=document.querySelector('#worksheetAnswer');
const sheetMode=document.querySelector('.sheet-mode');
const addButton=document.querySelector('#addToWorksheet');
const pdfButton=document.querySelector('#downloadRebus');
const alternateButton=document.querySelector('#changeImage');
let resources=null;
let phraseIndex=0;

function normalizeReading(piece){return piece.reading||piece.label||'';}
function pieceNode(piece){
  const box=document.createElement('div');box.className='piece';
  if(piece.operationType==='grapheme'){
    box.classList.add('grapheme-piece');const symbol=document.createElement('strong');symbol.className='grapheme-symbol';symbol.textContent=piece.grapheme||piece.label||'';const label=document.createElement('span');label.textContent=normalizeReading(piece);box.append(symbol,label);return box;
  }
  if(piece.operationType==='spatial_relation'){
    box.classList.add('spatial-piece');const diagram=document.createElement('div');diagram.className='spatial-diagram';diagram.setAttribute('aria-hidden','true');const reference=document.createElement('span');reference.className='spatial-reference';reference.textContent='■';const subject=document.createElement('span');subject.className='spatial-subject';subject.textContent='●';diagram.append(reference,subject);const label=document.createElement('span');label.textContent=normalizeReading(piece);box.append(diagram,label);return box;
  }
  const img=document.createElement('img');img.src=piece.image;img.alt=normalizeReading(piece);const label=document.createElement('span');label.textContent=normalizeReading(piece);box.append(img,label);return box;
}

async function loadJSON(path){const response=await fetch(path,{cache:'no-store'});if(!response.ok)throw new Error(path);return response.json();}
async function loadResources(){
  if(resources)return resources;
  const [lexicon,corpus,therapyTargets,coverage]=await Promise.all([
    loadJSON('data/lexicon-seed.json'),loadJSON('data/corpus-pilot.json'),loadJSON('data/therapy-targets.json'),loadJSON('data/coverage-report.json')
  ]);
  resources={lexicon,therapy:therapyTargets.targets||[],targets:mergeCreatorTargets(corpus.items||[],buildAutomaticCreatorTargets(coverage))};
  return resources;
}

function renderPhrase(plan){
  result.hidden=false;result.dataset.sheetMode='phrase';
  if(badge){badge.textContent='Phrase';badge.title='Phrase composée de rébus disponibles et de texte conservé';badge.classList.add('general-badge');}
  resultLabel.textContent='Phrase';resultWord.textContent=plan.input;
  instruction.textContent=plan.complete?'Toute la phrase est transformée en rébus.':'Les mots sans rébus disponible restent en texte pour que la phrase reste jouable.';
  rebus.replaceChildren();rebus.classList.add('phrase-flow');
  for(const token of plan.tokens){
    if(token.kind==='separator'){const sep=document.createElement('span');sep.className='phrase-separator';sep.textContent=token.text;rebus.appendChild(sep);continue;}
    if(token.kind==='text'){const text=document.createElement('span');text.className='phrase-text-token';text.textContent=token.text;rebus.appendChild(text);continue;}
    const group=document.createElement('span');group.className='phrase-rebus-token';group.setAttribute('aria-label',`Rébus pour ${token.text}`);
    token.candidate.pieces.forEach((piece,index)=>{group.appendChild(pieceNode(piece));if(index<token.candidate.pieces.length-1){const plus=document.createElement('span');plus.className='plus';plus.textContent='+';group.appendChild(plus);}});
    rebus.appendChild(group);
  }
  proof.textContent=`${plan.rebusCount} mot${plan.rebusCount>1?'s':''} en rébus · ${plan.textCount} mot${plan.textCount>1?'s':''} conservé${plan.textCount>1?'s':''} en texte`;
  feedback.textContent=plan.rebusCount?`Phrase créée : ${plan.rebusCount} mot${plan.rebusCount>1?'s':''} transformé${plan.rebusCount>1?'s':''} sur ${plan.wordCount}.`:'Phrase affichée, mais aucun de ses mots n’a encore de rébus disponible.';
  if(therapy)therapy.hidden=true;if(worksheetAnswer)worksheetAnswer.hidden=true;if(sheetMode)sheetMode.hidden=true;if(addButton)addButton.hidden=true;if(pdfButton)pdfButton.hidden=true;if(alternateButton)alternateButton.hidden=true;
}

async function createPhrase(value){
  try{const data=await loadResources();renderPhrase(buildPhrasePlan(value,data.targets,data.lexicon,data.therapy));}
  catch(error){console.error(error);result.hidden=true;feedback.textContent='Chargement impossible pour la phrase.';}
}

form?.addEventListener('submit',event=>{
  if(!isPhraseInput(input?.value||''))return;
  event.preventDefault();event.stopImmediatePropagation();createPhrase(input.value.trim());
},true);

surprise?.addEventListener('click',()=>{
  if(!input)return;input.value=playfulPhraseAt(phraseIndex++%PLAYFUL_PHRASES.length);createPhrase(input.value);
});
