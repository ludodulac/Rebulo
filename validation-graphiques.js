const MANIFEST_URL='./data/graphic-validation-candidates.json';
const STORAGE_KEY='rebulo.graphicValidation.v1';
const list=document.querySelector('#candidateList');
const empty=document.querySelector('#emptyState');
const status=document.querySelector('#status');
const exportButton=document.querySelector('#exportValidations');
let candidates=[];

function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};
  }catch{return {};}
}
function saveState(state){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function keyFor(candidate){return candidate.id||candidate.asset;}
function recordFor(candidate,state){return state[keyFor(candidate)]||{concept:candidate.concept,asset:candidate.asset,decision:null,comment:'',decided_at:null};}
function setDecision(candidate,decision){
  const state=loadState(),key=keyFor(candidate),previous=recordFor(candidate,state);
  state[key]={...previous,concept:candidate.concept,asset:candidate.asset,decision,comment:decision==='redo'?previous.comment:'',decided_at:new Date().toISOString()};
  saveState(state);render();
}
function setComment(candidate,comment){
  const state=loadState(),key=keyFor(candidate),previous=recordFor(candidate,state);
  state[key]={...previous,concept:candidate.concept,asset:candidate.asset,comment,decided_at:previous.decided_at||new Date().toISOString()};
  saveState(state);
}
function button(label,decision,candidate,current){
  const node=document.createElement('button');node.type='button';node.className='decision-button';node.textContent=label;node.setAttribute('aria-pressed',String(current===decision));node.addEventListener('click',()=>setDecision(candidate,decision));return node;
}
function renderCard(candidate,state){
  const current=recordFor(candidate,state);
  const card=document.createElement('article');card.className='candidate-card';card.dataset.candidateId=keyFor(candidate);
  const title=document.createElement('h2');title.className='candidate-name';title.textContent=candidate.concept;
  const visual=document.createElement('div');visual.className='candidate-image-wrap';
  const image=document.createElement('img');image.className='candidate-image';image.src=candidate.asset;image.alt=`Dessin candidat : ${candidate.concept}`;image.loading='lazy';visual.append(image);
  const choices=document.createElement('div');choices.className='decision-group';choices.setAttribute('aria-label',`Décision pour ${candidate.concept}`);
  choices.append(button('✓ VALIDÉ','validated',candidate,current.decision),button('↻ À REFAIRE','redo',candidate,current.decision));
  const commentWrap=document.createElement('div');commentWrap.className='comment-wrap';commentWrap.hidden=current.decision!=='redo';
  const label=document.createElement('label');const textarea=document.createElement('textarea');const textareaId=`comment-${keyFor(candidate).replace(/[^a-z0-9_-]/gi,'-')}`;textarea.id=textareaId;label.htmlFor=textareaId;label.textContent="Qu'est-ce qu'il faut changer ?";textarea.value=current.comment||'';textarea.addEventListener('input',()=>{setComment(candidate,textarea.value);saved.textContent='Commentaire enregistré sur ce téléphone.';});
  const saved=document.createElement('p');saved.className='saved';saved.textContent=current.decision?'Décision enregistrée sur ce téléphone.':'';
  commentWrap.append(label,textarea);card.append(title,visual,choices,commentWrap,saved);return card;
}
function render(){
  const state=loadState();list.replaceChildren();for(const candidate of candidates)list.append(renderCard(candidate,state));empty.hidden=candidates.length>0;
}
function exportPayload(){
  const state=loadState();
  return {schema_version:1,exported_at:new Date().toISOString(),candidates:candidates.map(candidate=>{const r=recordFor(candidate,state);return {concept:candidate.concept,asset:candidate.asset,decision:r.decision,comment:r.comment||'',decided_at:r.decided_at};})};
}
function exportJson(){
  const blob=new Blob([JSON.stringify(exportPayload(),null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='rebulo-validations-graphiques.json';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);status.textContent='Export JSON préparé.';
}
async function init(){
  try{
    const response=await fetch(MANIFEST_URL,{cache:'no-store'});if(!response.ok)throw new Error('manifest unavailable');
    const manifest=await response.json();candidates=Array.isArray(manifest.candidates)?manifest.candidates.filter(c=>c&&c.id&&c.concept&&c.asset):[];render();
  }catch(error){console.error(error);candidates=[];render();status.textContent='Impossible de charger la liste des dessins candidats.';}
}
exportButton.addEventListener('click',exportJson);
init();

export {loadState,keyFor,recordFor};
