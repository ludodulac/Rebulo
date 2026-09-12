import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

const baseUrl=process.env.BASE_URL||'https://ludodulac.github.io/Rebulo/';
const output=process.env.OUTPUT_JSON||'phrase-browser-product.json';
const requireVisible=process.env.ASSERT_VISIBLE==='1';
const cpuRate=Number(process.env.CPU_THROTTLE||4);
const width=Number(process.env.VIEWPORT_WIDTH||390);
const height=Number(process.env.VIEWPORT_HEIGHT||844);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
const page=await context.newPage();
await page.addInitScript(()=>{window.__rebuloLongTasks=[];try{new PerformanceObserver(list=>window.__rebuloLongTasks.push(...list.getEntries().map(entry=>({startTime:entry.startTime,duration:entry.duration})))).observe({type:'longtask',buffered:true});}catch{}});
const session=await context.newCDPSession(page);if(cpuRate>1)await session.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
const consoleErrors=[];const pageErrors=[];page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});page.on('pageerror',error=>pageErrors.push(String(error?.stack||error)));
const now=()=>performance.now();
const report={baseUrl,cpuRate,viewport:{width,height},cases:{},consoleErrors,pageErrors,timings:{},productChecks:{}};
const save=()=>writeFile(output,JSON.stringify(report,null,2));
const longTaskTotal=()=>page.evaluate(()=>Number((window.__rebuloLongTasks||[]).reduce((sum,item)=>sum+item.duration,0).toFixed(2)));

const navigationStarted=now();
await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:120000});
await page.locator('#playMode').waitFor({state:'visible'});
report.timings.initialInterfaceUsableMs=Number((now()-navigationStarted).toFixed(2));
await page.waitForLoadState('networkidle',{timeout:120000});
report.timings.initialNetworkIdleMs=Number((now()-navigationStarted).toFixed(2));
report.timings.initialLongTaskMs=await longTaskTotal();

const createStarted=now();await page.locator('#createMode').click();await page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.experience==='create');report.timings.openCreateMs=Number((now()-createStarted).toFixed(2));
const phraseStarted=now();await page.locator('[data-creator-kind="phrase"]').click();await page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.creatorKind==='phrase');await page.locator('#target').waitFor({state:'visible'});report.timings.openPhraseMs=Number((now()-phraseStarted).toFixed(2));
report.timings.longTaskMsThroughPhraseOpen=await longTaskTotal();

async function runPhrase(key,value,{cold=false}={}){
  const input=page.locator('#target');const fillStarted=now();await input.fill(value);const inputMs=now()-fillStarted;const started=now();
  if(requireVisible)await page.locator('#creatorForm button[type="submit"]').click();else await page.evaluate(()=>document.querySelector('#creatorForm')?.requestSubmit());
  await page.waitForFunction(expected=>{const result=document.querySelector('#result');const word=document.querySelector('#resultWord');const proof=document.querySelector('#phoneticProof');const feedback=document.querySelector('#creatorFeedback');return result&&!result.hidden&&word?.textContent===expected&&(proof?.textContent||feedback?.textContent);},value,{timeout:cold?120000:30000});
  const visibleMs=now()-started;
  const snapshot=await page.evaluate(()=>{const shell=document.querySelector('.app-shell');const rebus=document.querySelector('#creatorRebus');const rect=rebus?.getBoundingClientRect();const submit=document.querySelector('#creatorForm button[type="submit"]')?.getBoundingClientRect();const children=[...(rebus?.children||[])].map((node,index)=>{const r=node.getBoundingClientRect();return{index,className:node.className,text:node.textContent?.trim()||'',x:r.x,y:r.y,width:r.width,height:r.height,visible:Boolean(node.getClientRects().length),inViewport:r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight};});const pieces=[...document.querySelectorAll('#creatorRebus .piece')].map(node=>{const r=node.getBoundingClientRect();return{text:node.textContent?.trim()||'',image:node.querySelector('img')?.getAttribute('src')||null,symbol:node.querySelector('strong')?.textContent||null,visible:Boolean(node.getClientRects().length),inViewport:r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight,x:r.x,width:r.width};});const gaps=[...document.querySelectorAll('#creatorRebus .phrase-sound-gap,#creatorRebus .phrase-uncovered-token')].map(node=>{const r=node.getBoundingClientRect();return{text:node.textContent?.trim()||'',visible:Boolean(node.getClientRects().length),inViewport:r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight,x:r.x,width:r.width};});const topHit=submit?document.elementFromPoint(submit.x+submit.width/2,submit.y+submit.height/2):null;return{planner:shell?.dataset.phrasePlanner||'',plannerPrepareMs:Number(shell?.dataset.phrasePlannerPrepareMs||0),plannerLastMs:Number(shell?.dataset.phrasePlannerLastMs||0),proof:document.querySelector('#phoneticProof')?.textContent?.trim()||'',proofTitle:document.querySelector('#phoneticProof')?.getAttribute('title')||'',feedback:document.querySelector('#creatorFeedback')?.textContent?.trim()||'',resultHidden:document.querySelector('#result')?.hidden??true,rebusChildCount:rebus?.children.length||0,rebusText:rebus?.textContent?.trim()||'',rebusRect:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height,scrollWidth:rebus.scrollWidth,clientWidth:rebus.clientWidth,scrollLeft:rebus.scrollLeft}:null,submitTopHit:topHit?{tag:topHit.tagName,className:topHit.className,id:topHit.id,text:topHit.textContent?.trim()||''}:null,children,pieces,gaps};});
  report.cases[key]={value,inputMs:Number(inputMs.toFixed(2)),visibleMs:Number(visibleMs.toFixed(2)),...snapshot};await page.screenshot({path:`phrase-browser-${key}.png`,fullPage:true});await save();return report.cases[key];
}

const ranger=await runPhrase('ranger','ranger la maison',{cold:true});report.timings.firstInputMs=ranger.inputMs;report.timings.firstResultVisibleMs=ranger.visibleMs;report.timings.longTaskMsThroughFirstResult=await longTaskTotal();
const pili=await runPhrase('pili','pili');const merciPapa=await runPhrase('merciPapa','merci papa');const simple=await runPhrase('papa','papa');report.timings.warmResultVisibleMs={pili:pili.visibleMs,merciPapa:merciPapa.visibleMs,papa:simple.visibleMs};

if(requireVisible){
  await page.evaluate(()=>document.querySelector('[data-creator-kind="word"]')?.click());await page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.creatorKind==='word',null,{timeout:5000});await page.locator('#target').fill('merci');await page.evaluate(()=>document.querySelector('#creatorForm')?.requestSubmit());await page.waitForFunction(()=>!document.querySelector('#result')?.hidden&&document.querySelectorAll('#creatorRebus .piece').length>0,null,{timeout:5000});report.productChecks.createWord=await page.evaluate(()=>({result:document.querySelector('#resultWord')?.textContent?.trim()||'',pieces:[...document.querySelectorAll('#creatorRebus .piece')].map(node=>node.textContent?.trim()||'').filter(Boolean)}));await save();
  await page.evaluate(()=>document.querySelector('#playMode')?.click());await page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.experience==='play'&&!document.querySelector('#playArena')?.hidden,null,{timeout:5000});await page.waitForFunction(()=>document.querySelectorAll('#playRebus .piece').length>0,null,{timeout:5000});report.productChecks.play=await page.evaluate(()=>({pieceCount:document.querySelectorAll('#playRebus .piece').length,catalogSize:Number(document.querySelector('.app-shell')?.dataset.playCatalogSize||0),bank:document.querySelector('.app-shell')?.dataset.playBank||''}));
}

report.resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(item=>/data\/(rebulo-compact-runtime|rebus-pronunciation-lexicon|rebus-sound-catalog|rebus-visible-conventions)\.json/.test(item.name)).map(item=>({name:item.name,duration:Number(item.duration.toFixed(2)),transferSize:item.transferSize,decodedBodySize:item.decodedBodySize})));
report.resourceTotals={transferSize:report.resources.reduce((sum,item)=>sum+item.transferSize,0),decodedBodySize:report.resources.reduce((sum,item)=>sum+item.decodedBodySize,0)};
report.longTasks=await page.evaluate(()=>({count:(window.__rebuloLongTasks||[]).length,totalMs:Number((window.__rebuloLongTasks||[]).reduce((sum,item)=>sum+item.duration,0).toFixed(2)),maxMs:Number(Math.max(0,...(window.__rebuloLongTasks||[]).map(item=>item.duration)).toFixed(2))}));
console.log(JSON.stringify(report));

if(requireVisible){
  assert.equal(pageErrors.length,0,`Browser page errors: ${pageErrors.join('\n')}`);assert.equal(ranger.submitTopHit?.tag,'BUTTON','phrase result must not overlap the Create button');assert.deepEqual(pili.pieces.map(piece=>piece.text),['pie','lit'],'Phrase mode must visibly render pili as pie + lit');assert.ok(pili.pieces.every(piece=>piece.visible&&piece.inViewport),'Both pili pieces must be visible in the mobile viewport');assert.deepEqual(merciPapa.pieces.map(piece=>piece.text),['mer','scie','pas','pas'],'merci papa must use the continuous phrase route in the rendered DOM');assert.deepEqual(simple.pieces.map(piece=>piece.text),['pas','pas'],'papa must visibly render pas + pas');assert.equal(ranger.rebusChildCount,5,'ranger la maison must render its gap plus four known representations');assert.ok(ranger.pieces.filter(piece=>piece.visible&&piece.inViewport).length>=2,'ranger la maison must show actual rebus pieces in the first mobile viewport');assert.equal(ranger.planner,'worker','continuous phrase planning must run off the browser main thread when Worker is available');assert.ok(ranger.visibleMs<1500,`cold phrase result should stay responsive under 4x CPU throttling; observed ${ranger.visibleMs} ms`);assert.ok(pili.visibleMs<250&&merciPapa.visibleMs<250&&simple.visibleMs<250,'warm phrase submissions must render promptly under 4x CPU throttling');assert.ok(report.productChecks.createWord.pieces.length>0,'Create Word must still render real pieces');assert.ok(report.productChecks.play.pieceCount>0&&report.productChecks.play.catalogSize>0,'Jouer must still render a real round');assert.equal(report.productChecks.play.bank,'representation-bank');assert.equal(report.resources.some(item=>/rebus-sound-catalog|rebus-visible-conventions/.test(item.name)),false,'normal browser product must not fetch research representation catalogs');assert.ok(report.resources.some(item=>/rebulo-compact-runtime/.test(item.name)),'browser must consume the generated compact runtime projection');
}
await save();await browser.close();
