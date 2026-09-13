import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(String(error?.stack||error)));
await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForSelector('#playMode',{state:'visible'});
await page.evaluate(()=>document.querySelector('#createMode')?.click());
await page.evaluate(()=>document.querySelector('[data-creator-kind="phrase"]')?.click());
const phrase='L abeille tourne autour de la rose';
await page.locator('#target').fill(phrase);
await page.evaluate(()=>document.querySelector('#creatorForm')?.requestSubmit());
await page.waitForFunction(value=>!document.querySelector('#result')?.hidden&&document.querySelector('#resultWord')?.textContent===value,phrase,{timeout:15000});
const snapshot=await page.evaluate(()=>{
  const row=document.querySelector('#creatorRebus');const rr=row.getBoundingClientRect();
  const children=[...row.children].map(node=>{const r=node.getBoundingClientRect();return{className:node.className,text:node.textContent?.trim()||'',left:r.left,right:r.right,top:r.top,bottom:r.bottom,visible:Boolean(node.getClientRects().length)};});
  const gaps=[...row.querySelectorAll('.phrase-sound-gap')].map(node=>({
    title:node.title,
    pseudo:getComputedStyle(node,'::after').content,
    wordDisplay:getComputedStyle(node.querySelector('strong')).display,
    tagDisplay:getComputedStyle(node.querySelector('small')).display
  }));
  return{viewport:innerWidth,row:{left:rr.left,right:rr.right,width:rr.width,clientWidth:row.clientWidth,scrollWidth:row.scrollWidth},children,gaps,bodyScrollWidth:document.documentElement.scrollWidth};
});
assert.equal(errors.length,0,errors.join('\n'));
assert.ok(snapshot.children.length>0,'phrase result must contain readable operations');
assert.ok(snapshot.children.every(item=>item.visible),'every phrase operation must be rendered');
assert.ok(snapshot.children.every(item=>item.left>=snapshot.row.left-1&&item.right<=snapshot.row.right+1),'mobile phrase operations must wrap inside the result instead of being clipped horizontally');
assert.ok(snapshot.row.scrollWidth<=snapshot.row.clientWidth+1,'continuous phrase row must not require a hidden horizontal scrollbar on mobile');
assert.ok(snapshot.bodyScrollWidth<=snapshot.viewport+1,'phrase result must not create page-level horizontal overflow');
for(const gap of snapshot.gaps){
  assert.match(gap.title,/\/[^^/]*\//,'gap must retain its exact uncovered IPA span');
  assert.match(gap.pseudo,/\//,'visible mobile gap must expose IPA rather than an orthographic word label');
  assert.equal(gap.wordDisplay,'none','orthographic source word must not be presented as the missing sound');
  assert.equal(gap.tagDisplay,'none');
}
console.log(JSON.stringify({phrase,...snapshot}));
await browser.close();
