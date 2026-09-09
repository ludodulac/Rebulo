import {comprehensionItems,createComprehensionSession,recordComprehensionObservation,comprehensionSessionExport} from './src/general-operation-comprehension-session.js';

const $=selector=>document.querySelector(selector);
const els={setup:$('#setupPanel'),trial:$('#trialPanel'),complete:$('#completePanel'),start:$('#startSession'),progress:$('#trialProgress'),cue:$('#operationCue'),form:$('#responseForm'),response:$('#interpretationVerbatim'),hesitation:$('#hesitation'),misreading:$('#misreading'),noResponse:$('#noResponse'),summary:$('#completeSummary'),exportJson:$('#exportJson'),newSession:$('#newSession'),status:$('#status'),trialStatus:$('#trialStatus')};
let registry=null;let items=[];let byId=new Map();let session=null;let index=0;

function anonymousSessionCode(){
  if(globalThis.crypto?.getRandomValues){const values=new Uint32Array(2);globalThis.crypto.getRandomValues(values);return `OC-${values[0].toString(36)}${values[1].toString(36)}`.slice(0,32);}
  return `OC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`.slice(0,32);
}
function currentItem(){return byId.get(session?.itemIds?.[index])||null;}
function renderCue(item){
  els.cue.replaceChildren();
  const wrap=document.createElement('div');
  const grapheme=document.createElement('div');grapheme.className='grapheme';grapheme.textContent=item.grapheme;wrap.append(grapheme);
  const ipa=document.createElement('div');ipa.className='ipa';ipa.textContent=item.ipa;wrap.append(ipa);
  if(item.operationType==='contextual_grapheme'&&item.sourceExample){
    const source=document.createElement('div');source.className='source';source.textContent=`${item.sourceExample.word}  ${item.sourceExample.ipa}`;wrap.append(source);
    const context=document.createElement('div');context.className='context-badge';context.textContent=item.sourceExample.context==='suffix'?'bord final du mot':'bord initial du mot';wrap.append(context);
  }
  els.cue.append(wrap);
}
function renderTrial(){const item=currentItem();if(!item)return finish();els.progress.textContent=`Opération ${index+1} / ${session.itemIds.length}`;renderCue(item);els.response.value='';els.hesitation.checked=false;els.misreading.checked=false;els.noResponse.checked=false;els.response.disabled=false;els.trialStatus.textContent='';els.response.focus();}
function start(){session=createComprehensionSession(registry,{sessionCode:anonymousSessionCode(),orderMode:'random'});if(!session){els.status.textContent='Impossible de lancer la passation.';return}index=0;els.setup.hidden=true;els.complete.hidden=true;els.trial.hidden=false;renderTrial();}
function finish(){els.trial.hidden=true;els.complete.hidden=false;els.summary.textContent=`${session.observations.length} interprétation(s) enregistrée(s) sur ${session.itemIds.length} opérations.`;}
function reset(){session=null;index=0;els.complete.hidden=true;els.trial.hidden=true;els.setup.hidden=false;els.status.textContent='';els.start.focus();}
function download(){const payload=comprehensionSessionExport(session);if(!payload)return;const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`rebulo-operation-comprehension-${payload.sessionCode}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}

els.noResponse?.addEventListener('change',()=>{els.response.disabled=els.noResponse.checked;if(els.noResponse.checked)els.response.value='';});
els.form?.addEventListener('submit',event=>{event.preventDefault();const item=currentItem();const updated=recordComprehensionObservation(session,item,{interpretationVerbatim:els.response.value,hesitation:els.hesitation.checked,noResponse:els.noResponse.checked,misreading:els.misreading.checked});if(!updated){els.trialStatus.textContent='Note la première interprétation, ou coche « Pas de réponse ».';return}session=updated;index+=1;if(index>=session.itemIds.length)finish();else renderTrial();});
els.start?.addEventListener('click',start);els.exportJson?.addEventListener('click',download);els.newSession?.addEventListener('click',reset);

async function init(){try{const response=await fetch('./data/general-operation-comprehension-tests.json',{cache:'no-store'});if(!response.ok)throw new Error('protocol unavailable');registry=await response.json();items=comprehensionItems(registry);byId=new Map(items.map(item=>[item.id,item]));if(items.length!==10)throw new Error(`expected 10 items, got ${items.length}`);}catch(error){console.error(error);els.start.disabled=true;els.status.textContent='Impossible de charger le protocole de compréhension.';}}
init();
