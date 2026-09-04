import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createNamingSession,recordNamingObservation,namingSessionExport,orderedCandidates} from '../src/naming-test-session.js';

const comparison={concept:'dos',revision:'dos-v1',targetIpa:'/do/',activationState:'inactive_until_human_decision',candidates:[{candidateId:'dos-a',asset:'a.svg'},{candidateId:'dos-b',asset:'b.svg'}]};
assert.deepEqual(orderedCandidates(comparison.candidates,'forward').map(x=>x.candidateId),['dos-a','dos-b']);
assert.deepEqual(orderedCandidates(comparison.candidates,'reverse').map(x=>x.candidateId),['dos-b','dos-a']);
assert.deepEqual(orderedCandidates(comparison.candidates,'random',()=>0).map(x=>x.candidateId),['dos-b','dos-a']);

const session=createNamingSession(comparison,{sessionCode:' S 01! ',orderMode:'forward'});
assert.ok(session);assert.equal(session.sessionCode,'S01');assert.equal(session.comparisonRevision,'dos-v1');assert.deepEqual(session.candidateIds,['dos-a','dos-b']);assert.deepEqual(session.observations,[]);assert.equal(createNamingSession(comparison,{sessionCode:''}),null);assert.equal(createNamingSession({...comparison,revision:''},{sessionCode:'S02'}),null,'a passation must be tied to an explicit comparison revision');
let updated=recordNamingObservation(session,comparison.candidates[0],{responseVerbatim:'dos',hesitation:false,noResponse:false});
assert.ok(updated);assert.deepEqual(updated.observations[0],{candidateId:'dos-a',responseVerbatim:'dos',hesitation:false,noResponse:false});
updated=recordNamingObservation(updated,comparison.candidates[1],{responseVerbatim:'',hesitation:true,noResponse:true});
assert.equal(updated.observations[1].responseVerbatim,'');assert.equal(updated.observations[1].hesitation,true);assert.equal(updated.observations[1].noResponse,true);assert.equal(recordNamingObservation(session,comparison.candidates[0],{responseVerbatim:'   '}),null);

const exported=namingSessionExport(updated);
assert.equal(exported.sessionCode,'S01');assert.equal(exported.comparisonRevision,'dos-v1');assert.equal(exported.observations.length,2);assert.match(exported.researchNotice,/No automatic activation or clinical validation/);assert.equal('startedAt' in exported,false);assert.equal('participantName' in exported,false);assert.equal(namingSessionExport({...updated,comparisonRevision:''}),null);

const html=await readFile(new URL('../naming-test.html',import.meta.url),'utf8');
const js=await readFile(new URL('../naming-test.js',import.meta.url),'utf8');
const registry=JSON.parse(await readFile(new URL('../data/pictogram-prototype-comparisons.json',import.meta.url),'utf8'));
assert.match(html,/local uniquement/i);assert.match(html,/Aucun nom, âge, diagnostic/i);assert.match(html,/première réponse spontanée/i);assert.match(html,/ni une validation clinique ni une décision d’activation/i);
assert.match(js,/pictogram-prototype-comparisons\.json/);assert.match(js,/badge\.textContent='Prototype visuel'/);assert.doesNotMatch(js,/badge\.textContent\s*=\s*activeComparison\.concept/);
assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\([^)]*method\s*:\s*['"]POST/i);assert.doesNotMatch(js,/clinical_approved|active\s*[:=]\s*true/i);
assert.match(js,/image\.onload=.*setTrialEnabled\(true\)/s,'response controls must unlock only after image load');
assert.match(js,/image\.onerror=.*setTrialEnabled\(false\)/s,'image failure must keep response controls locked');
assert.match(js,/Stimulus indisponible\. N’enregistre aucune réponse/,'failure state must explicitly forbid response capture');
assert.match(js,/if\(!stimulusReady\).*Le stimulus doit être visible avant d’enregistrer une réponse/s,'submit must guard against hidden or failed stimuli');
assert.match(js,/révision \$\{activeSession\.comparisonRevision\}/,'revision may be shown only after the trial sequence is complete');
assert.match(js,/rebulo-naming-\$\{payload\.concept\}-\$\{payload\.comparisonRevision\}-\$\{payload\.sessionCode\}\.json/,'export filename must identify the exact comparison revision');

for(const conceptName of ['pot','dos','raie','tas','terre']){
  const liveComparison=registry.comparisons.find(item=>item.concept===conceptName);assert.ok(liveComparison);assert.match(liveComparison.revision,new RegExp(`^${conceptName}-v[1-9][0-9]*$`));assert.equal(liveComparison.candidates.length,4);
  for(const candidate of liveComparison.candidates){assert.doesNotMatch(candidate.asset,/\/image\/\d+\.html|\/library\/emoji-/);if(!/^https?:/.test(candidate.asset))await access(new URL(`../${candidate.asset}`,import.meta.url));}
}
const dos=registry.comparisons.find(item=>item.concept==='dos');assert.ok(dos.candidates.some(candidate=>candidate.asset==='assets/research/dos-openmoji-backache-e321.svg'));

console.log('naming test runner: neutral trials, revision-stamped exports, twenty stimuli and failed-image capture guardrails ok');
