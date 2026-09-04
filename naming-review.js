import {buildNamingObservationReview} from './src/naming-observation-review.js';

const fileInput=document.querySelector('#reviewFiles');
const clearButton=document.querySelector('#clearReview');
const summary=document.querySelector('#reviewSummary');
const sessionCount=document.querySelector('#sessionCount');
const results=document.querySelector('#reviewResults');
const status=document.querySelector('#reviewStatus');
let comparisons=[];

function text(tag,value,className=''){
  const node=document.createElement(tag);node.textContent=value||'';if(className)node.className=className;return node;
}

function metric(value,label){
  const node=document.createElement('div');node.className='metric';node.append(text('strong',String(value)),text('span',label));return node;
}

function renderCandidate(candidate){
  const card=document.createElement('article');card.className='candidate-review';
  const visual=document.createElement('div');visual.className='candidate-visual';
  const image=document.createElement('img');image.src=candidate.asset;image.alt='Prototype visuel correspondant aux observations';image.loading='lazy';
  image.addEventListener('error',()=>visual.replaceChildren(text('span','Image indisponible','image-error')));visual.append(image);
  const body=document.createElement('div');body.className='candidate-review-body';
  body.append(text('div',candidate.candidateId,'candidate-id'));
  const metrics=document.createElement('div');metrics.className='metrics';
  metrics.append(metric(candidate.observationCount,'observations'),metric(candidate.targetResponseCount,'réponse égale au concept'),metric(candidate.hesitationCount,'hésitations'),metric(candidate.noResponseCount,'sans réponse'));
  body.append(metrics,text('div','Réponses verbatim regroupées','response-title'));
  if(candidate.responses.length){
    const list=document.createElement('ul');list.className='responses';
    for(const response of candidate.responses){const item=document.createElement('li');item.append(text('strong',`${response.count}× `),document.createTextNode(response.response));list.append(item);}body.append(list);
  }else body.append(text('p','Aucune réponse verbale enregistrée.','empty-response'));
  card.append(visual,body);return card;
}

function renderReview(review){
  results.replaceChildren();
  sessionCount.textContent=String(review.sessionCount);summary.hidden=false;
  for(const concept of review.concepts){
    const section=document.createElement('section');section.className='concept-review';
    const heading=document.createElement('div');heading.className='concept-heading';heading.append(text('h2',concept.concept),text('span',concept.targetIpa,'ipa'),text('span',`${concept.sessionCount} session(s)`));
    const grid=document.createElement('div');grid.className='candidate-grid';for(const candidate of concept.candidates)grid.append(renderCandidate(candidate));
    section.append(heading,grid);results.append(section);
  }
}

async function loadFiles(files){
  const selected=[...(files||[])];if(!selected.length)return;
  try{
    const payloads=[];
    for(const file of selected)payloads.push(JSON.parse(await file.text()));
    const review=buildNamingObservationReview(payloads,comparisons);
    if(!review)throw new Error('invalid observation export set');
    renderReview(review);
    status.textContent=`${review.sessionCount} export(s) anonyme(s) analysé(s) localement. Comptages descriptifs uniquement.`;
  }catch(error){
    console.error(error);results.replaceChildren();summary.hidden=true;status.textContent='Revue refusée : charge uniquement des exports complets et compatibles du test de dénomination Rebulo, sans doublon de session.';
  }finally{fileInput.value='';}
}

function clearReview(){results.replaceChildren();summary.hidden=true;sessionCount.textContent='0';status.textContent='Revue effacée.';fileInput.value='';}

fileInput?.addEventListener('change',()=>loadFiles(fileInput.files));clearButton?.addEventListener('click',clearReview);

async function init(){
  try{
    const response=await fetch('./data/pictogram-prototype-comparisons.json',{cache:'no-store'});if(!response.ok)throw new Error('comparisons unavailable');
    const registry=await response.json();comparisons=(registry.comparisons||[]).filter(item=>item.activationState==='inactive_until_human_decision');
    if(!comparisons.length){fileInput.disabled=true;status.textContent='Aucune comparaison de recherche disponible.';}
  }catch(error){console.error(error);fileInput.disabled=true;status.textContent='Impossible de charger les comparaisons de recherche.';}
}
init();
