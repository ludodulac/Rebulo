import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';

const js=await readFile(new URL('../naming-test.js',import.meta.url),'utf8');
const research=JSON.parse(await readFile(new URL('../data/pictogram-prototype-comparisons.json',import.meta.url),'utf8'));
const production=JSON.parse(await readFile(new URL('../data/production-naming-reviews.json',import.meta.url),'utf8'));

assert.match(js,/function protocolKey\(scope,item\)\{return `\$\{scope\}:\$\{item\.concept\}:\$\{item\.revision\}`;\}/,'protocol selection must distinguish scope, concept and revision');
assert.match(js,/protocols\.find\(item=>item\.key===els\.concept\.value\)/,'start must select the exact protocol key rather than first matching concept');
assert.match(js,/option\.value=item\.key/,'setup options must carry the exact protocol key');
assert.match(js,/badge\.textContent='Stimulus visuel'/,'trial must stay blind after routing changes');
assert.doesNotMatch(js,/badge\.textContent\s*=\s*activeComparison\.concept/,'trial must never reveal the concept');

for(const concept of ['pot','dos','raie','tas','terre']){
  const researchProtocol=research.comparisons.find(item=>item.concept===concept);
  const productionProtocol=production.reviews.find(item=>item.concept===concept);
  assert.ok(researchProtocol,`${concept} research protocol should exist`);
  assert.ok(productionProtocol,`${concept} production review should exist separately`);
  assert.notEqual(researchProtocol.revision,productionProtocol.revision,`${concept} production evidence must stay revision-distinct from research evidence`);
  assert.equal(researchProtocol.activationState,'inactive_until_human_decision');
  assert.equal(productionProtocol.activationState,'active_general_naming_review');
  assert.equal(productionProtocol.automaticActivation,false);
  assert.equal(productionProtocol.humanDecision,null);
  assert.equal(productionProtocol.candidates.length,1);
  assert.equal(productionProtocol.candidates[0].namingTestStatus,'not_run');
  await access(new URL(`../${productionProtocol.candidates[0].asset}`,import.meta.url));
}

assert.equal(production.reviews.length,24,'every active production pictogram should have one revision-bound naming review');
assert.equal(new Set(production.reviews.map(item=>`${item.concept}:${item.revision}`)).size,24,'production naming review concept/revision pairs must be unique');
console.log('naming protocol routing: research and production revisions are uniquely selectable while the trial remains blind.');
