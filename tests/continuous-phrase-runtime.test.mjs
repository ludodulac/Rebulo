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
function activeImageId(id=''){return bankRows.some(row=>(row.exactImageRepresentations||[]).some(rep=>rep.id===id));}

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
  assert.equal(ideas.status,'curated_textual_bank_not_automatically_active');
  const allIdeas=ideas.entries||[];
  assert.ok(allIdeas.length>0);
  assert.ok(allIdeas.every(item=>item.automaticActivation===false),'#279 ideas must remain explicitly non-activating');
  for(const id of ['cui-oisillon','oeufs-pluriel','eux-groupe','raie-trait']){
    const idea=allIdeas.find(item=>item.id===id);assert.ok(idea&&idea.automaticActivation===false,`${id} must remain editorial-only`);
    assert.equal(activeImageId(id),false,`${id} must not enter the active image bank without its own production asset`);
  }
  const variant=allIdeas.find(item=>item.id==='e-letter');
  const playful=allIdeas.find(item=>item.id==='un-vs-in-near');
  const locked=allIdeas.find(item=>item.id==='d-apostrophe');
  assert.equal(variant?.strictness,'variant_documented');
  assert.equal(playful?.strictness,'playful_near');
  assert.equal(locked?.strictness,'orthophony_locked');
  summary.activationBoundary={allIdeasNonActivating:true,verifiedInactiveIds:['cui-oisillon','oeufs-pluriel','eux-groupe','raie-trait'],qualifiedStatuses:{variant:variant?.strictness,playful:playful?.strictness,locked:locked?.strictness}};
}

if(run('cuire')){
  const cuire=plan('cuire les œufs',{mode:'general',limit:20});
  const cuireBest=cuire.routes[0]||null;
  if(cuireBest)assert.equal(cuireBest.operations.some(item=>['cui-oisillon','oeufs-pluriel'].includes(item.id)),false);
  summary.cuireLesOeufs={continuousIpa:cuire.phonetics.continuousIpa,resolvedWordCount:cuire.phonetics.resolvedWordCount,unresolvedWords:cuire.phonetics.unresolvedWords,coverageRatio:cuireBest?.scoreBreakdown?.coverageRatio??0,uncoveredUnits:cuireBest?.uncoveredUnits??cuire.phonetics.unitCount,operations:(cuireBest?.operations||[]).map(item=>({kind:item.kind,label:item.label,targetIpa:item.targetIpa,phoneticTier:item.phoneticTier,crossesWordBoundary:item.crossesWordBoundary}))};
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
  const probes=[
    {word:'pili',pieces:['pie','lit']},{word:'lipi',pieces:['lit','pie']},{word:'pimi',pieces:['pie','mie']},{word:'mipi',pieces:['mie','pie']},
    {word:'limi',pieces:['lit','mie']},{word:'mili',pieces:['mie','lit']},{word:'sipi',pieces:['scie','pie']},{word:'pisi',pieces:['pie','scie']},
    {word:'sili',pieces:['scie','lit']},{word:'lisi',pieces:['lit','scie']},{word:'ripi',pieces:['riz','pie']},{word:'piri',pieces:['pie','riz']},
    {word:'rili',pieces:['riz','lit']},{word:'liri',pieces:['lit','riz']}
  ];
  const discovered=[];
  for(const probe of probes){
    if(targetKeys.has(probe.word))continue;
    const planned=plan(probe.word,{mode:'strict',limit:30});
    const route=routeWithLabels(planned,probe.pieces);
    if(!route?.complete)continue;
    discovered.push({word:probe.word,ipa:planned.phonetics.continuousIpa,pieces:labels(route),pronunciationMethod:planned.phonetics.words[0]?.pronunciationMethod});
    if(discovered.length>=4)break;
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
