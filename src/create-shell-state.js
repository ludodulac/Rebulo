const shell=document.querySelector('.app-shell');
const result=document.querySelector('#result');
const target=document.querySelector('#target');
const feedback=document.querySelector('#creatorFeedback');

function syncCreatorReady(){
  if(!shell||!result)return;
  shell.dataset.creatorReady=String(!result.hidden);
}

if(result){
  syncCreatorReady();
  new MutationObserver(syncCreatorReady).observe(result,{attributes:true,attributeFilter:['hidden']});
}

window.setTimeout(()=>{
  if(target&&!target.value.trim()&&feedback?.textContent==='Écris d’abord un mot.')feedback.textContent='';
  syncCreatorReady();
},0);
