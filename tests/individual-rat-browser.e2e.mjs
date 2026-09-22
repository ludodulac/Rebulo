import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {REBULO_INDIVIDUAL_VISUALS} from '../src/rebulo-individual-visuals.js';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const report={baseUrl,assets:{}};
try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
  const page=await context.newPage();
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.rebuloVisibleBatch1==='23');

  const entries=Object.entries(REBULO_INDIVIDUAL_VISUALS);
  await page.evaluate((entries)=>{
    for(const [id] of entries){
      const host=document.createElement('div');
      host.id='individual-'+id+'-probe';
      host.className='piece';
      const img=document.createElement('img');
      img.alt=id;
      img.src='assets/rebus/'+id+'.svg';
      host.appendChild(img);
      document.body.appendChild(host);
    }
  },entries);

  for(const [id,path] of entries){
    await page.waitForFunction(({id,path})=>{
      const img=document.querySelector('#individual-'+id+'-probe img');
      return img?.dataset?.rebuloVisibleBatch1===id &&
        String(img.getAttribute('src')||'').endsWith(path) &&
        img.complete && img.naturalWidth>0 && img.naturalHeight>0;
    },{id,path},{timeout:10000});

    const row=await page.evaluate((id)=>{
      const img=document.querySelector('#individual-'+id+'-probe img');
      const cs=getComputedStyle(img); const r=img.getBoundingClientRect();
      return {src:img.getAttribute('src'),id:img.dataset.rebuloVisibleBatch1,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,renderedWidth:r.width,renderedHeight:r.height,objectFit:cs.objectFit,backgroundImage:cs.backgroundImage,backgroundColor:cs.backgroundColor,boxShadow:cs.boxShadow,borderRadius:cs.borderRadius};
    },id);
    assert.equal(row.id,id);
    assert.equal(row.src,path);
    assert.equal(row.objectFit,'contain');
    assert.equal(row.backgroundImage,'none');
    assert.equal(row.boxShadow,'none');
    assert.equal(row.borderRadius,'0px');
    assert.ok(row.renderedWidth>=70);
    assert.ok(row.renderedHeight>=70);
    report.assets[id]=row;
  }

  const gallery=page.locator('.piece').filter({has:page.locator('img[data-rebulo-visible-batch1]')});
  await gallery.first().scrollIntoViewIfNeeded();
  await page.screenshot({path:'individual-visuals-mobile-proof.png',fullPage:true});
  await writeFile('individual-visuals-browser-report.json',JSON.stringify(report,null,2));
  await context.close();
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
