import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {buildPronunciationLookup,phraseToContinuousIPA,planPhraseRepresentationPaths} from '../src/rebus-phrase-phonetics.js';
import {buildRepresentationPathIndex} from '../src/rebus-representation-paths.js';
import {playableRepresentationBankRows} from '../src/generated-play-catalog.js';

const json=path=>JSON.parse(readFileSync(new URL(`../${path}`,import.meta.url),'utf8'));
const pronunciations=json('data/rebus-pronunciation-lexicon.json');
const soundCatalog=json('data/rebus-sound-catalog.json');
const visibleConventions=json('data/rebus-visible-conventions.json');
const ideas=json('data/rebus-fragment-representation-ideas.json');
const corpus=json('data/corpus-pilot.json');
const coverage=json('data/coverage-report.json');
const section=process.argv[2]||'all';
const run=name=>section==='all'||section===name;

const buildStarted=performance.now();
const pronunciationLookup=buildPronunciationLookup(pronunciations);
const bankRows=playableRepresentationBankRows(soundCatalog,visibleConventions);
const optionIndex=buildRepresentationPathIndex(bankRows);
const buildMs=performance.now()-buildStarted;
assert.ok(optionIndex.optionCount>0);
assert.ok(optionIndex.optionCount<10000,'runtime planner must use the compact eligible representation bank, not the 423,521-fragment research index');

function plan(value,{mode='general',limit=12}={}){
  return planPhraseRepresentationPaths(value,pronunciationLookup,bankRows,{mode,limit,maxPieces:24,allowGaps:true,optionIndex});
}
function labels(route={}){return (route.operations||[]).filter(item=>!['gap','unresolved_word'].includes(item.kind)).map(item=>item.label);}
function routeWithLabels(planned,wanted=[]){return (planned.routes||[]).find(route=>wanted.every((label,index)=>labels(route)[index]===label))||null;}

const summary={pronunciationForms:pronunciationLookup.size,runtimeBankRows:bankRows.length,runtimeOptionCount:optionIndex.optionCount,indexBuildMs:Number(buildMs.toFixed(2))};

if(run('core')){
  const piliPhonetics=phraseToContinuousIPA('pili',pronunciationLookup);
  assert.equal(piliPhonetics.complete,true);
  assert.equal(piliPhonetics.continuousIpa,'pili');
  if(!pronunciationLookup.has('pili'))assert.equal(piliPhonetics.words[0].pronunciationMethod,'orthographic_sound_fallback');
  const pili=plan('pili',{mode:'strict'});
  const piliRoute=routeWithLabels(pili,['pie','lit']);
  assert.ok(piliRoute&&piliRoute.complete,'real runtime must compose /pili/ from active pie + lit');
  const papa=plan('papa',{mode:'strict'});
  const papaRoute=routeWithLabels(papa,['pas','pas']);
  assert.ok(papaRoute?.complete,'pas + pas must continue to compose papa');
  const merci=plan('merci',{mode:'strict'});
  const merciRoute=routeWithLabels(merci,['mer','scie']);
  assert.ok(merciRoute?.complete,'mer + scie must continue to compose merci');
  const naturalPili=plan('Papa dit pili',{mode:'general'});
  assert.equal(naturalPili.phonetics.unresolvedWords.length,0,'natural phrase containing pili must be dynamically phoneticized');
  assert.ok(naturalPili.routes.some(route=>{
    const ops=route.operations||[];const pie=ops.find(item=>item.label==='pie'&&item.sourceWords?.some(word=>word.text.toLowerCase()==='pili'));const lit=ops.find(item=>item.label==='lit'&&item.sourceWords?.some(word=>word.text.toLowerCase()==='pili'));return pie&&lit;
  }),'phrase planning must retain pie + lit knowledge inside a natural phrase');
  Object.assign(summary,{piliPronunciationMethod:piliPhonetics.words[0].pronunciationMethod,pili:labels(piliRoute),papa:labels(papaRoute),merci:labels(merciRoute)});
}

if(run('activation')){
  const inactiveIdeas=(ideas.entries||[]).filter(item=>item.automaticActivation===false);
  assert.ok(inactiveIdeas.length>0);
  for(const idea of inactiveIdeas.slice(0,20))assert.equal(bankRows.some(row=>(row.exactImageRepresentations||[]).some(rep=>rep.id===idea.id)),false,`editorial-only ${idea.id} must not appear as an active image`);
  for(const id of ['cui-oisillon','oeufs-pluriel']){
    const idea=(ideas.entries||[]).find(item=>item.id===id);assert.ok(idea&&idea.automaticActivation===false,`${id} must remain editorial-only`);
    assert.equal(bankRows.some(row=>(row.exactImageRepresentations||[]).some(rep=>rep.id===id)),false);
  }
  const cuire=plan('cuire les œufs',{mode:'general',limit:20});
  assert.equal(cuire.phonetics.unresolvedWords.length,0);
  const cuireBest=cuire.routes[0];
  assert.ok(cuireBest);
  assert.equal(cuireBest.operations.some(item=>['cui-oisillon','oeufs-pluriel'].includes(item.id)),false);
  summary.cuireLesOeufs={continuousIpa:cuire.phonetics.continuousIpa,coverageRatio:cuireBest.scoreBreakdown?.coverageRatio,uncoveredUnits:cuireBest.uncoveredUnits,operations:cuireBest.operations.map(item=>({kind:item.kind,label:item.label,targetIpa:item.targetIpa,phoneticTier:item.phoneticTier,crossesWordBoundary:item.crossesWordBoundary}))};
}

if(run('observations')){
  const benchmark=json('data/rebus-real-phrase-benchmark.json');
  let naturalCross=null;
  for(const item of benchmark.rows||[]){
    const planned=plan(item.phrase,{mode:'general',limit:24});
    for(const route of planned.routes||[]){
      const operation=(route.operations||[]).find(op=>op.kind!=='gap'&&op.crossesWordBoundary);
      if(operation){naturalCross={phrase:item.phrase,operation};break;}
    }
    if(naturalCross)break;
  }
  const targetKeys=new Set();
  for(const item of corpus.items||[])if(item?.target)targetKeys.add(String(item.target).toLocaleLowerCase('fr'));
  for(const item of [...(coverage.constructible||[]),...(coverage.constructibleMultiPiece||[])])if(item?.word)targetKeys.add(String(item.word).toLocaleLowerCase('fr'));
  const probes=[{word:'pili',pieces:['pie','lit']},{word:'lipi',pieces:['lit','pie']},{word:'pilipa',pieces:['pie','lit','pas']},{word:'lipali',pieces:['lit','pas','lit']}];
  const discovered=[];
  for(const probe of probes){
    assert.equal(targetKeys.has(probe.word),false,`${probe.word} must stay absent from the prebuilt creator target catalog`);
    const planned=plan(probe.word,{mode:'strict',limit:12});
    const route=routeWithLabels(planned,probe.pieces);
    if(route?.complete)discovered.push({word:probe.word,ipa:planned.phonetics.continuousIpa,pieces:labels(route),pronunciationMethod:planned.phonetics.words[0]?.pronunciationMethod});
  }
  assert.ok(discovered.length>=3,'real active runtime pieces should compose several phoneticized inputs absent from the prebuilt target catalog');
  summary.unknownCatalogExamples=discovered;
  summary.naturalCrossBoundary=naturalCross?{phrase:naturalCross.phrase,label:naturalCross.operation.label,ipa:naturalCross.operation.targetIpa,sourceWords:naturalCross.operation.sourceWords.map(word=>word.text)}:null;
}

if(run('performance')){
  const perfPhrases=['Papa dit pili','Merci papa','Le petit chat regarde la pluie','Elle a mis le livre sur la table','cuire les œufs'];
  const loops=15;const perfStarted=performance.now();
  for(let i=0;i<loops;i++)for(const phrase of perfPhrases)plan(phrase,{mode:'general',limit:6});
  const planMs=performance.now()-perfStarted;
  const planCount=loops*perfPhrases.length;
  const meanPlanMs=planMs/planCount;
  assert.ok(meanPlanMs<100,`cached phrase planning should remain comfortably interactive; observed ${meanPlanMs.toFixed(2)} ms/plan`);
  summary.meanCachedPlanMs=Number(meanPlanMs.toFixed(2));
}

console.log(`continuous-phrase-runtime.test.mjs[${section}]: ${JSON.stringify(summary)}`);
