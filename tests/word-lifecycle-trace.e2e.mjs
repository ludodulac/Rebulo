import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const output=process.env.OUTPUT_JSON||'word-lifecycle-trace.json';
const cpuRate=Number(process.env.CPU_THROTTLE||4);
const report={phase:'start',baseUrl,cpuRate,snapshots:{},cpu:{},browser:{}};
async function save(){await writeFile(output,JSON.stringify(report,null,2));}
async function step(label,fn,timeoutMs=10000){
  report.phase=`before:${label}`;await save();console.log(`[word-profile] ${report.phase}`);
  let timer;
  try{
    const value=await Promise.race([
      Promise.resolve().then(fn),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`PROFILE_TIMEOUT ${label} after ${timeoutMs} ms`)),timeoutMs);})
    ]);
    report.phase=`after:${label}`;await save();console.log(`[word-profile] ${report.phase}`);return value;
  }finally{clearTimeout(timer);}
}

function summarizeCpu(profile={}){
  const nodes=new Map((profile.nodes||[]).map(node=>[node.id,node]));
  const parents=new Map();
  for(const node of profile.nodes||[])for(const child of node.children||[])parents.set(child,node.id);
  const selfUs=new Map();
  const samples=profile.samples||[];
  const deltas=profile.timeDeltas||[];
  for(let i=0;i<samples.length;i++)selfUs.set(samples[i],(selfUs.get(samples[i])||0)+Number(deltas[i]||0));
  const frameFor=id=>nodes.get(id)?.callFrame||{};
  const rows=[...selfUs.entries()].map(([id,us])=>{
    const frame=frameFor(id);
    const stack=[];let current=id;let depth=0;
    while(current&&depth<12){const f=frameFor(current);if(f.functionName||f.url)stack.unshift(`${f.functionName||'(anonymous)'}@${String(f.url||'').replace(baseUrl,'/')}:${Number(f.lineNumber||0)+1}`);current=parents.get(current);depth++;}
    return {selfMs:Number((us/1000).toFixed(2)),samples:samples.filter(sample=>sample===id).length,functionName:frame.functionName||'(anonymous)',url:frame.url||'',lineNumber:Number(frame.lineNumber||0)+1,columnNumber:Number(frame.columnNumber||0)+1,stack};
  }).filter(row=>!['(idle)','(program)','(root)'].includes(row.functionName)&&row.selfMs>0.5).sort((a,b)=>b.selfMs-a.selfMs);
  return {sampleCount:samples.length,sampledMs:Number((deltas.reduce((sum,n)=>sum+Number(n||0),0)/1000).toFixed(2)),topSelf:rows.slice(0,30)};
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
const page=await context.newPage();
try{
  const session=await context.newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
  await page.addInitScript(()=>{
    const perf=window.__rebuloWordProfile={marks:[],longTasks:[],fetches:[],responseJson:[],jsonParse:[],inputEvents:[],mutationCallbacks:[],listenerRegistrations:[]};
    perf.mark=(name,extra={})=>perf.marks.push({name,t:performance.now(),...extra});
    const nativeFetch=window.fetch.bind(window);
    window.fetch=async function profiledFetch(input,init){
      const url=typeof input==='string'?input:input?.url||'';const start=performance.now();
      try{const response=await nativeFetch(input,init);perf.fetches.push({url,start,end:performance.now(),duration:performance.now()-start,status:response.status,ok:response.ok});return response;}
      catch(error){perf.fetches.push({url,start,end:performance.now(),duration:performance.now()-start,error:String(error)});throw error;}
    };
    const nativeResponseJson=Response.prototype.json;
    Response.prototype.json=async function(...args){const url=this.url||'';const start=performance.now();try{const value=await nativeResponseJson.apply(this,args);perf.responseJson.push({url,start,end:performance.now(),duration:performance.now()-start});return value;}catch(error){perf.responseJson.push({url,start,end:performance.now(),duration:performance.now()-start,error:String(error)});throw error;}};
    const nativeJsonParse=JSON.parse;
    JSON.parse=function(...args){const start=performance.now();try{return nativeJsonParse.apply(this,args);}finally{const duration=performance.now()-start;if(duration>=0.5)perf.jsonParse.push({start,end:performance.now(),duration,length:typeof args[0]==='string'?args[0].length:null});}};
    const NativeMutationObserver=window.MutationObserver;
    window.MutationObserver=class ProfiledMutationObserver extends NativeMutationObserver{
      constructor(callback){super((records,observer)=>{const start=performance.now();try{return callback(records,observer);}finally{const duration=performance.now()-start;perf.mutationCallbacks.push({start,end:performance.now(),duration,records:records.length});}});}
    };
    const nativeAdd=EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener=function(type,listener,options){
      if((type==='input'||type==='change')&&typeof listener==='function'){
        const target=this?.id||this?.className||this?.tagName||'unknown';perf.listenerRegistrations.push({type,target:String(target),t:performance.now()});
        const wrapped=function(event){const start=performance.now();try{return listener.call(this,event);}finally{perf.inputEvents.push({type,target:event.target?.id||event.target?.tagName||'unknown',start,end:performance.now(),duration:performance.now()-start,value:event.target?.value||''});}};
        return nativeAdd.call(this,type,wrapped,options);
      }
      return nativeAdd.call(this,type,listener,options);
    };
    try{new PerformanceObserver(list=>{for(const entry of list.getEntries())perf.longTasks.push({name:entry.name,start:entry.startTime,duration:entry.duration,end:entry.startTime+entry.duration});}).observe({type:'longtask',buffered:true});}catch{}
    document.addEventListener('input',event=>{if(event.target?.id==='target')perf.mark('target.input.capture',{value:event.target.value});},true);
    const timer=setInterval(()=>{const shell=document.querySelector('.app-shell');if(shell?.dataset.creatorListenerReady==='true'){perf.mark('readiness.observed',{value:document.querySelector('#target')?.value||''});clearInterval(timer);}},10);
    perf.mark('init-script-installed');
  });
  await step('routeDelay',()=>page.route('**/data/therapy-targets.json',async route=>{await new Promise(resolve=>setTimeout(resolve,750));await route.continue();}),3000);
  await step('goto',()=>page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:15000}),18000);
  await step('interface',()=>page.waitForSelector('#createMode',{state:'visible',timeout:7000}),9000);
  await step('profilerStart',async()=>{await session.send('Profiler.enable');await session.send('Profiler.setSamplingInterval',{interval:500});await session.send('Profiler.start');},4000);
  await step('openCreate',()=>page.evaluate(()=>{window.__rebuloWordProfile?.mark('create.open.request');document.querySelector('#createMode')?.click();window.__rebuloWordProfile?.mark('create.open.return');}),4000);
  await step('createState',()=>page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.experience==='create',null,{timeout:4000}),6000);
  await step('selectWord',()=>page.evaluate(()=>{window.__rebuloWordProfile?.mark('word.select.request');document.querySelector('[data-creator-kind="word"]')?.click();window.__rebuloWordProfile?.mark('word.select.return');}),4000);
  await step('wordState',()=>page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.creatorKind==='word',null,{timeout:4000}),6000);
  await step('fillMerci',()=>page.locator('#target').fill('merci'),4000);
  report.snapshots.afterFill=await step('snapshotAfterFill',()=>page.evaluate(()=>{window.__rebuloWordProfile?.mark('after.fill.snapshot');return {ready:document.querySelector('.app-shell')?.dataset.creatorListenerReady||'',value:document.querySelector('#target')?.value||'',now:performance.now()};}),4000);
  report.phase='profiling-wall-clock';await save();console.log('[word-profile] wall-clock profiling window 20s');
  await new Promise(resolve=>setTimeout(resolve,20000));
  const stopped=await step('profilerStop',()=>session.send('Profiler.stop'),30000);
  report.cpu=summarizeCpu(stopped?.profile||{});
  report.browser=await step('collectBrowserProfile',()=>page.evaluate(()=>{
    const perf=window.__rebuloWordProfile||{};
    const resources=performance.getEntriesByType('resource').map(entry=>({name:entry.name,startTime:entry.startTime,duration:entry.duration,responseEnd:entry.responseEnd,transferSize:entry.transferSize,encodedBodySize:entry.encodedBodySize,decodedBodySize:entry.decodedBodySize}));
    return {now:performance.now(),ready:document.querySelector('.app-shell')?.dataset.creatorListenerReady||'',value:document.querySelector('#target')?.value||'',resultHidden:document.querySelector('#result')?.hidden??null,resultWord:document.querySelector('#resultWord')?.textContent?.trim()||'',pieceCount:document.querySelectorAll('#creatorRebus .piece').length,feedback:document.querySelector('#creatorFeedback')?.textContent?.trim()||'',profile:perf,resources};
  }),15000);
  report.phase='complete';await save();console.log(JSON.stringify(report));
}catch(error){report.error=String(error?.stack||error);report.phase='failed';await save();console.error(error);}finally{try{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);}catch{}process.exit(report.phase==='complete'?0:1);}
