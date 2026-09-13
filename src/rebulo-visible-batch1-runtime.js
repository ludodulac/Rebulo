import {
  REBULO_VISIBLE_BATCH1,
  mergeVisibleBatch1Lexicon,
  applyVisibleBatch1ToBankRows,
  applyVisibleBatch1ToPlayCatalog,
  applyVisibleBatch1ToCreatorTargets
} from './rebulo-visible-batch1-assets.js';

const previousFetch=window.fetch.bind(window);
const key=value=>String(value||'').toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
const BY_ID=new Map(REBULO_VISIBLE_BATCH1.map(item=>[key(item.id),item]));
const BY_LABEL=new Map(REBULO_VISIBLE_BATCH1.map(item=>[key(item.label),item]));
const TRANSPARENT_PIXEL='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';

function responseFor(value){
  return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}

window.fetch=async function rebuloVisibleBatch1Fetch(input,init){
  const url=typeof input==='string'?input:input?.url||'';
  const clean=String(url).split(/[?#]/,1)[0];
  const response=await previousFetch(input,init);
  if(!response.ok)return response;
  if(clean.endsWith('data/lexicon-seed.json')){
    const lexicon=await response.json();
    return responseFor(mergeVisibleBatch1Lexicon(lexicon));
  }
  if(clean.endsWith('data/rebulo-compact-runtime.json')){
    const runtime=await response.json();
    return responseFor({
      ...runtime,
      bankRows:applyVisibleBatch1ToBankRows(runtime?.bankRows||[]),
      playRebuses:applyVisibleBatch1ToPlayCatalog(runtime?.playRebuses||[]),
      creatorTargets:applyVisibleBatch1ToCreatorTargets(runtime?.creatorTargets||[]),
      visibleBatch1:{active:true,count:REBULO_VISIBLE_BATCH1.length}
    });
  }
  return response;
};

function assetFromImage(img){
  const existing=BY_ID.get(key(img?.dataset?.rebuloVisibleBatch1));
  if(existing)return existing;
  const raw=String(img?.getAttribute?.('src')||'');
  const fromQuery=raw.match(/[?&]asset=([^&#]+)/)?.[1];
  if(fromQuery){const byQuery=BY_ID.get(key(decodeURIComponent(fromQuery)));if(byQuery)return byQuery;}
  const parent=img?.closest?.('.piece');
  const label=String(img?.alt||parent?.querySelector('span')?.textContent||'').trim();
  return BY_LABEL.get(key(label))||null;
}

function paintSprite(img,asset){
  img.dataset.rebuloVisibleBatch1=asset.id;
  img.src=TRANSPARENT_PIXEL;
  img.style.backgroundImage=`url("${asset.spriteUrl}")`;
  img.style.backgroundSize='500% 500%';
  img.style.backgroundPosition=`${asset.spriteColumn*25}% ${asset.spriteRow*25}%`;
  img.style.backgroundRepeat='no-repeat';
  img.style.backgroundColor='#fff';
  img.style.borderRadius='18px';
}

function applyBatchImage(img){
  if(!(img instanceof HTMLImageElement))return;
  const asset=assetFromImage(img);
  if(!asset)return;
  if(img.dataset.rebuloVisibleBatch1===asset.id&&img.style.backgroundImage)return;
  paintSprite(img,asset);
}

function decorate(root=document){
  if(root instanceof HTMLImageElement)applyBatchImage(root);
  if(root instanceof Element&&root.matches('.piece'))root.querySelectorAll('img').forEach(applyBatchImage);
  root.querySelectorAll?.('.piece img').forEach(applyBatchImage);
}

let decorateQueued=false;
function queueDecoration(){
  if(decorateQueued)return;
  decorateQueued=true;
  queueMicrotask(()=>{
    decorateQueued=false;
    decorate(document);
  });
}

function decorateDelayedRenders(duration=1200){
  const started=performance.now();
  const timer=setInterval(()=>{
    decorate(document);
    if(performance.now()-started>=duration)clearInterval(timer);
  },40);
}

const observer=new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){
      if(!(node instanceof Element))continue;
      decorate(node);
    }
  }
  queueDecoration();
});
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('submit',()=>{queueDecoration();decorateDelayedRenders();},true);
decorate(document);

if(!document.getElementById('rebulo-visible-batch1-style')){
  const style=document.createElement('style');
  style.id='rebulo-visible-batch1-style';
  style.textContent=`
    .piece img[data-rebulo-visible-batch1]{width:min(23vw,102px);height:min(23vw,102px);object-fit:cover;filter:none;box-shadow:0 4px 12px rgba(33,43,66,.08)}
    .app-shell[data-experience="create"][data-creator-ready="true"] .session-dock{display:none}
    @media(max-width:560px){.piece img[data-rebulo-visible-batch1]{width:min(24vw,88px);height:min(24vw,88px);border-radius:16px}}
  `;
  document.head.appendChild(style);
}

document.documentElement.dataset.rebuloVisibleBatch1=String(REBULO_VISIBLE_BATCH1.length);
