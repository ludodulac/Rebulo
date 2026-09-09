import {buildAutomaticCreatorTargets,mergeCreatorTargets} from './creator-catalog.js';
import {buildNumberGapTargets,buildOpenPictogramGapTargets,mergeOpenPictograms} from './open-pictogram-library.js';
import {buildWave2GapTargets,mergeOpenPictogramsWave2} from './open-pictogram-library-wave2.js';
import {buildWave3GapTargets,mergeOpenPictogramsWave3} from './open-pictogram-library-wave3.js';
import {buildRelationalTherapyCatalog} from './relational-therapy-catalog.js';
import {attachCreatorRelationalActivities} from './relational-creator-exposure.js';

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
await import('../app.js');