import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const out = new URL('../visual-output/', import.meta.url);
await fs.mkdir(out, { recursive: true });

const targets=[{name:'mobile-375',width:375,height:812},{name:'mobile-390',width:390,height:844},{name:'tablet',width:768,height:1024},{name:'desktop',width:1440,height:900}];
const versions=[{name:'before-main',url:'http://127.0.0.1:4174'},{name:'after-pr275',url:'http://127.0.0.1:4173'}];

async function reset(page,url,viewport){await page.setViewportSize(viewport);await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(350);}
async function shot(page,label){await page.screenshot({path:new URL(`${label}.png`,out).pathname,fullPage:true});}
async function selectProfile(page,profile){const b=page.locator(`#difficultyProfiles [data-profile="${profile}"]`);await b.waitFor({state:'visible'});await b.click();await page.waitForTimeout(220);}
async function switchCreate(page,kind='word'){
  await page.locator('#createMode').click();
  const b=page.locator(`.search-zone .creator-kind button[data-creator-kind="${kind}"]`).first();await b.click();
}
async function installWordFixture(page){
  await switchCreate(page,'word');
  await page.evaluate(()=>{
    const shell=document.querySelector('.app-shell');shell.dataset.creatorReady='true';
    const result=document.querySelector('#result');result.hidden=false;result.dataset.sheetMode='pro';
    document.querySelector('#resultWord').textContent='merci';document.querySelector('#resultLabel').textContent='Rébus exact créé';
    document.querySelector('#sheetInstruction').textContent='Nomme les images puis assemble les sons.';
    document.querySelector('#creatorRebus').className='rebus-row';
    document.querySelector('#creatorRebus').innerHTML='<div class="piece"><img src="assets/rebus/mer.svg" alt=""><span>mer</span></div><span class="plus">+</span><div class="piece"><img src="assets/rebus/scie.svg" alt=""><span>scie</span></div>';
    document.querySelector('#phoneticProof').textContent='/mɛʁ/ + /si/ → /mɛʁsi/';
  });
  await page.waitForTimeout(120);
}
async function installPhraseFixture(page,partial=false){
  await switchCreate(page,'phrase');
  await page.evaluate((isPartial)=>{
    const shell=document.querySelector('.app-shell');shell.dataset.creatorReady='true';
    const result=document.querySelector('#result');result.hidden=false;result.dataset.sheetMode='pro';
    document.querySelector('#resultWord').textContent=isPartial?'merci …':'merci cinéma';document.querySelector('#resultLabel').textContent=isPartial?'Phrase partiellement couverte':'Phrase en rébus';
    document.querySelector('#sheetInstruction').textContent=isPartial?'Les sons connus restent visibles. Le segment manquant est signalé.':'Lis les pièces de gauche à droite.';
    const row=document.querySelector('#creatorRebus');row.className='rebus-row phrase-flow';
    row.innerHTML='<div class="piece"><img src="assets/rebus/mer.svg" alt=""><span>mer</span></div><div class="piece"><img src="assets/rebus/scie.svg" alt=""><span>scie</span></div>'+(isPartial?'<span class="phrase-sound-gap">segment non couvert</span>':'<div class="piece"><img src="assets/rebus/scie.svg" alt=""><span>scie</span></div><div class="piece"><img src="assets/rebus/nez.svg" alt=""><span>nez</span></div><div class="piece"><img src="assets/rebus/mat.svg" alt=""><span>mât</span></div>');
    document.querySelector('#phoneticProof').textContent=isPartial?'Couverture partielle — aucune exactitude ajoutée.':'Assemblage phonétique affiché côté adulte.';
  },partial);
  await page.waitForTimeout(120);
}
async function installConventionFixture(page){
  await page.evaluate(()=>{
    const row=document.querySelector('#playRebus');
    row.innerHTML='<div class="piece play-piece"><img src="assets/rebus/scie.svg" alt=""></div><div class="piece play-piece play-convention-piece play-grapheme"><strong class="play-convention-symbol">R</strong></div><div class="piece play-piece play-convention-piece play-number"><strong class="play-convention-symbol">2</strong></div><div class="piece play-piece play-convention-piece play-music_note"><strong class="play-convention-symbol">♪</strong></div>';
  });
}

const browser=await chromium.launch({headless:true});
for(const version of versions){
  const context=await browser.newContext({locale:'fr-FR',colorScheme:'light'});const page=await context.newPage();page.setDefaultTimeout(30000);
  for(const viewport of targets){
    await reset(page,version.url,viewport);
    await selectProfile(page,'discovery');await shot(page,`${version.name}-${viewport.name}-play-discovery`);
    if(viewport.name==='mobile-390'||viewport.name==='desktop'){await selectProfile(page,'expert');await shot(page,`${version.name}-${viewport.name}-play-expert`);await installConventionFixture(page);await shot(page,`${version.name}-${viewport.name}-play-mixed-conventions`);}
    if(viewport.name==='mobile-375'||viewport.name==='desktop'){
      await installWordFixture(page);await shot(page,`${version.name}-${viewport.name}-create-word`);
      await installPhraseFixture(page,false);await shot(page,`${version.name}-${viewport.name}-create-phrase-multi`);
      await installPhraseFixture(page,true);await shot(page,`${version.name}-${viewport.name}-create-phrase-partial`);
    }
    if(viewport.name==='mobile-375'){
      await page.locator('#playMode').click();await page.locator('#playAnswer').focus();await page.evaluate(()=>document.body.classList.add('keyboard-open'));await page.setViewportSize({width:375,height:520});await page.waitForTimeout(150);await shot(page,`${version.name}-mobile-375-keyboard-open`);
    }
  }
  await context.close();
}
await browser.close();
