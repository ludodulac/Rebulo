import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {REBULO_INDIVIDUAL_VISUALS} from '../src/rebulo-individual-visuals.js';
import {REBULO_VISIBLE_BATCH1} from '../src/rebulo-visible-batch1-assets.js';
import {SYLLABLE_PRINT_LIBRARY} from '../src/syllable-print-library.js';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const visibleIds=new Set(REBULO_VISIBLE_BATCH1.map(item=>item.id));
const allIndividualIds=Object.keys(REBULO_INDIVIDUAL_VISUALS);
const visibleBrowserIds=allIndividualIds.filter(id=>visibleIds.has(id));
const outOfVisibleBatchIds=allIndividualIds.filter(id=>!visibleIds.has(id));

assert.equal(visibleBrowserIds.length,21);
assert.deepEqual(outOfVisibleBatchIds,['de','riz']);

const expected=Object.freeze({
  de:{label:'dé',ipa:'/de/',status:'active',image:'assets/visible-batch1/individual/de.png'},
  riz:{label:'riz',ipa:'/ʁi/',status:'active',image:'assets/visible-batch1/individual/riz.png'}
});
const items=outOfVisibleBatchIds.map(id=>SYLLABLE_PRINT_LIBRARY.find(item=>item.id===id));
assert.equal(items.length,2);
for(const item of items){
  assert.ok(item,`missing syllable-print product entry`);
  const exp=expected[item.id];
  assert.ok(exp,`unexpected out-of-visible-batch syllable-print item: ${item.id}`);
  assert.equal(item.label,exp.label);
  assert.equal(item.ipa,exp.ipa);
  assert.equal(item.status,exp.status);
  assert.equal(item.image,exp.image);
  assert.equal(REBULO_INDIVIDUAL_VISUALS[item.id],exp.image);
}

const covered=[...visibleBrowserIds,...items.map(item=>item.id)];
assert.equal(covered.length,allIndividualIds.length);
assert.equal(new Set(covered).size,covered.length,'browser coverage must not contain duplicates');
assert.deepEqual([...new Set(covered)].sort(),[...allIndividualIds].sort(),'browser coverage must include every individual visual exactly once');

const browser=await chromium.launch({headless:true});
const report={baseUrl,domain:{visibleBatch:visibleBrowserIds,syllablePrint:items.map(item=>item.id),total:covered.length},assets:{}};
try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
  const page=await context.newPage();
  page.on('pageerror',error=>console.log('SYLLABLE BROWSER PAGEERROR',error?.stack||error?.message||String(error)));
  page.on('requestfailed',request=>console.log('SYLLABLE BROWSER REQUESTFAILED',request.method(),request.url(),request.failure()?.errorText||'unknown'));
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});

  for(const item of items){
    console.log('BEGIN SYLLABLE PROBE',item.id,'expectedPath='+item.image);
    await page.evaluate((item)=>{
      const host=document.createElement('div');
      host.id='syllable-'+item.id+'-probe';
      Object.assign(host.style,{width:'82px',height:'82px'});
      const img=document.createElement('img');
      img.alt=item.label;
      img.src=item.image;
      Object.assign(img.style,{width:'82px',height:'82px',objectFit:'contain',background:'transparent',boxShadow:'none',borderRadius:'0'});
      host.appendChild(img);
      document.body.appendChild(host);
    },item);
    await page.waitForFunction(id=>{
      const img=document.querySelector('#syllable-'+id+'-probe img');
      return img?.complete&&img.naturalWidth>0&&img.naturalHeight>0;
    },item.id,{timeout:10000});
    const row=await page.evaluate(id=>{
      const img=document.querySelector('#syllable-'+id+'-probe img');
      const r=img.getBoundingClientRect();
      const canvas=document.createElement('canvas'); canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
      const ctx=canvas.getContext('2d',{willReadFrequently:true}); ctx.drawImage(img,0,0);
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let alphaMin=255,alphaMax=0;
      for(let i=3;i<pixels.length;i+=4){const a=pixels[i];if(a<alphaMin)alphaMin=a;if(a>alphaMax)alphaMax=a;}
      return {src:img.getAttribute('src'),complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,renderedWidth:r.width,renderedHeight:r.height,alphaMin,alphaMax};
    },item.id);
    assert.equal(row.src,item.image);
    assert.equal(row.complete,true);
    assert.ok(row.naturalWidth>0);
    assert.ok(row.naturalHeight>0);
    assert.ok(row.alphaMin<255,`${item.id} must contain real transparent pixels`);
    assert.ok(row.alphaMax>0,`${item.id} must contain visible non-transparent pixels`);
    assert.ok(row.renderedWidth>=70);
    assert.ok(row.renderedHeight>=70);
    report.assets[item.id]={id:item.id,label:item.label,ipa:item.ipa,status:item.status,image:item.image,...row};
    console.log('PASS SYLLABLE PROBE',item.id);
  }

  await writeFile('syllable-print-individual-browser-report.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({visibleBatchBrowserCount:visibleBrowserIds.length,syllablePrintBrowserCount:items.length,totalIndividualBrowserCoverage:covered.length,missingIndividualBrowserCoverage:allIndividualIds.filter(id=>!covered.includes(id))}));
  await context.close();
} finally {
  await browser.close();
}
