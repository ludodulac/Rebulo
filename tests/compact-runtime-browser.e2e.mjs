import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const output=process.env.OUTPUT_JSON||'compact-runtime-browser.json';
const cpuRate=Number(process.env.CPU_THROTTLE||4);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
const now=()=>performance.now();
const report={baseUrl,cpuRate,timings:{},cases:{},productChecks:{},resources:[],errors:[]};

async function preparePage(){
  const page=await context.newPage();
  page.on('pageerror',error=>report.errors.push(String(error?.stack||error)));
  const session=await context.newCDPSession(page);if(cpuRate>1)await session.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
  await page.addInitScript(()=>{window.__rebuloLongTasks=[];try{new PerformanceObserver(list=>window.__rebuloLongTasks.push(...list.getEntries().map(entry=>entry.duration))).observe({type:'longtask',buffered:true});}catch{}});
  return page;
}

const page=await preparePage();
const navigationStart=now();
await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#playMode',{state:'visible',timeout:15000});
report.timings.initialInterfaceUsableMs=Number((now()-navigationStart).toFixed(2));
const createStart=now();
await page.evaluate(()=>document.querySelector('#createMode')?.click());
await page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.experience==='create',null,{timeout:5000});
report.timings.openCreateMs=Number((now()-createStart).toFixed(2));
const phraseStart=now();
await page.evaluate(()=>document.querySelector('[data-creator-kind="phrase"]')?.click());
await page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.creatorKind==='phrase',null,{timeout:5000});
report.timings.openPhraseMs=Number((now()-phraseStart).toFixed(2));

async function phraseCase(key,value){
  await page.evaluate(value=>{const input=document.querySelector('#target');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},value);
  const started=now();
  await page.evaluate(()=>document.querySelector('#creatorForm')?.requestSubmit());
  await page.waitForFunction(value=>!document.querySelector('#result')?.hidden&&document.querySelector('#resultWord')?.textContent===value,value,{timeout:15000});
  const visibleMs=Number((now()-started).toFixed(2));
  const data=await page.evaluate(()=>({
    planner:document.querySelector('.app-shell')?.dataset.phrasePlanner||'',
    prepareMs:Number(document.querySelector('.app-shell')?.dataset.phrasePlannerPrepareMs||0),
    plannerMs:Number(document.querySelector('.app-shell')?.dataset.phrasePlannerLastMs||0),
    proof:document.querySelector('#phoneticProof')?.textContent?.trim()||'',
    proofTitle:document.querySelector('#phoneticProof')?.title||'',
    pieces:[...document.querySelectorAll('#creatorRebus .piece')].map(node=>({text:node.textContent?.trim()||'',visible:Boolean(node.getClientRects().length)})),
    gaps:[...document.querySelectorAll('#creatorRebus .phrase-sound-gap')].map(node=>node.textContent?.trim()||''),
    visiblePieceCount:[...document.querySelectorAll('#creatorRebus .piece')].filter(node=>node.getClientRects().length).length
  }));
  report.cases[key]={value,visibleMs,...data};
  return report.cases[key];
}

const ranger=await phraseCase('ranger','ranger la maison');report.timings.firstResultVisibleMs=ranger.visibleMs;
const pili=await phraseCase('pili','pili');
const merciPapa=await phraseCase('merciPapa','merci papa');
const papa=await phraseCase('papa','papa');
report.timings.subsequentResultMs={pili:pili.visibleMs,merciPapa:merciPapa.visibleMs,papa:papa.visibleMs};
report.timings.longTaskTotalMs=await page.evaluate(()=>Number((window.__rebuloLongTasks||[]).reduce((a,b)=>a+b,0).toFixed(2)));
report.timings.longTaskMaxMs=await page.evaluate(()=>Number(Math.max(0,...(window.__rebuloLongTasks||[])).toFixed(2)));
report.resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/data\/(rebulo-compact-runtime|rebus-pronunciation-lexicon|rebus-sound-catalog|rebus-visible-conventions)\.json/.test(r.name)).map(r=>({name:r.name,transferSize:r.transferSize,decodedBodySize:r.decodedBodySize,duration:Number(r.duration.toFixed(2))})));
report.resourceTotals={transferSize:report.resources.reduce((s,r)=>s+r.transferSize,0),decodedBodySize:report.resources.reduce((s,r)=>s+r.decodedBodySize,0)};

const wordPage=await preparePage();
await wordPage.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:60000});
await wordPage.waitForSelector('#createMode',{state:'visible',timeout:15000});
await wordPage.evaluate(()=>{document.querySelector('#createMode')?.click();document.querySelector('[data-creator-kind="word"]')?.click();});
await wordPage.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.experience==='create'&&document.querySelector('.app-shell')?.dataset.creatorKind==='word',null,{timeout:5000});
await wordPage.evaluate(()=>{const input=document.querySelector('#target');input.value='merci';input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#creatorForm')?.requestSubmit();});
await wordPage.waitForFunction(()=>document.querySelectorAll('#creatorRebus .piece').length>0,null,{timeout:15000});
report.productChecks.createWord=await wordPage.evaluate(()=>({result:document.querySelector('#resultWord')?.textContent?.trim()||'',pieces:[...document.querySelectorAll('#creatorRebus .piece')].map(n=>n.textContent?.trim()||'').filter(Boolean)}));
await wordPage.close();

const playPage=await preparePage();
await playPage.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:60000});
await playPage.waitForSelector('#playMode',{state:'visible',timeout:15000});
await playPage.evaluate(()=>document.querySelector('#playMode')?.click());
await playPage.waitForFunction(()=>!document.querySelector('#playArena')?.hidden&&document.querySelectorAll('#playRebus .piece').length>0,null,{timeout:15000});
report.productChecks.play=await playPage.evaluate(()=>({pieceCount:document.querySelectorAll('#playRebus .piece').length,catalogSize:Number(document.querySelector('.app-shell')?.dataset.playCatalogSize||0),bank:document.querySelector('.app-shell')?.dataset.playBank||''}));
await playPage.close();

assert.equal(report.errors.length,0,report.errors.join('\n'));
assert.equal(ranger.planner,'worker');
assert.equal(ranger.visiblePieceCount,4);
assert.ok(ranger.gaps.length>=1);
assert.deepEqual(pili.pieces.map(p=>p.text),['pie','lit']);
assert.deepEqual(merciPapa.pieces.map(p=>p.text),['mer','scie','pas','pas']);
assert.deepEqual(papa.pieces.map(p=>p.text),['pas','pas']);
assert.ok(report.productChecks.createWord.pieces.length>0,'Create Word must render pieces');
assert.ok(report.productChecks.play.pieceCount>0&&report.productChecks.play.catalogSize>0,'Jouer must render a round');
assert.equal(report.productChecks.play.bank,'representation-bank');
assert.ok(report.resources.some(r=>/rebulo-compact-runtime/.test(r.name)),'compact runtime must be loaded');
assert.equal(report.resources.some(r=>/rebus-sound-catalog|rebus-visible-conventions/.test(r.name)),false,'research representation catalogs must not be loaded');
assert.ok(ranger.visibleMs<1500,'cold phrase result must remain responsive under CPU x4');
assert.ok(pili.visibleMs<250&&merciPapa.visibleMs<250&&papa.visibleMs<250,'warm phrase results must remain responsive under CPU x4');

await writeFile(output,JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
await page.close();
await browser.close();
process.exit(0);
