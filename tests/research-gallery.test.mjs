import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createResearchCuration,setResearchCurationDecision,researchCurationSummary,researchCurationExport} from '../src/research-curation-session.js';

const html=await readFile(new URL('../research-gallery.html',import.meta.url),'utf8');
const js=await readFile(new URL('../research-gallery.js',import.meta.url),'utf8');
const css=await readFile(new URL('../research-gallery.css',import.meta.url),'utf8');
const comparisons=JSON.parse(await readFile(new URL('../data/pictogram-prototype-comparisons.json',import.meta.url),'utf8'));
const namingHtml=await readFile(new URL('../naming-test.html',import.meta.url),'utf8');

assert.match(html,/Planche des prototypes/);
assert.match(html,/Recherche seulement/i);
assert.match(html,/garder \/ retravailler \/ écarter/i);
assert.match(html,/ni une réponse de dénomination, ni une validation clinique, ni une activation/i);
assert.match(html,/Exporter la curation JSON/);
assert.match(html,/Aperçu sans indices/);
assert.match(html,/data-blind-preview="false"/);
assert.match(html,/naming-test\.html/);
assert.match(js,/pictogram-prototype-comparisons\.json/);
assert.match(js,/Image indisponible — ne pas utiliser ce stimulus/);
assert.match(js,/researchCurationExport/);
assert.match(js,/function setBlindPreview\(enabled\)/);
assert.match(js,/concept, IPA, intentions, risques, provenance et curation sont masqués/);
assert.match(css,/data-blind-preview="true"[^}]*\.concept-heading/);
assert.match(css,/data-blind-preview="true"[^}]*\.card-body/);
assert.match(css,/data-blind-preview="true"[^}]*#exportCuration/);
assert.doesNotMatch(js,/localStorage|sessionStorage/,'visual curation should stay in memory until explicit export');
assert.doesNotMatch(js,/clinical_approved|active\s*[:=]\s*true/i);
assert.match(namingHtml,/research-gallery\.html/,'naming runner should link to the curator gallery');

const live=comparisons.comparisons.filter(item=>item.activationState==='inactive_until_human_decision');
assert.equal(live.length,5,'gallery should currently expose five research concepts');
assert.equal(live.reduce((sum,item)=>sum+item.candidates.length,0),20,'gallery should currently expose twenty stimuli');
for(const comparison of live){
  assert.equal(comparison.candidates.length,4,`${comparison.concept} should have four gallery candidates`);
  for(const candidate of comparison.candidates){
    assert.ok(candidate.designIntent);
    assert.ok(candidate.provenance);
    assert.ok(candidate.namingRisks.length>0);
    assert.doesNotMatch(candidate.asset,/^https?:/,'all active naming stimuli should now be served locally');
    await access(new URL(`../${candidate.asset}`,import.meta.url));
  }
}

let curation=createResearchCuration({comparisons:live});
assert.equal(curation.items.length,20);
assert.deepEqual(researchCurationSummary(curation),{keep:0,rework:0,reject:0,unreviewed:20});
curation=setResearchCurationDecision(curation,curation.items[0].candidateId,'keep','lisible au premier coup d’œil');
curation=setResearchCurationDecision(curation,curation.items[1].candidateId,'rework','simplifier la silhouette');
curation=setResearchCurationDecision(curation,curation.items[2].candidateId,'reject','trop ambigu');
assert.deepEqual(researchCurationSummary(curation),{keep:1,rework:1,reject:1,unreviewed:17});
assert.equal(setResearchCurationDecision(curation,curation.items[3].candidateId,'clinical_approved','nope'),null,'curation must reject clinical-looking decisions');
const exported=researchCurationExport(curation);
assert.equal(exported.kind,'visual_research_curation');
assert.equal(exported.decisions.length,3);
assert.match(exported.researchNotice,/Not naming-test evidence, not clinical validation, and not an activation decision/);
assert.equal('targetResponseFrequency' in exported,false);
assert.equal('humanDecision' in exported,false);

console.log('research gallery: twenty local stimuli, blind preview and separate visual-design curation guardrails ok');
