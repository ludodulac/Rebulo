import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const output=process.env.OUTPUT_JSON||'word-lifecycle-trace.json';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
const page=await context.newPage();
const session=await context.newCDPSession(page);await session.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.CPU_THROTTLE||4)});
await page.addInitScript(()=>{
  window.__rebuloWordLifecycle=[];
  const push=(stage,extra={})=>window.__rebuloWordLifecycle.push({stage,t:performance.now(),value:document.querySelector('#target')?.value||'',ready:document.querySelector('.app-shell')?.dataset.creatorListenerReady||'',creatorKind:document.querySelector('.app-shell')?.dataset.creatorKind||'',resultHidden:document.querySelector('#result')?.hidden??null,resultWord:document.querySelector('#resultWord')?.textContent?.trim()||'',pieceCount:document.querySelectorAll('#creatorRebus .piece').length,feedback:document.querySelector('#creatorFeedback')?.textContent?.trim()||'',...extra});
  const originalAdd=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(type,listener,options){
    if(type==='submit'&&this?.id==='creatorForm'&&typeof listener==='function'){
      const capture=typeof options==='boolean'?options:Boolean(options?.capture);
      push('listener.register',{capture});
      const wrapped=function(event){push('listener.enter',{capture,defaultPrevented:event.defaultPrevented});try{return listener.call(this,event);}finally{push('listener.exit',{capture,defaultPrevented:event.defaultPrevented});}};
      return originalAdd.call(this,type,wrapped,options);
    }
    return originalAdd.call(this,type,listener,options);
  };
  const originalRequest=HTMLFormElement.prototype.requestSubmit;
  HTMLFormElement.prototype.requestSubmit=function(...args){if(this?.id==='creatorForm')push('requestSubmit');return originalRequest.apply(this,args);};
  document.addEventListener('DOMContentLoaded',()=>{
    const rebus=document.querySelector('#creatorRebus');
    if(rebus)new MutationObserver(()=>push('rebus.mutation')).observe(rebus,{childList:true,subtree:true,characterData:true});
    const resultWord=document.querySelector('#resultWord');
    if(resultWord)new MutationObserver(()=>push('resultWord.mutation')).observe(resultWord,{childList:true,subtree:true,characterData:true});
  },{once:true});
});
await page.route('**/data/therapy-targets.json',async route=>{await new Promise(resolve=>setTimeout(resolve,750));await route.continue();});
await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForSelector('#createMode',{state:'visible',timeout:10000});
await page.evaluate(()=>document.querySelector('#createMode')?.click());
await page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.experience==='create',null,{timeout:5000});
await page.evaluate(()=>document.querySelector('[data-creator-kind="word"]')?.click());
await page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.creatorKind==='word',null,{timeout:5000});
await page.locator('#target').fill('merci');
const before=await page.evaluate(()=>({ready:document.querySelector('.app-shell')?.dataset.creatorListenerReady||'',value:document.querySelector('#target')?.value||'',trace:window.__rebuloWordLifecycle}));
await page.evaluate(()=>document.querySelector('#creatorForm')?.requestSubmit());
await page.waitForTimeout(2500);
const after=await page.evaluate(()=>({ready:document.querySelector('.app-shell')?.dataset.creatorListenerReady||'',value:document.querySelector('#target')?.value||'',resultHidden:document.querySelector('#result')?.hidden??null,resultWord:document.querySelector('#resultWord')?.textContent?.trim()||'',pieces:[...document.querySelectorAll('#creatorRebus .piece')].map(n=>n.textContent?.trim()||'').filter(Boolean),feedback:document.querySelector('#creatorFeedback')?.textContent?.trim()||'',trace:window.__rebuloWordLifecycle}));
const report={before,after};
await writeFile(output,JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
await browser.close();
