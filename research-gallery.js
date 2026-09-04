import {createResearchCuration,setResearchCurationDecision,researchCurationSummary,researchCurationExport} from './src/research-curation-session.js';

const groups=document.querySelector('#galleryGroups');
const status=document.querySelector('#galleryStatus');
const conceptCount=document.querySelector('#conceptCount');
const stimulusCount=document.querySelector('#stimulusCount');
const keepCount=document.querySelector('#keepCount');
const reworkCount=document.querySelector('#reworkCount');
const rejectCount=document.querySelector('#rejectCount');
const unreviewedCount=document.querySelector('#unreviewedCount');
const exportButton=document.querySelector('#exportCuration');
const clearButton=document.querySelector('#clearCuration');
let curation=null;

function text(tag,value,className=''){
  const node=document.createElement(tag);
  node.textContent=value||'';
  if(className)node.className=className;
  return node;
}

function refreshSummary(){
  const summary=researchCurationSummary(curation||{});
  keepCount.textContent=String(summary.keep);
  reworkCount.textContent=String(summary.rework);
  rejectCount.textContent=String(summary.reject);
  unreviewedCount.textContent=String(summary.unreviewed);
  exportButton.disabled=(summary.keep+summary.rework+summary.reject)===0;
}

function decisionControls(candidate={}){
  const wrap=document.createElement('div');wrap.className='curation-controls';
  const title=text('div','Curation visuelle','curation-title');wrap.append(title);
  const choices=document.createElement('div');choices.className='curation-choices';
  for(const [value,label] of [['keep','Garder'],['rework','Retravailler'],['reject','Écarter']]){
    const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.decision=value;
    button.addEventListener('click',()=>{
      const current=curation?.items?.find(item=>item.candidateId===candidate.candidateId);
      const nextDecision=current?.decision===value?null:value;
      const note=wrap.querySelector('textarea')?.value||'';
      const updated=setResearchCurationDecision(curation,candidate.candidateId,nextDecision,note);
      if(!updated)return;
      curation=updated;
      for(const peer of choices.querySelectorAll('button'))peer.setAttribute('aria-pressed',String(peer.dataset.decision===nextDecision));
      wrap.closest('.card').dataset.curation=nextDecision||'unreviewed';
      refreshSummary();
    });
    button.setAttribute('aria-pressed','false');choices.append(button);
  }
  const note=document.createElement('textarea');note.maxLength=240;note.rows=2;note.placeholder='Note de design facultative…';note.setAttribute('aria-label','Note de curation pour ce prototype');
  note.addEventListener('change',()=>{
    const current=curation?.items?.find(item=>item.candidateId===candidate.candidateId);
    if(!current)return;
    const updated=setResearchCurationDecision(curation,candidate.candidateId,current.decision,note.value);
    if(updated)curation=updated;
  });
  wrap.append(choices,note);return wrap;
}

function renderCandidate(candidate={}){
  const card=document.createElement('article');card.className='card';card.dataset.candidateId=candidate.candidateId||'';card.dataset.curation='unreviewed';
  const stage=document.createElement('div');stage.className='image-stage';
  const image=document.createElement('img');image.src=candidate.asset||'';image.alt='Prototype visuel';image.loading='lazy';
  image.addEventListener('error',()=>{card.dataset.loadError='true';stage.replaceChildren(text('p','Image indisponible — ne pas utiliser ce stimulus.','image-error'));});
  stage.append(image);
  const body=document.createElement('div');body.className='card-body';
  body.append(text('div',candidate.candidateId,'candidate-id'),text('p',candidate.designIntent,'intent'),text('div','Risques de dénomination','risk-title'));
  const risks=document.createElement('div');risks.className='risks';for(const risk of candidate.namingRisks||[])risks.append(text('span',risk,'risk'));body.append(risks);
  body.append(text('div','Provenance','provenance-title'),text('div',candidate.provenance,'provenance'),decisionControls(candidate));
  card.append(stage,body);return card;
}

function renderComparison(comparison={}){
  const section=document.createElement('section');section.className='concept-group';section.dataset.concept=comparison.concept||'';
  const heading=document.createElement('div');heading.className='concept-heading';heading.append(text('h2',comparison.concept),text('span',comparison.targetIpa,'ipa'));
  const cards=document.createElement('div');cards.className='cards';for(const candidate of comparison.candidates||[])cards.append(renderCandidate(candidate));
  section.append(heading,text('p',comparison.goal,'concept-goal'),cards);return section;
}

function downloadCuration(){
  const payload=researchCurationExport(curation);if(!payload||!payload.decisions.length)return;
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='rebulo-visual-curation.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);status.textContent='Curation visuelle exportée localement.';
}

function clearCuration(){
  if(!curation)return;
  curation={...curation,items:curation.items.map(item=>({...item,decision:null,note:''}))};
  for(const card of groups.querySelectorAll('.card')){card.dataset.curation='unreviewed';for(const button of card.querySelectorAll('.curation-choices button'))button.setAttribute('aria-pressed','false');const note=card.querySelector('textarea');if(note)note.value='';}
  refreshSummary();status.textContent='Choix de curation effacés.';
}

exportButton?.addEventListener('click',downloadCuration);clearButton?.addEventListener('click',clearCuration);

async function init(){
  try{
    const response=await fetch('./data/pictogram-prototype-comparisons.json',{cache:'no-store'});if(!response.ok)throw new Error('comparisons unavailable');
    const registry=await response.json();
    const comparisons=(registry.comparisons||[]).filter(item=>item.activationState==='inactive_until_human_decision'&&item.candidates?.length);
    curation=createResearchCuration({comparisons});
    groups.replaceChildren(...comparisons.map(renderComparison));
    conceptCount.textContent=String(comparisons.length);
    stimulusCount.textContent=String(comparisons.reduce((sum,item)=>sum+(item.candidates?.length||0),0));
    refreshSummary();
    if(!comparisons.length)status.textContent='Aucun prototype de recherche disponible.';
  }catch(error){console.error(error);status.textContent='Impossible de charger la planche de prototypes.';}
}
init();
