import {buildCreatorTargets,mergeCreatorTargets} from './creator-catalog.js';

const nativeFetch=window.fetch.bind(window);

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
  const generatedItems=buildCreatorTargets(coverage);
  const merged={...corpus,items:mergeCreatorTargets(manualItems,generatedItems)};

  return new Response(JSON.stringify(merged),{
    status:200,
    headers:{'Content-Type':'application/json'}
  });
};

await import('../app.js');