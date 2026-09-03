import {filterAtlas,atlasStats} from './phonology-atlas.js';
import {filterLexicalEntries,lexicalSoundStats} from './lexical-sound-index.js';
import {resolveFrenchSoundQuery,frenchSoundHelp} from './french-sound-search.js';

const soundInput=document.getElementById('soundInput');
const positionSelect=document.getElementById('positionSelect');
const queryInput=document.getElementById('queryInput');
const strictOnly=document.getElementById('strictOnly');
const results=document.getElementById('atlasResults');
const status=document.getElementById('atlasStatus');
const interpretation=document.getElementById('soundInterpretation');
const chips=document.getElementById('phonemeChips');
const lexicalStatus=document.getElementById('lexicalStatus');
const lexicalWords=document.getElementById('lexicalWords');

let lexicalEntries=[];let lexicalSource='';let productivityById=new Map();let productivitySource='';
document.getElementById('printButton').addEventListener('click',()=>window.print());
const escapeHtml=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function productivityText(entry){
  const proof=productivityById.get(entry.id);
  if(!proof)return entry.strictEligible?'Pièce stricte possible · preuve d’usage non chargée':'Illustration générale';
  if(proof.productivityStatus==='strict_productive')return `Utilisée dans ${proof.strictUseCount} rébus exact${proof.strictUseCount>1?'s':''} du corpus ${productivitySource||'de référence'}`;
  if(proof.productivityStatus==='strict_candidate')return `Candidate stricte · pas encore prouvée dans le corpus ${productivitySource||'de référence'}`;
  return 'Illustration générale · hors calcul strict';
}
function card(entry,blank=false){return `<article class="atlas-card"><div><strong>${escapeHtml(entry.label)}</strong><div class="meta">${escapeHtml(entry.indexId)} · /${escapeHtml(entry.ipa)}/</div></div>${blank?'<div class="blank-box" aria-label="case vide pour dessiner"></div>':`<img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.label)}" loading="lazy">`}<div class="meta">${escapeHtml(productivityText(entry))} · ${entry.soundUnit==='syllable_evidenced'?'syllabe documentée':'bloc sonore entier'}</div></article>`;}
function groupSection(ipa,entries,blank=false){return `<section class="sound-group ${blank?'print-copy':'screen-copy'}"><h2>/${escapeHtml(ipa)}/ <small>— ${blank?'à dessiner':'références'}</small></h2><div class="cards">${entries.map(entry=>card(entry,blank)).join('')}</div></section>`;}

function currentSounds(){return resolveFrenchSoundQuery(soundInput.value);}
function matchesAnyAtlas(candidate){return filterAtlas({phoneme:candidate,position:positionSelect.value,strictOnly:strictOnly.checked,query:queryInput.value});}
function matchesAnyLexical(candidate){return filterLexicalEntries(lexicalEntries,{phoneme:candidate,position:positionSelect.value,query:queryInput.value,limit:30});}

function renderLexicalContext(sound){
  const merged=new Map();
  for(const candidate of sound.ipaCandidates)for(const entry of matchesAnyLexical(candidate))merged.set(`${entry.word}|${entry.ipa}`,entry);
  let filtered=[...merged.values()].slice(0,30);
  if(!sound.query)filtered=filterLexicalEntries(lexicalEntries,{query:queryInput.value,limit:30});
  const stats=lexicalSoundStats(lexicalEntries);
  lexicalStatus.textContent=`${filtered.length} exemple(s) affiché(s), triés par fréquence · ${stats.entries} formes uniques strictement constructibles issues de ${lexicalSource||'la source lexicale'}. Ce panneau ne représente pas tout le français.`;
  lexicalWords.innerHTML=filtered.length?filtered.map(entry=>`<span class="lexical-word"><strong>${escapeHtml(entry.word)}</strong><small>/${escapeHtml(entry.ipa)}/ · ${escapeHtml(entry.decomposition.join(' + '))}</small></span>`).join(''):'<span class="lexical-empty">Aucun mot constructible ne correspond à ce son.</span>';
}

function render(){
  const sound=currentSounds();
  let filtered=[];
  if(!sound.query)filtered=filterAtlas({position:positionSelect.value,strictOnly:strictOnly.checked,query:queryInput.value});
  else for(const candidate of sound.ipaCandidates)filtered.push(...matchesAnyAtlas(candidate));
  filtered=[...new Map(filtered.map(entry=>[entry.indexId,entry])).values()];
  const groups=new Map();for(const entry of filtered){if(!groups.has(entry.ipa))groups.set(entry.ipa,[]);groups.get(entry.ipa).push(entry);}
  const ordered=[...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0]));const stats=atlasStats();
  if(!sound.query)interpretation.textContent='Écris un son comme tu le prononces : ra, och, cha, ou, on, ain…';
  else if(!sound.ipaCandidates.length)interpretation.textContent=`Je ne sais pas encore interpréter « ${sound.query} ». Essaie une écriture simple du son.`;
  else interpretation.textContent=sound.ambiguous?`« ${sound.query} » peut se prononcer de plusieurs façons : Rebulo cherche toutes les variantes plausibles.`:`Son « ${sound.query} » reconnu. La notation phonétique exacte reste gérée en coulisses.`;
  status.textContent=`${filtered.length} pièce(s) affichée(s) · ${ordered.length} bloc(s) sonore(s) · ${stats.phonemes} phonèmes observés dans la banque actuelle.`;
  results.innerHTML=ordered.length?ordered.flatMap(([ipa,entries])=>[groupSection(ipa,entries,false),groupSection(ipa,entries,true)]).join(''):'<p>Aucune pièce ne correspond à ce son dans la banque actuelle.</p>';
  renderLexicalContext(sound);
}

async function loadContext(){
  const [coverageResult,productivityResult]=await Promise.allSettled([fetch('data/coverage-report.json'),fetch('data/phonetic-productivity-report.json')]);
  try{const response=coverageResult.value;if(coverageResult.status!=='fulfilled'||!response.ok)throw new Error('coverage unavailable');const report=await response.json();lexicalEntries=Array.isArray(report.constructible)?report.constructible:[];lexicalSource=report.source||'Lexique 4';}catch(error){console.warn('Contexte lexical Rebulo indisponible',error);lexicalEntries=[];lexicalSource='';}
  try{const response=productivityResult.value;if(productivityResult.status!=='fulfilled'||!response.ok)throw new Error('productivity unavailable');const report=await response.json();const tokens=[...(report.productiveTokens||[]),...(report.candidateTokens||[]),...(report.generalOnlyTokens||[]),...(report.illustrationOnlyTokens||[])];productivityById=new Map(tokens.filter(x=>x.id).map(x=>[x.id,x]));productivitySource=report.source||'Lexique 4';}catch(error){console.warn('Preuves de productivité Rebulo indisponibles',error);productivityById=new Map();productivitySource='';}
  render();
}
for(const example of frenchSoundHelp()){const button=document.createElement('button');button.type='button';button.textContent=example;button.addEventListener('click',()=>{soundInput.value=example;render();});chips.appendChild(button);}
for(const control of [soundInput,positionSelect,queryInput,strictOnly])control.addEventListener(control.tagName==='SELECT'||control.type==='checkbox'?'change':'input',render);
render();loadContext();
