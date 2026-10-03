const DEFAULT_LOT='lot-001';
const LOT_ROOT='./lots';

const list=document.querySelector('#candidateList');
const empty=document.querySelector('#emptyState');
const lotLabel=document.querySelector('#lotLabel');
const totalCount=document.querySelector('#totalCount');
const validatedCount=document.querySelector('#validatedCount');
const refusedCount=document.querySelector('#refusedCount');
const untreatedCount=document.querySelector('#untreatedCount');
const messageField=document.querySelector('#grandpaMessage');
const copyButton=document.querySelector('#copyReport');
const copyStatus=document.querySelector('#copyStatus');

let manifest={lot_id:null,title:'',candidates:[]};

function lotSlug(){
  const requested=new URLSearchParams(window.location.search).get('lot')||DEFAULT_LOT;
  return /^[a-z0-9-]+$/.test(requested)?requested:DEFAULT_LOT;
}
function storageKey(){
  return 'rebulo.validationImages.'+(manifest.lot_id||lotSlug())+'.v1';
}
function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(storageKey())||'{}');
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return {items:{},message:''};
    return {
      items:parsed.items&&typeof parsed.items==='object'&&!Array.isArray(parsed.items)?parsed.items:{},
      message:typeof parsed.message==='string'?parsed.message:''
    };
  }catch{
    return {items:{},message:''};
  }
}
function saveState(state){
  localStorage.setItem(storageKey(),JSON.stringify(state));
}
function normaliseCandidate(candidate,index){
  if(!candidate||typeof candidate!=='object')return null;
  const id=candidate.id||candidate.concept_id;
  const concept=candidate.concept||candidate.label;
  if(!id||!concept||!candidate.asset)return null;
  return {id:String(id),concept:String(concept),asset:String(candidate.asset),index};
}
function recordFor(candidate,state){
  const existing=state.items[candidate.id];
  if(existing&&typeof existing==='object'){
    return {decision:existing.decision||null,remark:existing.remark||''};
  }
  return {decision:null,remark:''};
}
function counts(state){
  let validated=0;
  let refused=0;
  for(const candidate of manifest.candidates){
    const decision=recordFor(candidate,state).decision;
    if(decision==='VALIDATED')validated+=1;
    if(decision==='REJECTED')refused+=1;
  }
  return {total:manifest.candidates.length,validated,refused,untreated:manifest.candidates.length-validated-refused};
}
function updateSummary(state){
  const current=counts(state);
  totalCount.textContent=String(current.total);
  validatedCount.textContent=String(current.validated);
  refusedCount.textContent=String(current.refused);
  untreatedCount.textContent=String(current.untreated);
}
function persistDecision(candidate,decision,card){
  const state=loadState();
  const previous=recordFor(candidate,state);
  state.items[candidate.id]={decision,remark:previous.remark||''};
  saveState(state);
  card.dataset.decision=decision;
  card.querySelectorAll('.decision-button').forEach(button=>{
    button.setAttribute('aria-pressed',String(button.dataset.decision===decision));
  });
  updateSummary(state);
}
function persistRemark(candidate,remark){
  const state=loadState();
  const previous=recordFor(candidate,state);
  state.items[candidate.id]={decision:previous.decision,remark};
  saveState(state);
}
function createCard(candidate,state){
  const current=recordFor(candidate,state);
  const card=document.createElement('article');
  card.className='candidate-card';
  card.dataset.candidateId=candidate.id;
  card.dataset.decision=current.decision||'';

  const title=document.createElement('h2');
  title.className='candidate-name';
  title.textContent=candidate.concept;

  const id=document.createElement('p');
  id.className='candidate-id';
  id.textContent=candidate.id;

  const visual=document.createElement('div');
  visual.className='candidate-image-wrap';
  const image=document.createElement('img');
  image.className='candidate-image';
  image.src=candidate.asset;
  image.alt='Image à valider : '+candidate.concept;
  image.loading=candidate.index<4?'eager':'lazy';
  image.decoding='async';
  visual.append(image);

  const choices=document.createElement('div');
  choices.className='decision-group';
  choices.setAttribute('aria-label','Décision pour '+candidate.concept);

  for(const option of [
    {label:'✓ VALIDER',decision:'VALIDATED'},
    {label:'✕ REFUSER',decision:'REJECTED'}
  ]){
    const button=document.createElement('button');
    button.type='button';
    button.className='decision-button';
    button.dataset.decision=option.decision;
    button.textContent=option.label;
    button.setAttribute('aria-pressed',String(current.decision===option.decision));
    button.addEventListener('click',()=>persistDecision(candidate,option.decision,card));
    choices.append(button);
  }

  const remarkLabel=document.createElement('label');
  remarkLabel.className='remark-label';
  remarkLabel.textContent='Remarque facultative';
  const remark=document.createElement('textarea');
  remark.value=current.remark||'';
  remark.placeholder='Ajouter une remarque…';
  remark.setAttribute('aria-label','Remarque pour '+candidate.concept);
  remark.addEventListener('input',()=>persistRemark(candidate,remark.value));
  remarkLabel.append(remark);

  card.append(title,id,visual,choices,remarkLabel);
  return card;
}
function buildReport(){
  const state=loadState();
  const current=counts(state);
  const validated=[];
  const refused=[];
  const untreated=[];
  const remarks=[];

  for(const candidate of manifest.candidates){
    const record=recordFor(candidate,state);
    const item='- ['+candidate.id+'] '+candidate.concept;
    if(record.decision==='VALIDATED')validated.push(item);
    else if(record.decision==='REJECTED')refused.push(item);
    else untreated.push(item);
    if(record.remark.trim())remarks.push(item+' — '+record.remark.trim());
  }

  return [
    'REBULO-056_IMAGE_VALIDATION_REPORT',
    '',
    'LOT_ID : '+manifest.lot_id,
    'LOT_TITLE : '+manifest.title,
    'TOTAL : '+current.total,
    'VALIDATED : '+current.validated,
    'REFUSED : '+current.refused,
    'UNTREATED : '+current.untreated,
    '',
    'VALIDÉES :',
    validated.length?validated.join('\n'):'- aucune',
    '',
    'REFUSÉES :',
    refused.length?refused.join('\n'):'- aucune',
    '',
    'REMARQUES :',
    remarks.length?remarks.join('\n'):'- aucune',
    '',
    'NON TRAITÉES :',
    untreated.length?untreated.join('\n'):'- aucune',
    '',
    'MESSAGE POUR GRAND-PÈRE :',
    state.message.trim()||'- aucun',
    '',
    'END_REPORT'
  ].join('\n');
}
async function copyText(text){
  if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
    await navigator.clipboard.writeText(text);
    return;
  }
  const helper=document.createElement('textarea');
  helper.value=text;
  helper.setAttribute('readonly','');
  helper.style.position='fixed';
  helper.style.opacity='0';
  document.body.append(helper);
  helper.select();
  const copied=document.execCommand('copy');
  helper.remove();
  if(!copied)throw new Error('copy unavailable');
}
async function copyReport(){
  try{
    await copyText(buildReport());
    copyStatus.textContent='Compte rendu copié. Tu peux le coller dans la conversation Grand-père.';
  }catch(error){
    console.error(error);
    copyStatus.textContent='Copie automatique impossible sur ce navigateur.';
  }
}
async function init(){
  const slug=lotSlug();
  try{
    const response=await fetch(LOT_ROOT+'/'+slug+'.json',{cache:'no-store'});
    if(!response.ok)throw new Error('lot manifest unavailable');
    const loaded=await response.json();
    const raw=Array.isArray(loaded.candidates)?loaded.candidates:[];
    const candidates=raw.map(normaliseCandidate).filter(Boolean);
    manifest={lot_id:loaded.lot_id||loaded.batch_id||slug,title:loaded.title||slug,candidates};
    lotLabel.textContent=manifest.title;
    document.title='REBULO — '+manifest.title;

    const state=loadState();
    list.replaceChildren();
    for(const candidate of manifest.candidates)list.append(createCard(candidate,state));
    empty.hidden=manifest.candidates.length>0;
    messageField.value=state.message||'';
    updateSummary(state);
  }catch(error){
    console.error(error);
    manifest={lot_id:slug,title:slug,candidates:[]};
    lotLabel.textContent=slug;
    list.replaceChildren();
    empty.hidden=false;
    updateSummary({items:{},message:''});
    copyStatus.textContent='Impossible de charger ce lot.';
  }
}
messageField.addEventListener('input',()=>{
  const state=loadState();
  state.message=messageField.value;
  saveState(state);
});
copyButton.addEventListener('click',copyReport);
init();

export {lotSlug,loadState,recordFor,counts,buildReport};
