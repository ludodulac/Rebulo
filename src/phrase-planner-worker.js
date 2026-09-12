import {playableRepresentationBankRows} from './generated-play-catalog.js';
import {buildPronunciationLookup,planPhraseRepresentationPaths} from './rebus-phrase-phonetics.js';
import {buildRepresentationPathIndex} from './rebus-representation-paths.js';

let resourcesPromise=null;
async function loadJSON(relativePath){const url=new URL(relativePath,import.meta.url);const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw new Error(`${relativePath}: ${response.status}`);return response.json();}
async function loadResources(){
  if(resourcesPromise)return resourcesPromise;
  resourcesPromise=(async()=>{
    const started=performance.now();
    const [pronunciations,soundCatalog,visibleConventions]=await Promise.all([
      loadJSON('../data/rebus-pronunciation-lexicon.json'),
      loadJSON('../data/rebus-sound-catalog.json'),
      loadJSON('../data/rebus-visible-conventions.json')
    ]);
    const pronunciationLookup=buildPronunciationLookup(pronunciations);
    const bankRows=playableRepresentationBankRows(soundCatalog,visibleConventions);
    const optionIndex=buildRepresentationPathIndex(bankRows);
    return {pronunciationLookup,bankRows,optionIndex,prepareMs:performance.now()-started};
  })();
  resourcesPromise.catch(()=>{resourcesPromise=null;});
  return resourcesPromise;
}

self.addEventListener('message',async event=>{
  const message=event.data||{};
  try{
    if(message.type==='warm'){
      const resources=await loadResources();
      self.postMessage({type:'ready',id:message.id||null,prepareMs:resources.prepareMs,pronunciationForms:resources.pronunciationLookup.size,optionCount:resources.optionIndex.optionCount});
      return;
    }
    if(message.type!=='plan')return;
    const resources=await loadResources();
    const started=performance.now();
    const planned=planPhraseRepresentationPaths(String(message.value||''),resources.pronunciationLookup,resources.bankRows,{mode:'general',limit:6,maxPieces:16,allowGaps:true,optionIndex:resources.optionIndex});
    self.postMessage({type:'plan',id:message.id,planned,prepareMs:resources.prepareMs,planMs:performance.now()-started});
  }catch(error){
    self.postMessage({type:'error',id:message.id||null,message:String(error?.message||error),stack:String(error?.stack||'')});
  }
});
