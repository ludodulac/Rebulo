import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/';
const output=process.env.OUTPUT_JSON||'visible-batch1-browser.json';
const browser=await chromium.launch({headless:true});
const report={baseUrl,cases:{},errors:[]};

async function prepare(viewport,isMobile=false){
  const context=await browser.newContext({viewport,deviceScaleFactor:isMobile?2:1,isMobile,hasTouch:isMobile,locale:'fr-FR'});
  const page=await context.newPage();
  page.on('pageerror',error=>report.errors.push(String(error?.stack||error)));
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#playMode',{state:'visible',timeout:10000});
  await page.waitForFunction(()=>document.documentElement.dataset.rebuloVisibleBatch1==='23',null,{timeout:10000});
  return {context,page};
}

async function openCreate(page,kind='word'){
  await page.click('#createMode');
  await page.waitForFunction(()=>document.querySelector('.app-shell')?.dataset.experience==='create');
  await page.click(`[data-creator-kind="${kind}"]`);
  await page.waitForFunction(kind=>document.querySelector('.app-shell')?.dataset.creatorKind===kind,kind);
}

async function submit(page,value){
  await page.locator('#target').fill(value);
  await page.evaluate(()=>document.querySelector('#creatorForm')?.requestSubmit());
  await page.waitForFunction(value=>!document.querySelector('#result')?.hidden&&document.querySelector('#resultWord')?.textContent?.trim().toLocaleLowerCase('fr')===value.toLocaleLowerCase('fr'),value,{timeout:15000});
  await page.waitForTimeout(120);
}

async function snapshot(page){
  return page.evaluate(()=>{
    const viewport={width:innerWidth,height:innerHeight};
    const pieces=[...document.querySelectorAll('#creatorRebus .piece')];
    const images=[...document.querySelectorAll('#creatorRebus .piece img')];
    const batch=images.filter(img=>img.dataset.rebuloVisibleBatch1).map(img=>{
      const r=img.getBoundingClientRect();
      return {id:img.dataset.rebuloVisibleBatch1,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,background:img.style.backgroundImage,position:img.style.backgroundPosition};
    });
    const rebus=document.querySelector('#creatorRebus')?.getBoundingClientRect();
    const session=document.querySelector('.session-dock');
    return {
      pieceCount:pieces.length,
      pieceTexts:pieces.map(node=>node.textContent?.trim()||''),
      batch,
      viewport,
      rebus:rebus?{left:rebus.left,right:rebus.right,top:rebus.top,bottom:rebus.bottom,width:rebus.width,height:rebus.height}:null,
      sessionDisplay:session?getComputedStyle(session).display:'missing',
      feedback:document.querySelector('#creatorFeedback')?.textContent?.trim()||'',
      proof:document.querySelector('#phoneticProof')?.textContent?.trim()||''
    };
  });
}

function assertVisibleBatch(data,expected=[]){
  for(const id of expected)assert.ok(data.batch.some(row=>row.id===id),`expected visible batch asset ${id}`);
  for(const row of data.batch){
    assert.ok(row.width>=70&&row.height>=70,`${row.id} should be large enough; got ${row.width}x${row.height}`);
    assert.ok(row.left>=0&&row.right<=data.viewport.width+1,`${row.id} should remain inside viewport horizontally`);
    assert.ok(row.top>=0&&row.bottom<=data.viewport.height+1,`${row.id} should remain inside viewport vertically`);
    assert.match(row.background,/sprite\.svg/);
  }
  assert.equal(data.sessionDisplay,'none','session dock should not compete with a visible created rebus');
  assert.ok(data.rebus&&data.rebus.left>=0&&data.rebus.right<=data.viewport.width+1,'rebus surface must fit viewport width');
}

try{
  const mobile=await prepare({width:390,height:844},true);
  await openCreate(mobile.page,'word');
  for(const [key,value,expected] of [
    ['pili','pili',['pie','lit']],
    ['merci','merci',['mer','scie']],
    ['papa','papa',[]]
  ]){
    await submit(mobile.page,value);
    const data=await snapshot(mobile.page);assertVisibleBatch(data,expected);report.cases[`mobile-${key}`]=data;
    await mobile.page.screenshot({path:`visible-batch1-mobile-${key}.png`,fullPage:false});
  }

  await openCreate(mobile.page,'phrase');
  const phraseCases=[
    ['merci-papa','merci papa',['mer','scie']],
    ['ranger-maison','ranger la maison',[]],
    ['chien-train','Le chien regarde le train',['chien','train']],
    ['bebe-porte','Le bébé ouvre la porte',['bebe','porte']]
  ];
  for(const [key,value,expected] of phraseCases){
    await submit(mobile.page,value);
    const data=await snapshot(mobile.page);assert.ok(data.pieceCount>0,`${value} must render at least one rebus piece`);assertVisibleBatch(data,expected);report.cases[`mobile-${key}`]=data;
    await mobile.page.screenshot({path:`visible-batch1-mobile-${key}.png`,fullPage:false});
  }
  await mobile.context.close();

  const desktop=await prepare({width:1280,height:900},false);
  await openCreate(desktop.page,'word');
  await submit(desktop.page,'pili');
  const desktopPili=await snapshot(desktop.page);assertVisibleBatch(desktopPili,['pie','lit']);report.cases['desktop-pili']=desktopPili;
  await desktop.page.screenshot({path:'visible-batch1-desktop-pili.png',fullPage:false});
  await openCreate(desktop.page,'phrase');
  await submit(desktop.page,'Le chien regarde le train');
  const desktopPhrase=await snapshot(desktop.page);assertVisibleBatch(desktopPhrase,['chien','train']);report.cases['desktop-chien-train']=desktopPhrase;
  await desktop.page.screenshot({path:'visible-batch1-desktop-chien-train.png',fullPage:false});
  await desktop.context.close();

  assert.equal(report.errors.length,0,report.errors.join('\n'));
  await writeFile(output,JSON.stringify(report,null,2));
  console.log(JSON.stringify({cases:Object.keys(report.cases),batchImageCounts:Object.fromEntries(Object.entries(report.cases).map(([key,value])=>[key,value.batch.length]))}));
  await browser.close();
}catch(error){
  report.errors.push(String(error?.stack||error));
  await writeFile(output,JSON.stringify(report,null,2));
  console.error(error);
  try{await browser.close();}catch{}
  process.exit(1);
}
