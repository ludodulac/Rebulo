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
await page.locator('#createMode').click();
await page.locator('[data-creator-kind="phrase"]').click();
await page.locator('#target').waitFor({state:'visible'});

async function runPhrase(key,value,{cold=false}={}){
  const input=page.locator('#target');
  await input.fill(value);
  const started=now();
  // Enter is deliberate here: it exercises the real form handler while avoiding a
  // second product bug where the phrase result currently overlaps the submit button.
  await input.press('Enter');
  await page.waitForFunction(expected=>{
    const result=document.querySelector('#result');
    const word=document.querySelector('#resultWord');
    const proof=document.querySelector('#phoneticProof');
    const feedback=document.querySelector('#creatorFeedback');
    return result&&!result.hidden&&word?.textContent===expected&&(proof?.textContent||feedback?.textContent);
  },value,{timeout:cold?120000:30000});
  const visibleMs=now()-started;
  const snapshot=await page.evaluate(()=>{
    const rebus=document.querySelector('#creatorRebus');
    const rect=rebus?.getBoundingClientRect();
    const submit=document.querySelector('#creatorForm button[type="submit"]')?.getBoundingClientRect();
    const children=[...(rebus?.children||[])].map((node,index)=>{
      const childRect=node.getBoundingClientRect();
      return {index,className:node.className,text:node.textContent?.trim()||'',x:childRect.x,y:childRect.y,width:childRect.width,height:childRect.height,visible:Boolean(node.getClientRects().length),inViewport:childRect.right>0&&childRect.left<innerWidth&&childRect.bottom>0&&childRect.top<innerHeight};
    });
    const pieces=[...document.querySelectorAll('#creatorRebus .piece')].map(node=>{const r=node.getBoundingClientRect();return{text:node.textContent?.trim()||'',image:node.querySelector('img')?.getAttribute('src')||null,symbol:node.querySelector('strong')?.textContent||null,visible:Boolean(node.getClientRects().length),inViewport:r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight,x:r.x,width:r.width};});
    const gaps=[...document.querySelectorAll('#creatorRebus .phrase-sound-gap,#creatorRebus .phrase-uncovered-token')].map(node=>{const r=node.getBoundingClientRect();return{text:node.textContent?.trim()||'',visible:Boolean(node.getClientRects().length),inViewport:r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight,x:r.x,width:r.width};});
    const topHit=submit?document.elementFromPoint(submit.x+submit.width/2,submit.y+submit.height/2):null;
    return {
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
  assert.ok(pili.pieces.filter(piece=>piece.visible&&piece.inViewport).length>=2,`pili must render at least two visible rebus pieces in the viewport; got ${JSON.stringify(pili)}`);
  assert.ok(merciPapa.pieces.some(piece=>piece.visible&&piece.inViewport),`merci papa must render visible rebus pieces; got ${JSON.stringify(merciPapa)}`);
  assert.ok(ranger.rebusChildCount>0,'ranger la maison must not leave the rebus container empty');
  assert.ok(ranger.children.some(child=>child.inViewport&&!child.className.includes('phrase-coverage-legend')),'ranger la maison must show at least one actual operation in the viewport');
}
await browser.close();
