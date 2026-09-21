import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const report={baseUrl,rat:null};
try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
  const page=await context.newPage();
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.rebuloVisibleBatch1==='23');

  await page.evaluate(()=>{
    const host=document.createElement('div');
    host.id='individual-rat-probe';
    host.className='piece';
    const img=document.createElement('img');
    img.alt='rat';
    img.src='assets/rebus/rat.svg';
    host.appendChild(img);
    document.body.appendChild(host);
  });

  await page.waitForFunction(()=>{
    const img=document.querySelector('#individual-rat-probe img');
    return img?.dataset?.rebuloVisibleBatch1==='rat' &&
      String(img.getAttribute('src')||'').endsWith('assets/visible-batch1/individual/rat.png') &&
      img.complete && img.naturalWidth>0;
  },null,{timeout:10000});

  report.rat=await page.evaluate(()=>{
    const img=document.querySelector('#individual-rat-probe img');
    const cs=getComputedStyle(img);
    const r=img.getBoundingClientRect();
    return {
      src:img.getAttribute('src'),
      id:img.dataset.rebuloVisibleBatch1,
      naturalWidth:img.naturalWidth,
      naturalHeight:img.naturalHeight,
      renderedWidth:r.width,
      renderedHeight:r.height,
      objectFit:cs.objectFit,
      backgroundImage:cs.backgroundImage,
      backgroundColor:cs.backgroundColor,
      boxShadow:cs.boxShadow,
      borderRadius:cs.borderRadius
    };
  });

  assert.equal(report.rat.id,'rat');
  assert.equal(report.rat.src,'assets/visible-batch1/individual/rat.png');
  assert.equal(report.rat.naturalWidth,256);
  assert.equal(report.rat.naturalHeight,256);
  assert.equal(report.rat.objectFit,'contain');
  assert.equal(report.rat.backgroundImage,'none');
  assert.equal(report.rat.boxShadow,'none');
  assert.equal(report.rat.borderRadius,'0px');
  assert.ok(report.rat.renderedWidth>=70);
  assert.ok(report.rat.renderedHeight>=70);

  await page.screenshot({path:'individual-rat-mobile-proof.png',fullPage:false});
  await writeFile('individual-rat-browser-report.json',JSON.stringify(report,null,2));
  await context.close();
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
