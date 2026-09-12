import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const output=process.env.OUTPUT_JSON||'word-lifecycle-trace.json';
const report={phase:'start',snapshots:{}};
async function save(){await writeFile(output,JSON.stringify(report,null,2));}
async function step(label,fn,timeoutMs=8000){report.phase=`before:${label}`;await save();console.log(`[word-trace] ${report.phase}`);let timer;try{const value=await Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`TRACE_TIMEOUT ${label} after ${timeoutMs} ms`)),timeoutMs);})]);report.phase=`after:${label}`;await save();console.log(`[word-trace] ${report.phase}`);return value;}finally{clearTimeout(timer);}}
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
const page=await context.newPage();
try{
  const session=await context.newCDPSession(page);await session.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.CPU_THROTTLE||4)});
  await step('route',()=>page.route('**/data/therapy-targets.json',async route=>{await new Promise(resolve=>setTimeout(resolve,750));await route.continue();}),3000);
  await step('goto',()=>page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:12000}),15000);
  await step('interface',()=>page.waitForSelector('#createMode',{state:'visible',timeout:6000}),8000);
  await step('openCreate',()=>page.evaluate(()=>document.querySelector('#createMode')?.click()),3000);
  await step('createState',()=>page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.experience==='create',null,{timeout:3000}),5000);
  await step('selectWord',()=>page.evaluate(()=>document.querySelector('[data-creator-kind="word"]')?.click()),3000);
  await step('wordState',()=>page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.creatorKind==='word',null,{timeout:3000}),5000);
  await step('fillWithoutSubmit',()=>page.locator('#target').fill('merci'),3000);
  report.snapshots.before=await step('snapshotBefore',()=>page.evaluate(()=>({ready:document.querySelector('.app-shell')?.dataset.creatorListenerReady||'',value:document.querySelector('#target')?.value||'',resultHidden:document.querySelector('#result')?.hidden??null,resultWord:document.querySelector('#resultWord')?.textContent?.trim()||'',pieces:document.querySelectorAll('#creatorRebus .piece').length,feedback:document.querySelector('#creatorFeedback')?.textContent?.trim()||''})),3000);
  await step('waitForInitWithoutSubmit',()=>page.waitForTimeout(2500),4000);
  report.snapshots.afterNoSubmit=await step('snapshotAfterNoSubmit',()=>page.evaluate(()=>({ready:document.querySelector('.app-shell')?.dataset.creatorListenerReady||'',value:document.querySelector('#target')?.value||'',resultHidden:document.querySelector('#result')?.hidden??null,resultWord:document.querySelector('#resultWord')?.textContent?.trim()||'',pieces:[...document.querySelectorAll('#creatorRebus .piece')].map(n=>n.textContent?.trim()||'').filter(Boolean),feedback:document.querySelector('#creatorFeedback')?.textContent?.trim()||''})),3000);
  report.phase='complete';await save();console.log(JSON.stringify(report));
}catch(error){report.error=String(error?.stack||error);report.phase='failed';await save();console.error(error);}finally{try{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,3000))]);}catch{}process.exit(report.phase==='complete'?0:1);}
