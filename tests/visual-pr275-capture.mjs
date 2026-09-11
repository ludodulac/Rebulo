import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const out = new URL('../visual-output/', import.meta.url);
await fs.mkdir(out, { recursive: true });

const targets = [
  {name:'mobile-375', width:375, height:812},
  {name:'mobile-390', width:390, height:844},
  {name:'tablet', width:768, height:1024},
  {name:'desktop', width:1440, height:900},
];

const versions = [
  {name:'before-main', url:'http://127.0.0.1:4174'},
  {name:'after-pr275', url:'http://127.0.0.1:4173'},
];

async function settle(page){
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(350);
}

async function reset(page, url, viewport){
  await page.setViewportSize(viewport);
  await page.goto(url, {waitUntil:'networkidle'});
  await page.evaluate(() => localStorage.clear());
  await page.reload({waitUntil:'networkidle'});
  await settle(page);
}

async function shot(page, label){
  await page.screenshot({path: new URL(`${label}.png`, out).pathname, fullPage:true});
}

async function selectProfile(page, profile){
  const button = page.locator(`#difficultyProfiles [data-profile="${profile}"]`);
  await button.waitFor({state:'visible'});
  await button.click();
  await page.waitForTimeout(220);
}

async function chooseCreatorKind(page, kind){
  const control = page.locator(`.search-zone .creator-kind button[data-creator-kind="${kind}"]`).first();
  await control.waitFor({state:'visible'});
  await control.click();
}

async function createWord(page, word){
  await page.locator('#createMode').click();
  await chooseCreatorKind(page, 'word');
  await page.locator('#target').fill(word);
  await page.locator('#creatorForm button[type="submit"]').click();
  await page.waitForTimeout(500);
}

async function createPhrase(page, phrase){
  await page.locator('#createMode').click();
  await chooseCreatorKind(page, 'phrase');
  await page.locator('#target').fill(phrase);
  await page.locator('#creatorForm button[type="submit"]').click();
  await page.waitForTimeout(650);
}

const browser = await chromium.launch({headless:true});
for (const version of versions){
  const context = await browser.newContext({locale:'fr-FR', colorScheme:'light'});
  const page = await context.newPage();
  page.on('console', msg => { if(msg.type()==='error') console.log(`[${version.name}] console error: ${msg.text()}`); });

  for (const viewport of targets){
    await reset(page, version.url, viewport);

    await selectProfile(page, 'discovery');
    await shot(page, `${version.name}-${viewport.name}-play-discovery`);

    if(viewport.name==='mobile-390' || viewport.name==='desktop'){
      await selectProfile(page, 'expert');
      await shot(page, `${version.name}-${viewport.name}-play-expert`);
    }

    if(viewport.name==='mobile-375' || viewport.name==='desktop'){
      await createWord(page, 'cinéma');
      await shot(page, `${version.name}-${viewport.name}-create-word-cinema`);

      await createPhrase(page, 'merci cinéma');
      await shot(page, `${version.name}-${viewport.name}-create-phrase-multi`);

      await createPhrase(page, 'merci chocolat impossible');
      await shot(page, `${version.name}-${viewport.name}-create-phrase-partial`);
    }

    if(viewport.name==='mobile-375'){
      await page.locator('#playMode').click();
      await page.locator('#playAnswer').focus();
      await page.evaluate(() => document.body.classList.add('keyboard-open'));
      await page.setViewportSize({width:375,height:520});
      await page.waitForTimeout(120);
      await shot(page, `${version.name}-mobile-375-keyboard-open`);
    }
  }
  await context.close();
}
await browser.close();
