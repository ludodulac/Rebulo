import {buildAutomaticCreatorTargets,mergeCreatorTargets} from './creator-catalog.js';
import {buildNumberGapTargets,buildOpenPictogramGapTargets,mergeOpenPictograms} from './open-pictogram-library.js';
import {buildWave2GapTargets,mergeOpenPictogramsWave2} from './open-pictogram-library-wave2.js';
import {buildWave3GapTargets,mergeOpenPictogramsWave3} from './open-pictogram-library-wave3.js';

const nativeFetch=window.fetch.bind(window);

function jsonResponse(value){
  return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});
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
    return jsonResponse(mergeOpenPictogramsWave3(mergeOpenPictogramsWave2(mergeOpenPictograms(seed))));
  }

  if(!url.endsWith('data/corpus-pilot.json'))return nativeFetch(input,init);

  const [corpusResponse,coverageResponse]=await Promise.all([
    nativeFetch(input,init),
    nativeFetch('data/coverage-report.json',{cache:'no-store'})
  ]);
  if(!corpusResponse.ok||!coverageResponse.ok)return corpusResponse;

  const corpus=await corpusResponse.json();
  const coverage=await coverageResponse.json();
  const manualItems=Array.isArray(corpus?.items)?corpus.items:[];
  const generatedItems=[
    ...buildAutomaticCreatorTargets(coverage),
    ...buildOpenPictogramGapTargets(coverage),
    ...buildWave2GapTargets(coverage),
    ...buildWave3GapTargets(coverage),
    ...buildNumberGapTargets(coverage)
  ];
  return jsonResponse({...corpus,items:mergeCreatorTargets(manualItems,generatedItems)});
};

hideMechanicalPlusSigns();
await import('../app.js');