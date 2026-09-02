const shell=document.querySelector('.app-shell');
const gate=document.querySelector('#ageGate');
const change=document.querySelector('#changeAge');
const legacyAge=document.querySelector('#age');
const buttons=[...document.querySelectorAll('[data-rebulo-age]')];
const STORAGE_KEY='rebulo-age';
const allowed=new Set([5,7,9,12]);

function normalizeAge(value){
  const age=Number(value);
  return allowed.has(age)?age:null;
}

export function currentRebuloAge(){
  return normalizeAge(shell?.dataset.age)||7;
}

function applyAge(value,{persist=true}={}){
  const age=normalizeAge(value);
  if(!age||!shell)return;
  shell.dataset.age=String(age);
  shell.dataset.ageReady='true';
  if(gate)gate.hidden=true;
  if(change){change.hidden=false;change.textContent=age===5?'5–6 ans':age===7?'7–8 ans':age===9?'9–11 ans':'12 ans +';}
  if(legacyAge)legacyAge.value=String(age);
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.rebuloAge)===age)));
  if(persist){try{localStorage.setItem(STORAGE_KEY,String(age));}catch{}}
  window.dispatchEvent(new CustomEvent('rebulo:agechange',{detail:{age}}));
}

function openGate(){
  if(!shell)return;
  shell.dataset.ageReady='false';
  if(gate)gate.hidden=false;
  if(change)change.hidden=true;
}

buttons.forEach(button=>button.addEventListener('click',()=>applyAge(button.dataset.rebuloAge)));
change?.addEventListener('click',openGate);

let stored=null;
try{stored=normalizeAge(localStorage.getItem(STORAGE_KEY));}catch{}
if(stored)applyAge(stored,{persist:false});
else openGate();
