import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateNamingObservationExport,buildNamingObservationReview} from '../src/naming-observation-review.js';

const registry=JSON.parse(await readFile(new URL('../data/pictogram-prototype-comparisons.json',import.meta.url),'utf8'));
const comparisons=registry.comparisons.filter(item=>item.activationState==='inactive_until_human_decision');
const pot=comparisons.find(item=>item.concept==='pot');
assert.ok(pot);assert.equal(pot.candidates.length,4);
const ids=pot.candidates.map(item=>item.candidateId);

function session(sessionCode,responses){
  return {schemaVersion:'1.0',sessionCode,concept:'pot',targetIpa:pot.targetIpa,candidateIds:[...ids],observations:ids.map((candidateId,index)=>({candidateId,responseVerbatim:responses[index]?.response||'',hesitation:responses[index]?.hesitation===true,noResponse:responses[index]?.noResponse===true})),researchNotice:'Raw anonymous naming observations only. No automatic activation or clinical validation.'};
}

const s1=session('S01',[{response:'pot'},{response:'plante',hesitation:true},{noResponse:true},{response:'vase'}]);
const s2=session('S02',[{response:'Pot'},{response:'pot de fleurs'},{response:'terre'},{response:'vase',hesitation:true}]);
assert.ok(validateNamingObservationExport(s1,comparisons));
const review=buildNamingObservationReview([s1,s2],comparisons);
assert.ok(review);assert.equal(review.kind,'descriptive_naming_observation_review');assert.equal(review.sessionCount,2);assert.equal(review.concepts.length,1);
const potReview=review.concepts[0];assert.equal(potReview.concept,'pot');assert.equal(potReview.sessionCount,2);assert.equal(potReview.candidates.length,4);
const first=potReview.candidates.find(item=>item.candidateId===ids[0]);assert.equal(first.observationCount,2);assert.equal(first.targetResponseCount,2,'case-normalized exact concept matches should be counted descriptively');assert.deepEqual(first.responses,[{response:'pot',count:2}]);assert.equal(first.asset,pot.candidates[0].asset);assert.doesNotMatch(first.asset,/^https?:/,'review thumbnails must reuse audited local stimuli');
const second=potReview.candidates.find(item=>item.candidateId===ids[1]);assert.equal(second.hesitationCount,1);assert.equal(second.targetResponseCount,0);assert.equal(second.asset,pot.candidates[1].asset);
const third=potReview.candidates.find(item=>item.candidateId===ids[2]);assert.equal(third.noResponseCount,1);
const fourth=potReview.candidates.find(item=>item.candidateId===ids[3]);assert.deepEqual(fourth.responses,[{response:'vase',count:2}]);assert.equal(fourth.hesitationCount,1);
assert.match(review.researchNotice,/Descriptive counts/);assert.match(review.researchNotice,/No automatic prototype activation or clinical validation/);

assert.equal(buildNamingObservationReview([s1,s1],comparisons),null,'duplicate concept/session codes must be rejected');
assert.equal(validateNamingObservationExport({...s1,participantName:'Alice'},comparisons),null,'identity-like extra fields must be rejected');
assert.equal(validateNamingObservationExport({...s1,observations:s1.observations.slice(0,3)},comparisons),null,'incomplete sessions must be rejected');
assert.equal(validateNamingObservationExport({...s1,targetIpa:'/wrong/'},comparisons),null,'target IPA must match the registered comparison');
assert.equal(validateNamingObservationExport({...s1,candidateIds:[...ids.slice(1),ids[0]+'-unknown']},comparisons),null,'candidate set must match the current comparison');
assert.equal(validateNamingObservationExport({schemaVersion:'1.0',kind:'visual_research_curation',decisions:[]},comparisons),null,'visual curation files must not be treated as naming observations');
const badNoResponse={...s1,observations:s1.observations.map((item,index)=>index===2?{...item,noResponse:true,responseVerbatim:'pot'}:item)};
assert.equal(validateNamingObservationExport(badNoResponse,comparisons),null,'no-response observations cannot carry a verbal response');

const html=await readFile(new URL('../naming-review.html',import.meta.url),'utf8');
const js=await readFile(new URL('../naming-review.js',import.meta.url),'utf8');
const css=await readFile(new URL('../naming-review.css',import.meta.url),'utf8');
const namingHtml=await readFile(new URL('../naming-test.html',import.meta.url),'utf8');
assert.match(html,/Revue des passations/);assert.match(html,/Aucune validation automatique/);assert.match(html,/Aucun envoi serveur, aucune persistance navigateur/);assert.match(html,/multiple/);
assert.match(js,/buildNamingObservationReview/);assert.match(js,/candidate\.asset/);assert.match(js,/Prototype visuel correspondant aux observations/);assert.match(js,/Comptages descriptifs uniquement/);assert.match(css,/\.candidate-visual/);assert.doesNotMatch(js,/localStorage|sessionStorage|method\s*:\s*['"]POST/i);assert.doesNotMatch(js,/clinical_approved|active\s*[:=]\s*true/i);
assert.match(namingHtml,/naming-review\.html/);
console.log('naming observation review: strict anonymous imports, descriptive counts and local stimulus-linked cards only.');
