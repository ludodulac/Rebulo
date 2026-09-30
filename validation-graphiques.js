const DEFAULT_BATCH='lot-001';
const BATCH_ROOT='./data/validation-batches';
const list=document.querySelector('#candidateList');
const empty=document.querySelector('#emptyState');
const status=document.querySelector('#status');
const progressText=document.querySelector('#progressText');
const progressBar=document.querySelector('#progressBar');
const finalButton=document.querySelector('#finalizeBatch');
const batchLabel=document.querySelector('#batchLabel');

let manifest={batch_id:null,candidates:[]};

function batchSlug(){
  const requested=new URLSearchParams(location.search).get('batch')||DEFAULT_BATCH;
  return /^[a-z0-9-]+$/.test(requested)?requested:DEFAULT_BATCH;
}
function storageKey(){return `rebulo.graphicValidation.batch.${manifest.batch_id||batchSlug()}.v1`;}
function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(storageKey())||'{}');
    return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};
  }catch{return {};}
}
function saveState(state){localStorage.setItem(storageKey(),JSON.stringify(state));}
function recordFor(candidate,state){
  return state[candidate.concept_id]||{
    concept_id:candidate.concept_id,
    asset:candidate.asset,
    source_drive_id:candidate.source_drive_id||null,
    decision:null,
    remark:'',
    decided_at:null
  };
}
function setDecision(candidate,decision){
  const state=loadState();
  const previous=recordFor(candidate,state);
  state[candidate.concept_id]={
    ...previous,
    concept_id:candidate.concept_id,
    asset:candidate.asset,
    source_drive_id:candidate.source_drive_id||null,
    decision,
    decided_at:new Date().toISOString()
  };
  delete state.__finalized_at;
  saveState(state);
  render();
}
function setRemark(candidate,remark){
  const state=loadState();
  const previous=recordFor(candidate,state);
  state[candidate.concept_id]={
    ...previous,
    concept_id:candidate.concept_id,
    asset:candidate.asset,
    source_drive_id:candidate.source_drive_id||null,
    remark
  };
  delete state.__finalized_at;
  saveState(state);
}
function decisionButton(label,decision,candidate,current){
  const node=document.createElement('button');
  node.type='button';
  node.className='decision-button';
  node.textContent=label;
  node.setAttribute('aria-pressed',String(current===decision));
  node.addEventListener('click',()=>setDecision(candidate,decision));
  return node;
}
function renderCard(candidate,state){
  const current=recordFor(candidate,state);
  const card=document.createElement('article');
  card.className='candidate-card';
  card.dataset.candidateId=candidate.concept_id;
  card.dataset.decision=current.decision||'';

  const title=document.createElement('h2');
  title.className='candidate-name';
  title.textContent=candidate.label;

  const visual=document.createElement('div');
  visual.className='candidate-image-wrap';
  const image=document.createElement('img');
  image.className='candidate-image';
  image.src=candidate.asset;
  image.alt=`Illustration candidate : ${candidate.label}`;
  image.loading='lazy';
  visual.append(image);

  const choices=document.createElement('div');
  choices.className='decision-group';
  choices.setAttribute('aria-label',`Décision pour ${candidate.label}`);
  choices.append(
    decisionButton('✓ VALIDER','VALIDATED',candidate,current.decision),
    decisionButton('✕ REFUSER','REJECTED',candidate,current.decision)
  );

  const commentWrap=document.createElement('div');
  commentWrap.className='comment-wrap';
  const label=document.createElement('label');
  const textarea=document.createElement('textarea');
  const textareaId=`remark-${candidate.concept_id.replace(/[^a-z0-9_-]/gi,'-')}`;
  textarea.id=textareaId;
  label.htmlFor=textareaId;
  label.textContent='Remarque / correction souhaitée';
  textarea.placeholder='Facultatif';
  textarea.value=current.remark||'';
  const saved=document.createElement('p');
  saved.className='saved';
  saved.textContent=current.decision?'Décision enregistrée sur ce téléphone.':'';
  textarea.addEventListener('input',()=>{
    setRemark(candidate,textarea.value);
    saved.textContent='Remarque enregistrée sur ce téléphone.';
  });
  commentWrap.append(label,textarea);

  card.append(title,visual,choices,commentWrap,saved);
  return card;
}
function progress(state){
  const total=manifest.candidates.length;
  const examined=manifest.candidates.filter(c=>recordFor(c,state).decision).length;
  progressText.textContent=`${examined} / ${total} examinées`;
  progressBar.style.width=total?`${Math.round(examined/total*100)}%`:'0%';
  finalButton.disabled=total===0||examined!==total;
  status.textContent=finalButton.disabled
    ?`Le bouton s’active quand les ${total||10} images ont reçu une décision.`
    :'Les 10 décisions sont prêtes. Tu peux valider le lot et récupérer le résultat.';
}
function render(){
  const state=loadState();
  list.replaceChildren();
  for(const candidate of manifest.candidates)list.append(renderCard(candidate,state));
  empty.hidden=manifest.candidates.length>0;
  progress(state);
}
function payload(){
  const state=loadState();
  return {
    schema_version:1,
    batch_id:manifest.batch_id,
    finalized_at:new Date().toISOString(),
    decisions:manifest.candidates.map(candidate=>{
      const r=recordFor(candidate,state);
      return {
        concept_id:candidate.concept_id,
        asset:candidate.asset,
        source_drive_id:candidate.source_drive_id||null,
        decision:r.decision,
        remark:r.remark||'',
        decided_at:r.decided_at
      };
    })
  };
}
function finalizeBatch(){
  if(finalButton.disabled)return;
  const data=payload();
  const state=loadState();
  state.__finalized_at=data.finalized_at;
  saveState(state);
  const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`rebulo-validation-${manifest.batch_id}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  status.textContent='Lot validé localement : le fichier JSON structuré a été préparé. Aucune promotion canonique n’a été faite.';
}
async function init(){
  const slug=batchSlug();
  try{
    const response=await fetch(`${BATCH_ROOT}/${slug}.json`,{cache:'no-store'});
    if(!response.ok)throw new Error('batch manifest unavailable');
    const loaded=await response.json();
    const candidates=Array.isArray(loaded.candidates)?loaded.candidates.filter(c=>c&&c.concept_id&&c.label&&c.asset):[];
    manifest={batch_id:loaded.batch_id||slug,candidates};
    batchLabel.textContent=(loaded.title||manifest.batch_id).toUpperCase();
    render();
  }catch(error){
    console.error(error);
    manifest={batch_id:slug,candidates:[]};
    batchLabel.textContent=slug.toUpperCase();
    render();
    status.textContent='Impossible de charger ce lot.';
  }
}
finalButton.addEventListener('click',finalizeBatch);
init();

export {batchSlug,loadState,recordFor,payload};
