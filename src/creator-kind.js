const shell=document.querySelector('.app-shell');
const input=document.querySelector('#target');
const surprise=document.querySelector('#phraseSurprise');
const buttons=[...document.querySelectorAll('[data-creator-kind]')];

export function setCreatorKind(kind='word'){
  const value=kind==='phrase'?'phrase':'word';
  if(shell)shell.dataset.creatorKind=value;
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.creatorKind===value)));
  if(input){input.placeholder=value==='phrase'?'Ex. Papa dessine un chat…':'Ex. merci, cinéma…';input.setAttribute('aria-label',value==='phrase'?'Phrase à transformer':'Mot à transformer');}
  if(surprise)surprise.hidden=value!=='phrase';
}

buttons.forEach(button=>button.addEventListener('click',()=>setCreatorKind(button.dataset.creatorKind)));
setCreatorKind(shell?.dataset.creatorKind||'word');
