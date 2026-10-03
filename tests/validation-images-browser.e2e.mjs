import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

try{
  await sleep(700);
  const browser=await chromium.launch({headless:true});

  const realContext=await browser.newContext({viewport:{width:390,height:844}});
  const realPage=await realContext.newPage();
  await realPage.goto('http://127.0.0.1:4173/validation-images/',{waitUntil:'domcontentloaded'});
  await realPage.waitForSelector('.candidate-card');
  assert.equal(await realPage.locator('.candidate-card').count(),50);
  assert.equal(await realPage.locator('#totalCount').textContent(),'50');
  assert.equal(await realPage.locator('#untreatedCount').textContent(),'50');
  assert.equal(await realPage.evaluate(()=>document.documentElement.scrollWidth),390);
  const firstImage=realPage.locator('.candidate-image').first();
  await firstImage.waitFor();
  assert.ok(await firstImage.evaluate(img=>img.complete&&img.naturalWidth>0));
  const lastImage=realPage.locator('.candidate-image').last();
  await lastImage.scrollIntoViewIfNeeded();
  await lastImage.evaluate(img=>new Promise((resolve,reject)=>{
    if(img.complete)return img.naturalWidth>0?resolve():reject(new Error('last image unreadable'));
    img.addEventListener('load',resolve,{once:true});
    img.addEventListener('error',()=>reject(new Error('last image failed')),{once:true});
  }));
  assert.ok(await lastImage.evaluate(img=>img.naturalWidth>0));
  await realContext.close();

  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>{
    Object.defineProperty(navigator,'clipboard',{
      configurable:true,
      value:{writeText:async text=>{window.__copiedReport=text;}}
    });
  });
  const page=await context.newPage();
  const fake='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="white"/></svg>');
  await page.route('**/validation-images/lots/lot-001.json',route=>route.fulfill({
    contentType:'application/json',
    body:JSON.stringify({
      schema_version:1,
      lot_id:'lot-001',
      title:'Lot test',
      candidates:[
        {id:'alpha',concept:'ALPHA',asset:fake},
        {id:'beta',concept:'BETA',asset:fake},
        {id:'gamma',concept:'GAMMA',asset:fake}
      ]
    })
  }));

  await page.goto('http://127.0.0.1:4173/validation-images/');
  await page.waitForSelector('.candidate-card');

  const first=page.locator('.candidate-card').nth(0);
  const second=page.locator('.candidate-card').nth(1);
  await first.getByRole('button',{name:'✓ VALIDER'}).click();
  await second.getByRole('button',{name:'✕ REFUSER'}).click();
  await second.getByLabel('Remarque pour BETA').fill('à refaire plus lisible');
  await page.locator('#grandpaMessage').fill('Lot contrôlé sur mobile.');

  assert.equal(await page.locator('#validatedCount').textContent(),'1');
  assert.equal(await page.locator('#refusedCount').textContent(),'1');
  assert.equal(await page.locator('#untreatedCount').textContent(),'1');

  await page.reload();
  await page.waitForSelector('.candidate-card');
  assert.equal(await page.locator('.candidate-card').nth(0).getByRole('button',{name:'✓ VALIDER'}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.candidate-card').nth(1).getByLabel('Remarque pour BETA').inputValue(),'à refaire plus lisible');
  assert.equal(await page.locator('#grandpaMessage').inputValue(),'Lot contrôlé sur mobile.');

  await page.locator('#copyReport').click();
  const report=await page.evaluate(()=>window.__copiedReport);
  assert.match(report,/LOT_ID : lot-001/);
  assert.match(report,/\[alpha\] ALPHA/);
  assert.match(report,/\[beta\] BETA/);
  assert.match(report,/à refaire plus lisible/);
  assert.match(report,/Lot contrôlé sur mobile\./);
  assert.match(report,/UNTREATED : 1/);

  await browser.close();
}finally{
  server.kill();
}
