import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs';

const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
  await sleep(800);
  const browser=await chromium.launch({headless:true});

  // Proof 1: the real LOT 001 is wired to the ten real repository PNGs.
  const realContext=await browser.newContext({viewport:{width:390,height:844}});
  const realPage=await realContext.newPage();
  await realPage.goto('http://127.0.0.1:4173/validation-graphiques.html');
  await realPage.waitForSelector('.candidate-card');
  assert.equal(await realPage.evaluate(()=>document.documentElement.scrollWidth),390);
  assert.equal(await realPage.locator('.candidate-card').count(),10);
  assert.deepEqual(
    await realPage.locator('.candidate-name').allTextContents(),
    ['BAS','BOUE','SAUT','COU','SANG','MER','THÉ','VEAU','FÉE','COMPAS']
  );
  await realPage.waitForFunction(()=>Array.from(document.images).length===10&&Array.from(document.images).every(img=>img.complete&&img.naturalWidth>0));
  assert.equal(await realPage.locator('#progressText').textContent(),'0 / 10 examinées');
  assert.equal(await realPage.locator('#finalizeBatch').isDisabled(),true);
  await realContext.close();

  // Proof 2: decision switching, persistence, final gate and structured export.
  const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
  const page=await context.newPage();
  const fakePng='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="none"/></svg>');
  const candidates=Array.from({length:10},(_,i)=>({concept_id:`c${i+1}`,label:`CONCEPT ${i+1}`,asset:fakePng,source_drive_id:`drive-${i+1}`}));
  await page.route('**/data/validation-batches/lot-001.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({schema_version:1,batch_id:'lot-001',title:'Lot 001 · 10 candidats',candidates})}));
  await page.goto('http://127.0.0.1:4173/validation-graphiques.html');
  await page.waitForSelector('.candidate-card');

  const first=page.locator('.candidate-card').first();
  await first.getByRole('button',{name:'✓ VALIDER'}).click();
  assert.equal(await page.locator('#progressText').textContent(),'1 / 10 examinées');
  await page.locator('.candidate-card').first().getByRole('button',{name:'✕ REFUSER'}).click();
  await page.locator('.candidate-card').first().getByLabel('Remarque / correction souhaitée').fill('corriger la silhouette');

  for(let i=1;i<10;i++)await page.locator('.candidate-card').nth(i).getByRole('button',{name:'✓ VALIDER'}).click();
  assert.equal(await page.locator('#progressText').textContent(),'10 / 10 examinées');
  assert.equal(await page.locator('#finalizeBatch').isEnabled(),true);

  await page.reload();
  await page.waitForSelector('.candidate-card');
  assert.equal(await page.locator('#progressText').textContent(),'10 / 10 examinées');
  assert.equal(await page.locator('.candidate-card').first().getByRole('button',{name:'✕ REFUSER'}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.candidate-card').first().getByLabel('Remarque / correction souhaitée').inputValue(),'corriger la silhouette');

  const downloadPromise=page.waitForEvent('download');
  await page.locator('#finalizeBatch').click();
  const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'rebulo-validation-lot-001.json');
  const path=await download.path();
  const exported=JSON.parse(fs.readFileSync(path,'utf8'));
  assert.equal(exported.batch_id,'lot-001');
  assert.equal(exported.decisions.length,10);
  assert.equal(exported.decisions[0].concept_id,'c1');
  assert.equal(exported.decisions[0].decision,'REJECTED');
  assert.equal(exported.decisions[0].remark,'corriger la silhouette');
  assert.equal(exported.decisions[0].source_drive_id,'drive-1');
  assert.ok(exported.decisions[0].decided_at);
  assert.ok(exported.finalized_at);

  console.log(JSON.stringify({
    viewport:[390,844],
    realLotImages:'10/10 LOADED',
    realLotConcepts:['BAS','BOUE','SAUT','COU','SANG','MER','THÉ','VEAU','FÉE','COMPAS'],
    persistence:'PASS',
    finalGate:'PASS',
    batchId:exported.batch_id
  }));
  await browser.close();
}finally{server.kill();}
