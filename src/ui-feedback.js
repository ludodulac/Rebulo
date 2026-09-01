const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function replayClass(node,className){
  if(!node||reducedMotion)return;
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
  window.setTimeout(()=>node.classList.remove(className),420);
}

function closeOtherPanels(opened){
  document.querySelectorAll('.bottom-nav .dock-panel[open]').forEach(panel=>{
    if(panel!==opened)panel.removeAttribute('open');
  });
}

document.querySelectorAll('.bottom-nav .dock-panel').forEach(panel=>{
  panel.addEventListener('toggle',()=>{
    if(panel.open)closeOtherPanels(panel);
  });
});

const createSummary=document.querySelector('.bottom-nav summary[aria-label="Créer"]');
const createPanel=createSummary?.closest('.dock-panel');
const targetInput=document.querySelector('#target');
createSummary?.addEventListener('click',event=>{
  event.preventDefault();
  createPanel?.removeAttribute('open');
  closeOtherPanels(null);
  targetInput?.focus({preventScroll:true});
  targetInput?.select();
});

const creatorForm=document.querySelector('#creatorForm');
const arena=document.querySelector('#result');
const creatorFeedback=document.querySelector('#creatorFeedback');
const exportFeedback=document.querySelector('#exportFeedback');
const sessionDock=document.querySelector('.session-dock');

creatorForm?.addEventListener('submit',()=>replayClass(arena,'is-refreshing'));

document.querySelector('#addToWorksheet')?.addEventListener('click',()=>{
  replayClass(sessionDock,'is-receiving');
});

document.querySelector('#downloadRebus')?.addEventListener('click',event=>replayClass(event.currentTarget,'is-working'));
document.querySelector('#downloadSeries')?.addEventListener('click',event=>replayClass(event.currentTarget,'is-working'));

if(creatorFeedback){
  new MutationObserver(()=>{
    if(creatorFeedback.textContent.includes('Solution stricte'))replayClass(arena,'is-ready');
  }).observe(creatorFeedback,{childList:true,subtree:true,characterData:true});
}

if(exportFeedback){
  new MutationObserver(()=>{
    const text=exportFeedback.textContent;
    if(text.includes('Ajouté'))replayClass(sessionDock,'is-confirmed');
    if(text.includes('créé'))replayClass(exportFeedback,'is-confirmed');
  }).observe(exportFeedback,{childList:true,subtree:true,characterData:true});
}
