import assert from 'node:assert/strict';
import {runnerEligibleResearchCandidate,runnerEligibleResearchConcept,runnerEligibleResearchConcepts} from '../src/pictogram-research-curation.js';

const good={candidateId:'c1',previewAsset:'https://example.org/c1.svg',sourcePage:'https://example.org/source',license:'CC0',sourceLabel:'candidate one',namingRisks:['x','y'],runnerReady:true};
assert.equal(runnerEligibleResearchCandidate(good),true);
assert.equal(runnerEligibleResearchCandidate({...good,runnerReady:false}),false);
assert.equal(runnerEligibleResearchCandidate({...good,previewAsset:'https://example.org/page.html'}),false);
assert.equal(runnerEligibleResearchCandidate({...good,sourcePage:''}),false);
assert.equal(runnerEligibleResearchCandidate({...good,license:''}),false);

const concept={concept:'raie',targetIpa:'/ʁɛ/',activationState:'research_only',candidates:[good,{...good,candidateId:'c2',previewAsset:'assets/research/c2.png'}]};
const promoted=runnerEligibleResearchConcept(concept);
assert.ok(promoted);
assert.equal(promoted.activationState,'inactive_until_human_decision');
assert.equal(promoted.candidates.length,2);
assert.equal(promoted.humanDecision,null);
assert.ok(promoted.candidates.every(candidate=>candidate.namingTestStatus==='not_run'));
assert.ok(promoted.candidates.every(candidate=>candidate.availability==='available'));
assert.equal(runnerEligibleResearchConcept({...concept,candidates:[good]}),null,'at least two reviewed stimuli are required');
assert.equal(runnerEligibleResearchConcept({...concept,activationState:'active'}),null,'active concepts must never pass through research promotion');

const bank={concepts:[concept,{...concept,concept:'tas',candidates:[good]}]};
assert.deepEqual(runnerEligibleResearchConcepts(bank).map(item=>item.concept),['raie']);

console.log('pictogram research curation: explicit review and two-stimulus gate ok');
