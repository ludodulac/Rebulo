import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {REBULO_INDIVIDUAL_VISUALS} from '../src/rebulo-individual-visuals.js';
import {REBULO_VISIBLE_BATCH1} from '../src/rebulo-visible-batch1-assets.js';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const report={baseUrl,assets:{}};
try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'fr-FR'});
  const page=await context.newPage();
  page.on('console',msg=>console.log('BROWSER CONSOLE',msg.type(),msg.text()));
  page.on('pageerror',error=>console.log('BROWSER PAGEERROR',error?.stack||error?.message||String(error)));
  page.on('requestfailed',request=>console.log('BROWSER REQUESTFAILED',request.method(),request.url(),request.failure()?.errorText||'unknown'));
  page.on('response',response=>{
    if(response.status()>=400)console.log('BROWSER HTTP',response.status(),response.request().method(),response.url());
  });
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.rebuloVisibleBatch1==='23');

  const visibleIds=new Set(REBULO_VISIBLE_BATCH1.map(item=>item.id));
  const entries=Object.entries(REBULO_INDIVIDUAL_VISUALS).filter(([id])=>visibleIds.has(id));
  const outOfVisibleBatch=Object.keys(REBULO_INDIVIDUAL_VISUALS).filter(id=>!visibleIds.has(id));
  assert.equal(entries.length,21,'visible-batch browser domain must contain exactly 21 individual visuals');
  assert.deepEqual(outOfVisibleBatch,['de','riz'],'out-of-visible-batch individual visuals must remain explicit');
  report.domain={visibleBatchIndividualCount:entries.length,outOfVisibleBatch};
  await page.evaluate((entries)=>{
    for(const [id] of entries){
      const host=document.createElement('div');
      host.id='individual-'+id+'-probe';
      host.className='piece';
      const img=document.createElement('img');
      img.alt=id;
      img.src='assets/rebus/'+id+'.svg?asset='+encodeURIComponent(id);
      host.appendChild(img);
      document.body.appendChild(host);
    }
  },entries);

  for(const [id,path] of entries){
    const initial=await page.evaluate((id)=>{
      const img=document.querySelector('#individual-'+id+'-probe img');
      return {src:img?.getAttribute('src')||null};
    },id);
    console.log('BEGIN PROBE',id,'expectedPath='+path,'initialSrc='+initial.src);
    try{
      await page.waitForFunction(({id,path})=>{
        const img=document.querySelector('#individual-'+id+'-probe img');
        return img?.dataset?.rebuloVisibleBatch1===id &&
          String(img.getAttribute('src')||'').endsWith(path) &&
          img.complete && img.naturalWidth>0 && img.naturalHeight>0;
      },{id,path},{timeout:10000});
      console.log('PASS PROBE',id);
    }catch(error){
      const state=await page.evaluate(({id,path})=>{
        const img=document.querySelector('#individual-'+id+'-probe img');
        const dataset=img?.dataset?.rebuloVisibleBatch1;
        const src=img?.getAttribute('src')||null;
        const complete=Boolean(img?.complete);
        const naturalWidth=img?.naturalWidth||0;
        const naturalHeight=img?.naturalHeight||0;
        return {
          id,expectedPath:path,
          dataset:dataset??null,
          src,
          absoluteSrc:img?.src||null,
          complete,naturalWidth,naturalHeight,
          alt:img?.alt??null,
          isConnected:Boolean(img?.isConnected),
          predicates:{
            datasetMatches:dataset===id,
            srcMatches:String(src||'').endsWith(path),
            complete,
            naturalWidthPositive:naturalWidth>0,
            naturalHeightPositive:naturalHeight>0
          }
        };
      },{id,path});
      console.log('FAIL PROBE STATE',JSON.stringify(state));
      throw error;
    }

    const row=await page.evaluate((id)=>{
      const img=document.querySelector('#individual-'+id+'-probe img');
      const cs=getComputedStyle(img); const r=img.getBoundingClientRect();
      const canvas=document.createElement('canvas'); canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
      const ctx=canvas.getContext('2d',{willReadFrequently:true}); ctx.drawImage(img,0,0);
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let alphaMin=255,alphaMax=0;
      for(let i=3;i<pixels.length;i+=4){const a=pixels[i];if(a<alphaMin)alphaMin=a;if(a>alphaMax)alphaMax=a;}
      return {src:img.getAttribute('src'),id:img.dataset.rebuloVisibleBatch1,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,renderedWidth:r.width,renderedHeight:r.height,objectFit:cs.objectFit,backgroundImage:cs.backgroundImage,backgroundColor:cs.backgroundColor,boxShadow:cs.boxShadow,borderRadius:cs.borderRadius,alphaMin,alphaMax};
    },id);
    assert.equal(row.id,id);
    assert.equal(row.src,path);
    assert.equal(row.objectFit,'contain');
    assert.equal(row.backgroundImage,'none');
    assert.equal(row.boxShadow,'none');
    assert.equal(row.borderRadius,'0px');
    assert.ok(row.alphaMin<255,`${id} must contain real transparent pixels`);
    assert.ok(row.alphaMax>0,`${id} must contain visible non-transparent pixels`);
    assert.ok(row.renderedWidth>=70);
    assert.ok(row.renderedHeight>=70);
    report.assets[id]=row;
  }

  // Build a deterministic proof board from the already-validated probes.
  // This is browser presentation only; it does not create or alter any source artwork.
  await page.evaluate((entries)=>{
    const board=document.createElement('section');
    board.id='individual-visual-proof-board';
    Object.assign(board.style,{position:'absolute',left:'0',top:'0',zIndex:'2147483647',width:'390px',boxSizing:'border-box',padding:'12px',background:'#fff',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'});
    for(const [id] of entries){
      const source=document.querySelector('#individual-'+id+'-probe img');
      const card=document.createElement('div');
      Object.assign(card.style,{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'118px',border:'1px solid #ddd',borderRadius:'12px',background:'#fff',fontFamily:'sans-serif',fontWeight:'700'});
      const clone=source.cloneNode(true);
      Object.assign(clone.style,{width:'82px',height:'82px',objectFit:'contain',background:'transparent',boxShadow:'none',borderRadius:'0'});
      const label=document.createElement('span'); label.textContent=id;
      card.append(clone,label); board.appendChild(card);
    }
    document.body.appendChild(board);
  },entries);
  const board=page.locator('#individual-visual-proof-board');
  await board.screenshot({path:'individual-visuals-mobile-proof.png'});
  await writeFile('individual-visuals-browser-report.json',JSON.stringify(report,null,2));
  await context.close();
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
