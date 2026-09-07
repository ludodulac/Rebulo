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
const productionRegistry=JSON.parse(await readFile(new URL('../data/production-naming-reviews.json',import.meta.url),'utf8'));
const seed=JSON.parse(await readFile(new URL('../data/lexicon-seed.json',import.meta.url),'utf8'));
const assetSources=JSON.parse(await readFile(new URL('../data/asset-sources.json',import.meta.url),'utf8'));
assert.match(html,/local uniquement/i);assert.match(html,/Ne saisis aucun nom, âge ou diagnostic/i);assert.match(html,/première réponse spontanée/i);assert.match(html,/Lancer le test/);assert.match(html,/Télécharger les réponses/);assert.match(html,/stimuli du protocole dans un ordre aléatoire quand il y en a plusieurs/i);
assert.doesNotMatch(html,/mélange les 4 images/i,'runner copy must not assume every revision has four stimuli');
assert.doesNotMatch(html,/Code anonyme de session|Ordre des prototypes|name="orderMode"/,'manual session and ordering controls should stay out of the simple flow');
assert.match(js,/pictogram-prototype-comparisons\.json/);assert.match(js,/production-naming-reviews\.json/);assert.match(js,/badge\.textContent='Stimulus visuel'/);assert.doesNotMatch(js,/badge\.textContent\s*=\s*activeComparison\.concept/);
assert.match(js,/function anonymousSessionCode\(\)/);assert.match(js,/sessionCode:anonymousSessionCode\(\),orderMode:'random'/,'session code and random order must be automatic');
assert.doesNotMatch(js,/sessionCode\.value|input\[name="orderMode"\]/,'simple flow must not depend on manual setup fields');
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
const nid=registry.comparisons.find(item=>item.concept==='nid');assert.ok(nid);assert.equal(nid.revision,'nid-v1');assert.equal(nid.candidates.length,1);await access(new URL(`../${nid.candidates[0].asset}`,import.meta.url));
const pluie=productionRegistry.reviews.find(item=>item.concept==='pluie');assert.ok(pluie);assert.equal(pluie.revision,'pluie-openmoji-1f327-v1');assert.equal(pluie.activationState,'active_general_naming_review');assert.equal(pluie.automaticActivation,false);assert.equal(pluie.candidates.length,1);assert.deepEqual(pluie.candidates[0].namingRisks,['nuage','nuage de pluie','mauvais temps']);await access(new URL(`../${pluie.candidates[0].asset}`,import.meta.url));
const cle=productionRegistry.reviews.find(item=>item.concept==='clé');assert.ok(cle);assert.equal(cle.revision,'cle-openmoji-1f511-v1');assert.equal(cle.targetIpa,'/kle/');assert.equal(cle.activationState,'active_general_naming_review');assert.equal(cle.automaticActivation,false);assert.equal(cle.candidates.length,1);assert.ok(cle.candidates[0].namingRisks.includes('clef'));assert.match(cle.candidates[0].reviewNote,/variante orthographique/);await access(new URL(`../${cle.candidates[0].asset}`,import.meta.url));
const cleSeed=seed.find(item=>item.id==='cle');assert.ok(cleSeed);assert.equal(cleSeed.artRevision,'cle-openmoji-1f511-v1');assert.equal(cleSeed.clinicalStatus,'naming_test_required');assert.equal(cleSeed.active,true);
const cleSource=assetSources.assets.find(item=>item.path==='assets/rebus/cle.svg');assert.ok(cleSource);assert.equal(cleSource.artRevision,'cle-openmoji-1f511-v1');assert.equal(cleSource.clinicalStatus,'naming_test_required');assert.equal(cleSource.active,true);
const dos=registry.comparisons.find(item=>item.concept==='dos');assert.ok(dos.candidates.some(candidate=>candidate.asset==='assets/research/dos-openmoji-backache-e321.svg'));

console.log('naming test runner: inactive prototypes plus pluie and clé production reviews stay revision-bound, anonymous and non-clinical.');
