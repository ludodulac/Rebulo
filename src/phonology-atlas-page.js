import {availablePhonemes,filterAtlas,groupByWholeSound,atlasStats} from './phonology-atlas.js';

const phonemeInput=document.getElementById('phonemeInput');
const positionSelect=document.getElementById('positionSelect');
const queryInput=document.getElementById('queryInput');
const strictOnly=document.getElementById('strictOnly');
const results=document.getElementById('atlasResults');
const status=document.getElementById('atlasStatus');
const chips=document.getElementById('phonemeChips');

document.getElementById('printButton').addEventListener('click',()=>window.print());

const escapeHtml=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function card(entry,blank=false){
  return `<article class="atlas-card">
    <div><strong>${escapeHtml(entry.label)}</strong><div class="meta">${escapeHtml(entry.indexId)} · /${escapeHtml(entry.ipa)}/</div></div>
    ${blank?'<div class="blank-box" aria-label="case vide pour dessiner"></div>':`<img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.label)}" loading="lazy">`}
    <div class="meta">${entry.strictEligible?'Pièce stricte possible':'Illustration générale'} · ${entry.soundUnit==='syllable_evidenced'?'syllabe documentée':'bloc sonore entier'}</div>
  </article>`;
}

function groupSection(ipa,entries,blank=false){
  return `<section class="sound-group ${blank?'print-copy':'screen-copy'}">
    <h2>/${escapeHtml(ipa)}/ <small>— ${blank?'à dessiner':'références'}</small></h2>
    <div class="cards">${entries.map(entry=>card(entry,blank)).join('')}</div>
  </section>`;
}

function render(){
  const filtered=filterAtlas({phoneme:phonemeInput.value,position:positionSelect.value,strictOnly:strictOnly.checked,query:queryInput.value});
  const groups=new Map();
  for(const entry of filtered){if(!groups.has(entry.ipa))groups.set(entry.ipa,[]);groups.get(entry.ipa).push(entry);}
  const ordered=[...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  const stats=atlasStats();
  status.textContent=`${filtered.length} pièce(s) affichée(s) · ${ordered.length} bloc(s) sonore(s) · ${stats.phonemes} phonèmes observés dans la banque actuelle. Aucun découpage syllabique n’est inventé.`;
  results.innerHTML=ordered.length?ordered.flatMap(([ipa,entries])=>[groupSection(ipa,entries,false),groupSection(ipa,entries,true)]).join(''):'<p>Aucune pièce ne correspond à ce filtre.</p>';
}

for(const {phoneme,count} of availablePhonemes().slice(0,48)){
  const button=document.createElement('button');
  button.type='button';button.textContent=`/${phoneme}/ · ${count}`;
  button.addEventListener('click',()=>{phonemeInput.value=phoneme;render();});
  chips.appendChild(button);
}

for(const control of [phonemeInput,positionSelect,queryInput,strictOnly])control.addEventListener(control.tagName==='SELECT'||control.type==='checkbox'?'change':'input',render);
render();
