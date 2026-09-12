import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const output=process.env.OUTPUT_JSON||'compact-runtime-browser.json';
const cpuRate=Number(process.env.CPU_THROTTLE||4);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
const now=()=>performance.now();
const report={baseUrl,cpuRate,phase:'start',timings:{},cases:{},productChecks:{},resourcesByPage:{},resources:[],errors:[]};

async function checkpoint(phase){report.phase=phase;await writeFile(output,JSON.stringify(report,null,2));console.log(`[compact-browser] ${phase}`);}
async function step(label,fn,timeoutMs=30000){
  await checkpoint(`before:${label}`);
  let timer;
  try{
    const value=await Promise.race([
      Promise.resolve().then(fn),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`HARNESS_TIMEOUT ${label} after ${timeoutMs} ms`)),timeoutMs);})
    ]);
    await checkpoint(`after:${label}`);
    return value;
  }finally{clearTimeout(timer);}
}
function watchPage(page,label){page.on('pageerror',error=>report.errors.push(`${label}: ${String(error?.stack||error)}`));}
async function preparePage(label){
  const page=await context.newPage();watchPage(page,label);
  const session=await context.newCDPSession(page);if(cpuRate>1)await session.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
  await page.addInitScript(()=>{window.__rebuloLongTasks=[];try{new PerformanceObserver(list=>window.__rebuloLongTasks.push(...list.getEntries().map(entry=>entry.duration))).observe({type:'longtask',buffered:true});}catch{}});
  return page;
}
async function collectResources(page,label){
  const rows=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/\/data\/[^?#]+\.json(?:[?#]|$)/.test(r.name)).map(r=>({name:r.name,transferSize:r.transferSize,decodedBodySize:r.decodedBodySize,duration:Number(r.duration.toFixed(2))})));
  report.resourcesByPage[label]=rows;
  report.resources.push(...rows.map(row=>({...row,page:label})));
}

let phrasePage;
try{
  phrasePage=await step('phrase.prepare',()=>preparePage('phrase'),10000);
  const navigationStart=now();
  await step('phrase.goto',()=>phrasePage.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000}),35000);
  await step('phrase.interface',()=>phrasePage.waitForSelector('#playMode',{state:'visible',timeout:10000}),12000);
  report.timings.initialInterfaceUsableMs=Number((now()-navigationStart).toFixed(2));
  const initialRoundStart=now();
  await step('phrase.initialPlayRound',()=>phrasePage.waitForFunction(()=>document.querySelectorAll('#playRebus .piece').length>0,null,{timeout:15000}),18000);
  report.timings.initialPlayRoundMs=Number((now()-initialRoundStart).toFixed(2));

  const createStart=now();
  await step('phrase.openCreate.click',()=>phrasePage.evaluate(()=>document.querySelector('#createMode')?.click()),8000);
  await step('phrase.openCreate.state',()=>phrasePage.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.experience==='create',null,{timeout:5000}),7000);
  report.timings.openCreateMs=Number((now()-createStart).toFixed(2));

  const phraseStart=now();
  await step('phrase.openPhrase.click',()=>phrasePage.evaluate(()=>document.querySelector('[data-creator-kind="phrase"]')?.click()),8000);
  await step('phrase.openPhrase.state',()=>phrasePage.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.creatorKind==='phrase',null,{timeout:5000}),7000);
  report.timings.openPhraseMs=Number((now()-phraseStart).toFixed(2));

  async function phraseCase(key,value){
    const fillStart=now();
    await step(`${key}.fill`,()=>phrasePage.locator('#target').fill(value),8000);
    const inputMs=Number((now()-fillStart).toFixed(2));
    const started=now();
    await step(`${key}.submit`,()=>phrasePage.evaluate(()=>document.querySelector('#creatorForm')?.requestSubmit()),8000);
    await step(`${key}.result`,()=>phrasePage.waitForFunction(value=>!document.querySelector('#result')?.hidden&&document.querySelector('#resultWord')?.textContent===value,value,{timeout:15000}),18000);
    const visibleMs=Number((now()-started).toFixed(2));
    const data=await step(`${key}.snapshot`,()=>phrasePage.evaluate(()=>({
      planner:document.querySelector('.app-shell')?.dataset.phrasePlanner||'',
      prepareMs:Number(document.querySelector('.app-shell')?.dataset.phrasePlannerPrepareMs||0),
      plannerMs:Number(document.querySelector('.app-shell')?.dataset.phrasePlannerLastMs||0),
      proof:document.querySelector('#phoneticProof')?.textContent?.trim()||'',
      proofTitle:document.querySelector('#phoneticProof')?.title||'',
      pieces:[...document.querySelectorAll('#creatorRebus .piece')].map(node=>{const r=node.getBoundingClientRect();return{text:node.textContent?.trim()||'',visible:Boolean(node.getClientRects().length),inViewport:r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight};}),
      gaps:[...document.querySelectorAll('#creatorRebus .phrase-sound-gap,#creatorRebus .phrase-uncovered-token')].map(node=>node.textContent?.trim()||''),
      visiblePieceCount:[...document.querySelectorAll('#creatorRebus .piece')].filter(node=>node.getClientRects().length).length
    })),8000);
    report.cases[key]={value,inputMs,visibleMs,...data};
    return report.cases[key];
  }

  const ranger=await phraseCase('ranger','ranger la maison');report.timings.firstInputMs=ranger.inputMs;report.timings.firstResultVisibleMs=ranger.visibleMs;
  const pili=await phraseCase('pili','pili');
  const merciPapa=await phraseCase('merciPapa','merci papa');
  const papa=await phraseCase('papa','papa');
  report.timings.subsequentResultMs={pili:pili.visibleMs,merciPapa:merciPapa.visibleMs,papa:papa.visibleMs};
  report.timings.longTaskTotalMs=await step('phrase.longTasks.total',()=>phrasePage.evaluate(()=>Number((window.__rebuloLongTasks||[]).reduce((a,b)=>a+b,0).toFixed(2))),8000);
  report.timings.longTaskMaxMs=await step('phrase.longTasks.max',()=>phrasePage.evaluate(()=>Number(Math.max(0,...(window.__rebuloLongTasks||[])).toFixed(2))),8000);
  await step('phrase.resources',()=>collectResources(phrasePage,'phrase'),10000);

  const wordPage=await step('word.prepare',()=>preparePage('word'),10000);
  await step('word.delayInitResource',()=>wordPage.route('**/data/therapy-targets.json',async route=>{await new Promise(resolve=>setTimeout(resolve,750));await route.continue();}),8000);
  await step('word.goto',()=>wordPage.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000}),35000);
  await step('word.interface',()=>wordPage.waitForSelector('#createMode',{state:'visible',timeout:10000}),12000);
  await step('word.openCreate',()=>wordPage.evaluate(()=>document.querySelector('#createMode')?.click()),8000);
  await step('word.createState',()=>wordPage.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.experience==='create',null,{timeout:5000}),7000);
  await step('word.selectWord',()=>wordPage.evaluate(()=>document.querySelector('[data-creator-kind="word"]')?.click()),8000);
  await step('word.wordState',()=>wordPage.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.creatorKind==='word',null,{timeout:5000}),7000);
  await step('word.earlyFill',()=>wordPage.locator('#target').fill('merci'),8000);
  report.productChecks.createWordEarly={readyBeforeSubmit:await step('word.earlyReadySnapshot',()=>wordPage.evaluate(()=>document.querySelector('.app-shell')?.dataset.creatorListenerReady==='true'),8000)};
  const earlySubmitStart=now();
  await step('word.earlySubmit',()=>wordPage.evaluate(()=>document.querySelector('#creatorForm')?.requestSubmit()),8000);
  await step('word.earlyResult',()=>wordPage.waitForFunction(()=>!document.querySelector('#result')?.hidden&&document.querySelectorAll('#creatorRebus .piece').length>0,null,{timeout:5000}),7000);
  report.productChecks.createWordEarly={...report.productChecks.createWordEarly,...await step('word.earlySnapshot',()=>wordPage.evaluate(()=>({readyAfterResult:document.querySelector('.app-shell')?.dataset.creatorListenerReady==='true',feedback:document.querySelector('#creatorFeedback')?.textContent?.trim()||'',pieces:[...document.querySelectorAll('#creatorRebus .piece')].map(n=>n.textContent?.trim()||'').filter(Boolean)})),8000),resultVisibleMs:Number((now()-earlySubmitStart).toFixed(2))};

  await step('word.normalFill',()=>wordPage.locator('#target').fill('cinéma'),8000);
  const normalSubmitStart=now();
  await step('word.normalSubmit',()=>wordPage.evaluate(()=>document.querySelector('#creatorForm')?.requestSubmit()),8000);
  await step('word.normalResult',()=>wordPage.waitForFunction(()=>{const pieces=[...document.querySelectorAll('#creatorRebus .piece')].map(n=>n.textContent?.trim().toLowerCase()||'');return !document.querySelector('#result')?.hidden&&pieces.length>=3&&pieces.includes('scie')&&pieces.includes('nez');},null,{timeout:5000}),7000);
  report.productChecks.createWordNormal={...await step('word.normalSnapshot',()=>wordPage.evaluate(()=>({ready:document.querySelector('.app-shell')?.dataset.creatorListenerReady==='true',pieces:[...document.querySelectorAll('#creatorRebus .piece')].map(n=>n.textContent?.trim()||'').filter(Boolean)})),8000),resultVisibleMs:Number((now()-normalSubmitStart).toFixed(2))};
  await step('word.resources',()=>collectResources(wordPage,'word'),10000);
  await step('word.close',()=>wordPage.close(),8000);

  const playPage=await step('play.prepare',()=>preparePage('play'),10000);
  await step('play.goto',()=>playPage.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000}),35000);
  await step('play.interface',()=>playPage.waitForSelector('#playMode',{state:'visible',timeout:10000}),12000);
  await step('play.round',()=>playPage.waitForFunction(()=>!document.querySelector('#playArena')?.hidden&&document.querySelectorAll('#playRebus .piece').length>0,null,{timeout:15000}),18000);
  report.productChecks.play=await step('play.snapshot',()=>playPage.evaluate(()=>({pieceCount:document.querySelectorAll('#playRebus .piece').length,catalogSize:Number(document.querySelector('.app-shell')?.dataset.playCatalogSize||0),bank:document.querySelector('.app-shell')?.dataset.playBank||''})),8000);
  await step('play.resources',()=>collectResources(playPage,'play'),10000);
  await step('play.close',()=>playPage.close(),8000);

  const resourceByUrl=new Map();
  for(const row of report.resources){const previous=resourceByUrl.get(row.name);if(!previous||row.decodedBodySize>previous.decodedBodySize)resourceByUrl.set(row.name,row);}
  report.uniqueResources=[...resourceByUrl.values()].map(({page,...row})=>row);
  report.resourceTotals={transferSize:report.resources.reduce((sum,row)=>sum+Number(row.transferSize||0),0),decodedBodySizeUnique:[...resourceByUrl.values()].reduce((sum,row)=>sum+Number(row.decodedBodySize||0),0)};

  assert.equal(report.errors.length,0,report.errors.join('\n'));
  assert.equal(ranger.planner,'worker');
  assert.equal(ranger.visiblePieceCount,4);
  assert.ok(ranger.gaps.length>=1);
  assert.deepEqual(pili.pieces.map(p=>p.text),['pie','lit']);
  assert.ok(pili.pieces.every(p=>p.visible&&p.inViewport),'pili pieces must be visible in mobile viewport');
  assert.deepEqual(merciPapa.pieces.map(p=>p.text),['mer','scie','pas','pas']);
  assert.deepEqual(papa.pieces.map(p=>p.text),['pas','pas']);
  assert.equal(report.productChecks.createWordEarly.readyBeforeSubmit,false,'early Create Word test must submit before the legacy listener is ready');
  assert.equal(report.productChecks.createWordEarly.readyAfterResult,true,'early Create Word action must be replayed after initialization');
  assert.ok(report.productChecks.createWordEarly.pieces.length>0,'early Create Word submit must render pieces');
  assert.equal(report.productChecks.createWordNormal.ready,true,'normal Create Word submit must run after initialization');
  assert.ok(report.productChecks.createWordNormal.pieces.length>=3,'normal Create Word submit must render pieces');
  assert.ok(report.productChecks.play.pieceCount>0&&report.productChecks.play.catalogSize>0,'Jouer must render a round');
  assert.equal(report.productChecks.play.bank,'representation-bank');
  assert.ok(report.resources.some(r=>/rebulo-compact-runtime\.json/.test(r.name)),'compact runtime must be loaded');
  assert.equal(report.resources.some(r=>/(rebus-sound-catalog|rebus-visible-conventions|coverage-report)\.json/.test(r.name)),false,'normal browser product must not load research representation/coverage catalogs');
  assert.ok(ranger.visibleMs<1500,`cold phrase result must remain responsive under CPU x4; observed ${ranger.visibleMs} ms`);
  assert.ok(pili.visibleMs<250&&merciPapa.visibleMs<250&&papa.visibleMs<250,'warm phrase results must remain responsive under CPU x4');
  await checkpoint('complete');
  console.log(JSON.stringify(report));
  await step('phrase.close',()=>phrasePage.close(),8000);
  await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);
  process.exit(0);
}catch(error){
  report.errors.push(String(error?.stack||error));
  await checkpoint('failed');
  console.error(error);
  try{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,3000))]);}catch{}
  process.exit(1);
}
