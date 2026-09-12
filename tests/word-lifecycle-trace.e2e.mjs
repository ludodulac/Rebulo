import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const output=process.env.OUTPUT_JSON||'word-lifecycle-trace.json';
const cpuRate=Number(process.env.CPU_THROTTLE||4);
const report={phase:'start',baseUrl,cpuRate,marks:[],debuggerSamples:[],network:[],noSubmit:{}};
async function save(){await writeFile(output,JSON.stringify(report,null,2));}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function step(label,fn,timeoutMs=10000){report.phase=`before:${label}`;await save();console.log(`[word-profile] ${report.phase}`);let timer;try{const value=await Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`PROFILE_TIMEOUT ${label} after ${timeoutMs} ms`)),timeoutMs);})]);report.phase=`after:${label}`;await save();console.log(`[word-profile] ${report.phase}`);return value;}finally{clearTimeout(timer);}}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
const page=await context.newPage();
try{
  const session=await context.newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
  await session.send('Debugger.enable');
  await session.send('Network.enable');
  const networkById=new Map();
  session.on('Network.responseReceived',event=>{const url=event.response?.url||'';if(!url.includes('/data/'))return;networkById.set(event.requestId,{url,status:event.response.status,mimeType:event.response.mimeType,encodedDataLength:event.response.encodedDataLength||0,responseTs:event.timestamp});});
  session.on('Network.loadingFinished',event=>{const item=networkById.get(event.requestId);if(!item)return;item.encodedDataLength=event.encodedDataLength||item.encodedDataLength;item.finishedTs=event.timestamp;report.network.push(item);networkById.delete(event.requestId);});
  await page.addInitScript(()=>{
    window.__rebuloProfileMarks=[];
    window.__rebuloMark=(name,extra={})=>window.__rebuloProfileMarks.push({name,t:performance.now(),...extra});
    try{new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__rebuloProfileMarks.push({name:'longtask',t:entry.startTime,duration:entry.duration,end:entry.startTime+entry.duration});}).observe({type:'longtask',buffered:true});}catch{}
    document.addEventListener('input',event=>{if(event.target?.id==='target')window.__rebuloMark('target.input',{value:event.target.value});},true);
    const timer=setInterval(()=>{if(document.querySelector('.app-shell')?.dataset.creatorListenerReady==='true'){window.__rebuloMark('readiness.observed',{value:document.querySelector('#target')?.value||''});clearInterval(timer);}},10);
    window.__rebuloMark('init-script-installed');
  });
  await step('routeDelay',()=>page.route('**/data/therapy-targets.json',async route=>{await delay(750);await route.continue();}),3000);
  await step('goto',()=>page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:15000}),18000);
  await step('interface',()=>page.waitForSelector('#createMode',{state:'visible',timeout:7000}),9000);
  await step('openCreate',()=>page.evaluate(()=>{window.__rebuloMark?.('create.open.request');document.querySelector('#createMode')?.click();window.__rebuloMark?.('create.open.return');}),4000);
  await step('createState',()=>page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.experience==='create',null,{timeout:4000}),6000);
  await step('selectWord',()=>page.evaluate(()=>{window.__rebuloMark?.('word.select.request');document.querySelector('[data-creator-kind="word"]')?.click();window.__rebuloMark?.('word.select.return');}),4000);
  await step('wordState',()=>page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.creatorKind==='word',null,{timeout:4000}),6000);
  await step('fillMerci',()=>page.locator('#target').fill('merci'),4000);
  const fillWallMs=Date.now();
  report.marks=await step('marksAfterFill',()=>page.evaluate(()=>window.__rebuloProfileMarks||[]),4000);

  async function interruptSample(label,waitMs){
    await delay(waitMs);
    const sample={label,requestedAtWallMs:Date.now()};
    let pausedResolve;
    const pausedPromise=new Promise(resolve=>{pausedResolve=resolve;});
    const onPaused=event=>pausedResolve(event);
    session.once('Debugger.paused',onPaused);
    try{
      const pauseSend=session.send('Debugger.pause');
      const paused=await Promise.race([pausedPromise,delay(5000).then(()=>null)]);
      if(!paused){sample.error='Debugger.paused timeout';report.debuggerSamples.push(sample);await save();return;}
      sample.reason=paused.reason;
      sample.callFrames=(paused.callFrames||[]).slice(0,20).map(frame=>({functionName:frame.functionName||'(anonymous)',url:frame.url||'',lineNumber:Number(frame.location?.lineNumber||0)+1,columnNumber:Number(frame.location?.columnNumber||0)+1}));
      sample.hitAtWallMs=Date.now();
      report.debuggerSamples.push(sample);await save();console.log(`[word-profile] ${label} ${sample.callFrames.slice(0,6).map(f=>`${f.functionName}@${f.url.split('/').pop()}:${f.lineNumber}`).join(' <- ')}`);
      await session.send('Debugger.resume');
      await Promise.race([pauseSend,delay(1000)]).catch(()=>{});
    }catch(error){sample.error=String(error);report.debuggerSamples.push(sample);await save();}
  }

  await interruptSample('blocked+250ms',250);
  await interruptSample('blocked+750ms',500);
  await step('readinessWithoutSubmit',()=>page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.creatorListenerReady==='true',null,{timeout:5000}),6000);
  report.noSubmit.readinessWallMs=Date.now()-fillWallMs;
  const domReadStart=Date.now();
  report.noSubmit.snapshot=await step('domReadWithoutSubmit',()=>page.evaluate(()=>({ready:document.querySelector('.app-shell')?.dataset.creatorListenerReady||'',value:document.querySelector('#target')?.value||'',resultHidden:document.querySelector('#result')?.hidden??null,pieces:document.querySelectorAll('#creatorRebus .piece').length,marks:window.__rebuloProfileMarks||[]})),1000);
  report.noSubmit.domReadWallMs=Date.now()-domReadStart;
  if(report.noSubmit.snapshot.ready!=='true'||report.noSubmit.snapshot.value!=='merci'||report.noSubmit.snapshot.resultHidden!==true||report.noSubmit.snapshot.pieces!==0)throw new Error(`Unexpected no-submit state: ${JSON.stringify(report.noSubmit)}`);
  report.phase='sampled';await save();console.log(JSON.stringify(report));
}catch(error){report.error=String(error?.stack||error);report.phase='failed';await save();console.error(error);}finally{try{await Promise.race([browser.close(),delay(3000)]);}catch{}process.exit(report.phase==='sampled'?0:1);}
