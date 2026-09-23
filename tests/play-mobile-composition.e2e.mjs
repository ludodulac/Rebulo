import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(String(error?.stack||error)));
await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForSelector('#playArena:not([hidden])',{state:'visible'});
await page.waitForFunction(()=>document.querySelectorAll('#playRebus .play-piece').length>0,{timeout:15000});

const snapshot=await page.evaluate(()=>{
  const row=document.querySelector('#playRebus');const rr=row.getBoundingClientRect();
  const pieces=[...row.querySelectorAll('.play-piece')].map(node=>{const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,visible:Boolean(node.getClientRects().length)};});
  return{viewport:innerWidth,row:{left:rr.left,right:rr.right,clientWidth:row.clientWidth,scrollWidth:row.scrollWidth},pieces,bodyScrollWidth:document.documentElement.scrollWidth};
});
console.log(JSON.stringify(snapshot));
assert.equal(errors.length,0,errors.join('\n'));
assert.ok(snapshot.pieces.length>0,'Play must render at least one rebus piece');
assert.ok(snapshot.pieces.every(item=>item.visible),'every Play piece must remain visible');
assert.ok(snapshot.pieces.every(item=>item.left>=snapshot.row.left-1&&item.right<=snapshot.row.right+1),'Play pieces must wrap inside the mobile rebus composition');
assert.ok(snapshot.row.scrollWidth<=snapshot.row.clientWidth+1,'mobile Play rebus must not require horizontal scrolling');
assert.ok(snapshot.bodyScrollWidth<=snapshot.viewport+1,'mobile Play must not create page-level horizontal overflow');
await browser.close();
