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
const phrase='Le chien regarde le train';
await page.locator('#target').fill(phrase);
await page.evaluate(()=>document.querySelector('#creatorForm')?.requestSubmit());
await page.waitForFunction(value=>!document.querySelector('#result')?.hidden&&document.querySelector('#resultWord')?.textContent===value,phrase,{timeout:15000});
const snapshot=await page.evaluate(()=>{
  const row=document.querySelector('#creatorRebus');const rr=row.getBoundingClientRect();
  const inspect=node=>{const r=node.getBoundingClientRect();return{tag:node.tagName,className:node.className,text:node.textContent?.trim()||'',left:r.left,right:r.right,width:r.width,clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,visible:Boolean(node.getClientRects().length)};};
  const children=[...row.children].map(node=>{const r=node.getBoundingClientRect();return{className:node.className,text:node.textContent?.trim()||'',left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,visible:Boolean(node.getClientRects().length)};});
  const descendants=[...row.querySelectorAll('*')].map(inspect).filter(item=>item.scrollWidth>item.clientWidth+1||item.left<rr.left-1||item.right>rr.right+1);
  const gaps=[...row.querySelectorAll('.phrase-sound-gap')].map(node=>({
    title:node.title,
    pseudo:getComputedStyle(node,'::after').content,
    wordDisplay:getComputedStyle(node.querySelector('strong')).display,
    tagDisplay:getComputedStyle(node.querySelector('small')).display
  }));
  const arena=row.closest('.arena');const ar=arena.getBoundingClientRect();
  return{viewport:innerWidth,row:{left:rr.left,right:rr.right,top:rr.top,bottom:rr.bottom,width:rr.width,height:rr.height,clientWidth:row.clientWidth,scrollWidth:row.scrollWidth,clientHeight:row.clientHeight,scrollHeight:row.scrollHeight,overflowY:getComputedStyle(row).overflowY},arena:{top:ar.top,bottom:ar.bottom,overflowY:getComputedStyle(arena).overflowY},children,descendants,gaps,bodyScrollWidth:document.documentElement.scrollWidth,bodyScrollHeight:document.documentElement.scrollHeight};
});
console.log(JSON.stringify({phrase,...snapshot}));
assert.equal(errors.length,0,errors.join('\n'));
assert.ok(snapshot.children.length>0,'phrase result must contain readable operations');
assert.ok(snapshot.children.every(item=>item.visible),'every phrase operation must be rendered');
assert.ok(snapshot.children.every(item=>item.left>=snapshot.row.left-1&&item.right<=snapshot.row.right+1),'mobile phrase operations must wrap inside the result instead of being clipped horizontally');
assert.ok(snapshot.row.scrollWidth<=snapshot.row.clientWidth+1,'continuous phrase row must not require a hidden horizontal scrollbar on mobile');
assert.ok(snapshot.bodyScrollWidth<=snapshot.viewport+1,'phrase result must not create page-level horizontal overflow');
const lastBottom=Math.max(...snapshot.children.map(item=>item.bottom));
assert.ok(lastBottom<=snapshot.row.bottom+1||snapshot.row.scrollHeight>snapshot.row.clientHeight+1&&snapshot.row.overflowY!=='hidden','every phrase operation must remain vertically accessible instead of being clipped by the phrase container');
assert.ok(lastBottom<=snapshot.arena.bottom+1||snapshot.arena.overflowY!=='hidden','every phrase operation must remain vertically accessible instead of being clipped by the arena');
for(const gap of snapshot.gaps){
  assert.match(gap.title,/\/[^^/]*\//,'gap must retain its exact uncovered IPA span');
  assert.match(gap.pseudo,/\//,'visible mobile gap must expose IPA rather than an orthographic word label');
  assert.equal(gap.wordDisplay,'none','orthographic source word must not be presented as the missing sound');
  assert.equal(gap.tagDisplay,'none');
}
await browser.close();
