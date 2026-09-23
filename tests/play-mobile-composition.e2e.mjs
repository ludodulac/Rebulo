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

const advanced=page.locator('#difficultyProfiles [data-profile="advanced"]');
if(await advanced.count())await advanced.click();
for(let attempt=0;attempt<80;attempt++){
  const count=await page.locator('#playRebus .play-piece').count();
  if(count>=4)break;
  await page.locator('#playNewButton').click();
  await page.waitForTimeout(25);
}
assert.ok(await page.locator('#playRebus .play-piece').count()>=4,'Play must expose a long enough real round to prove mobile wrapping');

const snapshot=await page.evaluate(()=>{
  const row=document.querySelector('#playRebus');const rr=row.getBoundingClientRect();
  const pieces=[...row.querySelectorAll('.play-piece')].map((node,index)=>{const r=node.getBoundingClientRect();return{index,left:r.left,right:r.right,top:r.top,bottom:r.bottom,visible:Boolean(node.getClientRects().length)};});
  const lineTops=[...new Set(pieces.map(item=>Math.round(item.top)))];
  const visualOrderPreserved=pieces.every((item,index)=>index===0||item.top>pieces[index-1].top-1||(Math.abs(item.top-pieces[index-1].top)<1&&item.left>pieces[index-1].left));
  return{viewport:{width:innerWidth,height:innerHeight},row:{left:rr.left,right:rr.right,clientWidth:row.clientWidth,scrollWidth:row.scrollWidth},pieces,domOrder:pieces.map(item=>item.index),lineCount:lineTops.length,visualOrderPreserved,bodyScrollWidth:document.documentElement.scrollWidth};
});
console.log(JSON.stringify({phase:'wrapped-play',...snapshot}));
assert.equal(errors.length,0,errors.join('\n'));
assert.ok(snapshot.lineCount>=2,'long mobile Play round must actually occupy multiple lines');
assert.ok(snapshot.pieces.every(item=>item.visible),'every Play piece must remain visible');
assert.ok(snapshot.pieces.every(item=>item.left>=snapshot.row.left-1&&item.right<=snapshot.row.right+1),'Play pieces must wrap inside the mobile rebus composition');
assert.ok(snapshot.row.scrollWidth<=snapshot.row.clientWidth+1,'mobile Play rebus must not require horizontal scrolling');
assert.ok(snapshot.bodyScrollWidth<=snapshot.viewport.width+1,'mobile Play must not create page-level horizontal overflow');
assert.deepEqual(snapshot.domOrder,[...snapshot.domOrder].sort((a,b)=>a-b),'DOM reading order must remain stable');
assert.ok(snapshot.visualOrderPreserved,'visual wrapping must preserve DOM reading order');

const notes=page.locator('.play-notes-panel');
assert.equal(await notes.getAttribute('open'),null,'test notes must be collapsed by default');
await page.locator('#playAnswer').focus();
await page.evaluate(()=>document.body.classList.add('keyboard-open'));
const keyboard=await page.evaluate(()=>{
  const visible=selector=>{const node=document.querySelector(selector);if(!node)return false;const style=getComputedStyle(node);const r=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&r.width>0&&r.height>0;};
  const rebus=document.querySelector('#playRebus');const answer=document.querySelector('#playAnswer');const submit=document.querySelector('#playAnswerForm button[type="submit"]');
  return{activeId:document.activeElement?.id||'',keyboardOpen:document.body.classList.contains('keyboard-open'),rebusVisible:visible('#playRebus'),answerVisible:visible('#playAnswer'),submitVisible:Boolean(submit)&&visible('#playAnswerForm button[type="submit"]'),notesDisplay:getComputedStyle(document.querySelector('.play-notes-panel')).display,rebusScrollWidth:rebus.scrollWidth,rebusClientWidth:rebus.clientWidth,answerBottom:answer.getBoundingClientRect().bottom,submitBottom:submit?.getBoundingClientRect().bottom||0};
});
console.log(JSON.stringify({phase:'keyboard-open',...keyboard}));
assert.equal(keyboard.activeId,'playAnswer','answer field must keep focus');
assert.ok(keyboard.keyboardOpen);
assert.ok(keyboard.rebusVisible,'rebus must remain usable in keyboard-open state');
assert.ok(keyboard.answerVisible,'answer field must remain usable in keyboard-open state');
assert.ok(keyboard.submitVisible,'Validate control must remain usable in keyboard-open state');
assert.equal(keyboard.notesDisplay,'none','test notes must disappear in keyboard-open state');
assert.ok(keyboard.rebusScrollWidth<=keyboard.rebusClientWidth+1,'keyboard-open must not reintroduce horizontal rebus scrolling');
await browser.close();
