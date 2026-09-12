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
const session=await context.newCDPSession(page);
if(cpuRate>1)await session.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
const consoleErrors=[];
const pageErrors=[];
page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
page.on('pageerror',error=>pageErrors.push(String(error?.stack||error)));
const now=()=>performance.now();
const report={baseUrl,cpuRate,viewport:{width,height},cases:{},consoleErrors,pageErrors};
const save=()=>writeFile(output,JSON.stringify(report,null,2));

const navigationStarted=now();
await page.goto(baseUrl,{waitUntil:'networkidle',timeout:120000});
report.navigationMs=Number((now()-navigationStarted).toFixed(2));
const phraseOpenStarted=now();
await page.locator('#createMode').click();
await page.locator('[data-creator-kind="phrase"]').click();
await page.locator('#target').waitFor({state:'visible'});
report.phraseModeOpenMs=Number((now()-phraseOpenStarted).toFixed(2));

async function runPhrase(key,value,{cold=false}={}){
  const input=page.locator('#target');
  await input.fill(value);
  const started=now();
  if(requireVisible)await page.locator('#creatorForm button[type="submit"]').click();
  else await input.press('Enter');
  await page.waitForFunction(expected=>{
    const result=document.querySelector('#result');
    const word=document.querySelector('#resultWord');
    const proof=document.querySelector('#phoneticProof');
    const feedback=document.querySelector('#creatorFeedback');
    return result&&!result.hidden&&word?.textContent===expected&&(proof?.textContent||feedback?.textContent);
  },value,{timeout:cold?120000:30000});
  const visibleMs=now()-started;
  const snapshot=await page.evaluate(()=>{
    const shell=document.querySelector('.app-shell');
    const rebus=document.querySelector('#creatorRebus');
    const rect=rebus?.getBoundingClientRect();
    const submit=document.querySelector('#creatorForm button[type="submit"]')?.getBoundingClientRect();
    const children=[...(rebus?.children||[])].map((node,index)=>{const r=node.getBoundingClientRect();return{index,className:node.className,text:node.textContent?.trim()||'',x:r.x,y:r.y,width:r.width,height:r.height,visible:Boolean(node.getClientRects().length),inViewport:r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight};});
    const pieces=[...document.querySelectorAll('#creatorRebus .piece')].map(node=>{const r=node.getBoundingClientRect();return{text:node.textContent?.trim()||'',image:node.querySelector('img')?.getAttribute('src')||null,symbol:node.querySelector('strong')?.textContent||null,visible:Boolean(node.getClientRects().length),inViewport:r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight,x:r.x,width:r.width};});
    const gaps=[...document.querySelectorAll('#creatorRebus .phrase-sound-gap,#creatorRebus .phrase-uncovered-token')].map(node=>{const r=node.getBoundingClientRect();return{text:node.textContent?.trim()||'',visible:Boolean(node.getClientRects().length),inViewport:r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight,x:r.x,width:r.width};});
    const topHit=submit?document.elementFromPoint(submit.x+submit.width/2,submit.y+submit.height/2):null;
    return {
      planner:shell?.dataset.phrasePlanner||'',
      plannerPrepareMs:Number(shell?.dataset.phrasePlannerPrepareMs||0),
      plannerLastMs:Number(shell?.dataset.phrasePlannerLastMs||0),
      badge:document.querySelector('.strict-badge')?.textContent?.trim()||'',
      proof:document.querySelector('#phoneticProof')?.textContent?.trim()||'',
      proofTitle:document.querySelector('#phoneticProof')?.getAttribute('title')||'',
      feedback:document.querySelector('#creatorFeedback')?.textContent?.trim()||'',
      resultHidden:document.querySelector('#result')?.hidden??true,
      rebusChildCount:rebus?.children.length||0,
      rebusText:rebus?.textContent?.trim()||'',
      rebusRect:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height,scrollWidth:rebus.scrollWidth,clientWidth:rebus.clientWidth,scrollLeft:rebus.scrollLeft}:null,
      submitRect:submit?{x:submit.x,y:submit.y,width:submit.width,height:submit.height}:null,
      submitTopHit:topHit?{tag:topHit.tagName,className:topHit.className,id:topHit.id,text:topHit.textContent?.trim()||''}:null,
      children,pieces,gaps
    };
  });
  report.cases[key]={value,visibleMs:Number(visibleMs.toFixed(2)),...snapshot};
  report.resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(item=>/rebus-pronunciation-lexicon|rebus-sound-catalog|rebus-visible-conventions/.test(item.name)).map(item=>({name:item.name,duration:Number(item.duration.toFixed(2)),transferSize:item.transferSize,decodedBodySize:item.decodedBodySize})));
  await page.screenshot({path:`phrase-browser-${key}.png`,fullPage:true});
  await save();
  return report.cases[key];
}

const ranger=await runPhrase('ranger','ranger la maison',{cold:true});
const pili=await runPhrase('pili','pili');
const merciPapa=await runPhrase('merciPapa','merci papa');
const simple=await runPhrase('papa','papa');
console.log(JSON.stringify(report));

if(requireVisible){
  assert.equal(pageErrors.length,0,`Browser page errors: ${pageErrors.join('\n')}`);
  assert.equal(ranger.submitTopHit?.tag,'BUTTON','phrase result must not overlap the Create button');
  assert.deepEqual(pili.pieces.map(piece=>piece.text),['pie','lit'],'Phrase mode must visibly render pili as pie + lit');
  assert.ok(pili.pieces.every(piece=>piece.visible&&piece.inViewport),'Both pili pieces must be visible in the mobile viewport');
  assert.deepEqual(merciPapa.pieces.map(piece=>piece.text),['mer','scie','pas','pas'],'merci papa must use the continuous phrase route in the rendered DOM');
  assert.ok(merciPapa.pieces.slice(0,3).every(piece=>piece.visible&&piece.inViewport),'merci papa must immediately show several real pieces without an empty leading panel');
  assert.equal(ranger.rebusChildCount,5,'ranger la maison must render its gap plus four known representations');
  assert.ok(ranger.pieces.filter(piece=>piece.visible&&piece.inViewport).length>=2,'ranger la maison must show actual rebus pieces in the first mobile viewport');
  assert.equal(ranger.planner,'worker','continuous phrase planning must run off the browser main thread when Worker is available');
  assert.ok(ranger.visibleMs<1500,`cold phrase result should stay responsive under 4x CPU throttling; observed ${ranger.visibleMs} ms`);
  assert.ok(pili.visibleMs<250&&merciPapa.visibleMs<250,'warm phrase submissions must render promptly under 4x CPU throttling');
}
await browser.close();
