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
const context=await browser.newContext({
  viewport:{width,height},
  deviceScaleFactor:2,
  isMobile:true,
  hasTouch:true,
  locale:'fr-FR'
});
const page=await context.newPage();
const session=await context.newCDPSession(page);
if(cpuRate>1)await session.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
const consoleErrors=[];
const pageErrors=[];
page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
page.on('pageerror',error=>pageErrors.push(String(error?.stack||error)));

const now=()=>performance.now();
const navigationStarted=now();
await page.goto(baseUrl,{waitUntil:'networkidle',timeout:120000});
const navigationMs=now()-navigationStarted;

// Enter the exact public product path: Créer -> Phrase.
await page.locator('#createMode').click();
await page.locator('[data-creator-kind="phrase"]').click();
await page.locator('#target').waitFor({state:'visible'});

async function runPhrase(value,{cold=false}={}){
  await page.locator('#target').fill(value);
  const started=now();
  await page.locator('#creatorForm button[type="submit"]').click();
  await page.waitForFunction(expected=>{
    const result=document.querySelector('#result');
    const word=document.querySelector('#resultWord');
    const proof=document.querySelector('#phoneticProof');
    const feedback=document.querySelector('#creatorFeedback');
    return result && !result.hidden && word?.textContent===expected && (proof?.textContent||feedback?.textContent);
  },value,{timeout:cold?120000:30000});
  const visibleMs=now()-started;
  const snapshot=await page.evaluate(()=>{
    const rebus=document.querySelector('#creatorRebus');
    const rect=rebus?.getBoundingClientRect();
    const pieces=[...document.querySelectorAll('#creatorRebus .piece')].map(node=>({
      text:node.textContent?.trim()||'',
      image:node.querySelector('img')?.getAttribute('src')||null,
      symbol:node.querySelector('strong')?.textContent||null,
      visible:Boolean(node.getClientRects().length)
    }));
    const gaps=[...document.querySelectorAll('#creatorRebus .phrase-sound-gap,#creatorRebus .phrase-uncovered-token')].map(node=>({text:node.textContent?.trim()||'',visible:Boolean(node.getClientRects().length)}));
    return {
      badge:document.querySelector('.strict-badge')?.textContent?.trim()||'',
      proof:document.querySelector('#phoneticProof')?.textContent?.trim()||'',
      proofTitle:document.querySelector('#phoneticProof')?.getAttribute('title')||'',
      feedback:document.querySelector('#creatorFeedback')?.textContent?.trim()||'',
      resultHidden:document.querySelector('#result')?.hidden??true,
      rebusChildCount:rebus?.children.length||0,
      rebusText:rebus?.textContent?.trim()||'',
      rebusRect:rect?{width:rect.width,height:rect.height}:null,
      pieces,
      gaps
    };
  });
  return {value,visibleMs:Number(visibleMs.toFixed(2)),...snapshot};
}

const ranger=await runPhrase('ranger la maison',{cold:true});
const pili=await runPhrase('pili');
const merciPapa=await runPhrase('merci papa');
const simple=await runPhrase('papa');

const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(item=>/rebus-pronunciation-lexicon|rebus-sound-catalog|rebus-visible-conventions/.test(item.name)).map(item=>({name:item.name,duration:item.duration,transferSize:item.transferSize,decodedBodySize:item.decodedBodySize})));
const report={baseUrl,cpuRate,viewport:{width,height},navigationMs:Number(navigationMs.toFixed(2)),resources,consoleErrors,pageErrors,cases:{ranger,pili,merciPapa,simple}};
await page.screenshot({path:'phrase-browser-product.png',fullPage:true});
await writeFile(output,JSON.stringify(report,null,2));
console.log(JSON.stringify(report));

if(requireVisible){
  assert.equal(pageErrors.length,0,`Browser page errors: ${pageErrors.join('\n')}`);
  assert.ok(pili.pieces.filter(piece=>piece.visible).length>=2,`pili must render at least two visible rebus pieces; got ${JSON.stringify(pili)}`);
  assert.ok(merciPapa.pieces.some(piece=>piece.visible),`merci papa must render visible rebus pieces; got ${JSON.stringify(merciPapa)}`);
  assert.ok(ranger.rebusChildCount>0,'ranger la maison must not leave the rebus container empty');
}
await browser.close();
