import {buildCreatorTargets} from './creator-catalog.js';

const nativeFetch=window.fetch.bind(window);

function normalizeKey(value=''){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
}

window.fetch=async function rebuloFetch(input,init){
  const url=typeof input==='string'?input:input?.url||'';
  if(!url.endsWith('data/corpus-pilot.json'))return nativeFetch(input,init);

  const [corpusResponse,coverageResponse]=await Promise.all([
    nativeFetch(input,init),
    nativeFetch('data/coverage-report.json',{cache:'no-store'})
  ]);
  if(!corpusResponse.ok||!coverageResponse.ok)return corpusResponse;

  const corpus=await corpusResponse.json();
  const coverage=await coverageResponse.json();
  const manualItems=Array.isArray(corpus?.items)?corpus.items:[];
  const manualKeys=new Set(manualItems.map(item=>normalizeKey(item?.target)));
  const generatedItems=buildCreatorTargets(coverage).filter(item=>!manualKeys.has(normalizeKey(item.target)));
  const merged={...corpus,items:[...manualItems,...generatedItems]};

  return new Response(JSON.stringify(merged),{
    status:200,
    headers:{'Content-Type':'application/json'}
  });
};

await import('../app.js');
