import {availablePhonemes,filterAtlas,atlasStats} from './phonology-atlas.js';
import {filterLexicalEntries,lexicalSoundStats} from './lexical-sound-index.js';

const phonemeInput=document.getElementById('phonemeInput');
const positionSelect=document.getElementById('positionSelect');
const queryInput=document.getElementById('queryInput');
const strictOnly=document.getElementById('strictOnly');
const results=document.getElementById('atlasResults');
const status=document.getElementById('atlasStatus');
const chips=document.getElementById('phonemeChips');
const lexicalStatus=document.getElementById('lexicalStatus');
const lexicalWords=document.getElementById('lexicalWords');

let lexicalEntries=[];
let lexicalSource='';

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

function renderLexicalContext(){
  if(!lexicalEntries.length){
    lexicalStatus.textContent=lexicalSource?'Aucun mot constructible ne correspond à ce filtre.':'Contexte lexical indisponible pour le moment.';
    lexicalWords.innerHTML='';
    return;
  }
  const filtered=filterLexicalEntries(lexicalEntries,{phoneme:phonemeInput.value,position:positionSelect.value,query:queryInput.value,limit:30});
  const stats=lexicalSoundStats(lexicalEntries);
  lexicalStatus.textContent=`${filtered.length} exemple(s) affiché(s), triés par fréquence · ${stats.entries} formes uniques strictement constructibles issues de ${lexicalSource||'la source lexicale'}. Ce panneau ne représente pas tout le français.`;
  lexicalWords.innerHTML=filtered.length?filtered.map(entry=>`<span class="lexical-word"><strong>${escapeHtml(entry.word)}</strong><small>/${escapeHtml(entry.ipa)}/ · ${escapeHtml(entry.decomposition.join(' + '))}</small></span>`).join(''):'<span class="lexical-empty">Aucun mot constructible ne correspond à ce filtre.</span>';
}

function render(){
  const filtered=filterAtlas({phoneme:phonemeInput.value,position:positionSelect.value,strictOnly:strictOnly.checked,query:queryInput.value});
  const groups=new Map();
  for(const entry of filtered){if(!groups.has(entry.ipa))groups.set(entry.ipa,[]);groups.get(entry.ipa).push(entry);}
  const ordered=[...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  const stats=atlasStats();
  status.textContent=`${filtered.length} pièce(s) affichée(s) · ${ordered.length} bloc(s) sonore(s) · ${stats.phonemes} phonèmes observés dans la banque actuelle. Aucun découpage syllabique n’est inventé.`;
  results.innerHTML=ordered.length?ordered.flatMap(([ipa,entries])=>[groupSection(ipa,entries,false),groupSection(ipa,entries,true)]).join(''):'<p>Aucune pièce ne correspond à ce filtre.</p>';
  renderLexicalContext();
}

async function loadLexicalContext(){
  try{
    const response=await fetch('data/coverage-report.json');
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const report=await response.json();
    lexicalEntries=Array.isArray(report.constructible)?report.constructible:[];
    lexicalSource=report.source||'Lexique 4';
  }catch(error){
    console.warn('Contexte lexical Rebulo indisponible',error);
    lexicalEntries=[];
    lexicalSource='';
  }
  render();
}

for(const {phoneme,count} of availablePhonemes().slice(0,48)){
  const button=document.createElement('button');
  button.type='button';button.textContent=`/${phoneme}/ · ${count}`;
  button.addEventListener('click',()=>{phonemeInput.value=phoneme;render();});
  chips.appendChild(button);
}

for(const control of [phonemeInput,positionSelect,queryInput,strictOnly])control.addEventListener(control.tagName==='SELECT'||control.type==='checkbox'?'change':'input',render);
render();
loadLexicalContext();
