import {buildAutomaticCreatorTargets,mergeCreatorTargets} from './creator-catalog.js';
import {buildNumberGapTargets,buildOpenPictogramGapTargets,mergeOpenPictograms} from './open-pictogram-library.js';
import {buildWave2GapTargets,mergeOpenPictogramsWave2} from './open-pictogram-library-wave2.js';
import {buildWave3GapTargets,mergeOpenPictogramsWave3} from './open-pictogram-library-wave3.js';
import {buildRelationalTherapyCatalog} from './relational-therapy-catalog.js';
import {attachCreatorRelationalActivities} from './relational-creator-exposure.js';

const nativeFetch=window.fetch.bind(window);
let canonicalLexicon=[];

function jsonResponse(value){
  return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});
}

function normalizeWord(value=''){
  return String(value||'').trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

function canonicalStimulus(word=''){
  const key=normalizeWord(word);
  if(!key)return null;
  return canonicalLexicon.find(item=>item?.active!==false&&item?.image&&(normalizeWord(item?.label)===key||normalizeWord(item?.id)===key))||null;
}

function addStimulusImage(parent,word,{focus=false}={}){
  const stimulus=canonicalStimulus(word);
  if(!stimulus||parent?.dataset?.rebuloCanonicalStimulus==='true')return false;
  const img=document.createElement('img');
  img.src=stimulus.image;
  img.alt='';
  img.setAttribute('aria-hidden','true');
  const label=document.createElement('span');
  label.textContent=focus?`Mot à écouter : « ${word} »`:word;
  parent.replaceChildren(img,label);
  parent.dataset.rebuloCanonicalStimulus='true';
  return true;
}

function decorateRhymeStimuli(){
  const focus=document.querySelector('.session-focus-word');
  if(focus&&focus.dataset.rebuloCanonicalStimulus!=='true'){
    const word=focus.textContent.match(/«\s*([^»]+?)\s*»/)?.[1]?.trim()||'';
    if(word)addStimulusImage(focus,word,{focus:true});
  }
  document.querySelectorAll('.session-choice-grid button').forEach(button=>{
    if(button.dataset.rebuloCanonicalStimulus==='true')return;
    const word=button.textContent.trim();
    if(word)addStimulusImage(button,word);
  });
}

function installCanonicalRhymeStimuli(){
  if(document.getElementById('rebulo-rhyme-stimuli'))return;
  const style=document.createElement('style');
  style.id='rebulo-rhyme-stimuli';
  style.textContent='.session-focus-word{display:grid;justify-items:center;gap:.4rem}.session-focus-word img{width:84px;height:84px;object-fit:contain}.session-choice-grid button{display:grid;grid-template-rows:minmax(72px,1fr) auto;justify-items:center;align-items:center;gap:.35rem;padding:.55rem}.session-choice-grid button img{width:100%;height:88px;object-fit:contain}@media(max-width:520px){.session-focus-word img{width:76px;height:76px}.session-choice-grid button img{height:96px}}';
  document.head.appendChild(style);
  new MutationObserver(decorateRhymeStimuli).observe(document.body,{childList:true,subtree:true});
  decorateRhymeStimuli();
}

function hideMechanicalPlusSigns(){
  if(document.getElementById('rebulo-rebus-spacing'))return;
  const style=document.createElement('style');
  style.id='rebulo-rebus-spacing';
  style.textContent='.rebus .plus,.play-rebus .plus,.session-runner .plus{display:none!important}';
  document.head.appendChild(style);
}

window.fetch=async function rebuloFetch(input,init){
  const url=typeof input==='string'?input:input?.url||'';

  if(url.endsWith('data/lexicon-seed.json')){
    const response=await nativeFetch(input,init);
    if(!response.ok)return response;
    const seed=await response.json();
    canonicalLexicon=mergeOpenPictogramsWave3(mergeOpenPictogramsWave2(mergeOpenPictograms(seed)));
    return jsonResponse(canonicalLexicon);
  }

  if(!url.endsWith('data/corpus-pilot.json'))return nativeFetch(input,init);

  const [corpusResponse,coverageResponse,rhymeResponse]=await Promise.all([
    nativeFetch(input,init),
    nativeFetch('data/coverage-report.json',{cache:'no-store'}),
    nativeFetch('data/rhyme-relations.json',{cache:'no-store'})
  ]);
  if(!corpusResponse.ok||!coverageResponse.ok)return corpusResponse;

  const corpus=await corpusResponse.json();
  const coverage=await coverageResponse.json();
  const rhymeRelations=rhymeResponse.ok?(await rhymeResponse.json()).relations||[]:[];
  const relationalCatalog=buildRelationalTherapyCatalog({rhymeRelations});
  const manualItems=Array.isArray(corpus?.items)?corpus.items:[];
  const generatedItems=[
    ...buildAutomaticCreatorTargets(coverage),
    ...buildOpenPictogramGapTargets(coverage),
    ...buildWave2GapTargets(coverage),
    ...buildWave3GapTargets(coverage),
    ...buildNumberGapTargets(coverage)
  ];
  const merged=mergeCreatorTargets(manualItems,generatedItems);
  return jsonResponse({...corpus,items:merged.map(item=>attachCreatorRelationalActivities(item,relationalCatalog))});
};

hideMechanicalPlusSigns();
installCanonicalRhymeStimuli();
await import('../app.js');