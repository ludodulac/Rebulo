const shell=document.querySelector('.app-shell');
const input=document.querySelector('#target');
const surprise=document.querySelector('#phraseSurprise');
const form=document.querySelector('#creatorForm');

function ensureSwitch(){
  if(!form||document.querySelector('.creator-kind-switch'))return;
  const wrap=document.createElement('div');
  wrap.className='creator-kind-switch';
  wrap.setAttribute('role','group');
  wrap.setAttribute('aria-label','Type de création');
  for(const [kind,label] of [['word','Mot'],['phrase','Phrase']]){
    const button=document.createElement('button');
    button.type='button';
    button.className='secondary';
    button.dataset.creatorKind=kind;
    button.textContent=label;
    button.addEventListener('click',()=>setCreatorKind(kind));
    wrap.appendChild(button);
  }
  form.prepend(wrap);
}

export function setCreatorKind(kind='word'){
  const value=kind==='phrase'?'phrase':'word';
  if(shell)shell.dataset.creatorKind=value;
  document.querySelectorAll('[data-creator-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.creatorKind===value)));
  if(input){input.placeholder=value==='phrase'?'Ex. Papa dessine un chat…':'Ex. merci, cinéma…';input.setAttribute('aria-label',value==='phrase'?'Phrase à transformer':'Mot à transformer');}
  if(surprise)surprise.hidden=value!=='phrase';
}

ensureSwitch();
setCreatorKind(shell?.dataset.creatorKind||'word');
