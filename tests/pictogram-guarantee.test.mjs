import assert from 'node:assert/strict';
import {denominationCandidates,derivePictogramGuarantees,highestPictogramGuarantee,PICTOGRAM_GUARANTEE_LEVELS,pictogramGuaranteeRecord} from '../src/pictogram-guarantee.js';

const production={id:'tour',label:'tour',ipa:'/tuʁ/',image:'assets/rebus/tour.svg',active:true,artRevision:'tour-tower-v1',clinicalStatus:'naming_test_required'};
const review={concept:'tour',revision:'tour-tower-v1',targetIpa:'/tuʁ/',clinicalStatus:'naming_test_required',candidates:[{asset:'assets/rebus/tour.svg',namingRisks:['château','donjon','tour de château'],namingTestStatus:'not_run'}],humanDecision:null};

assert.deepEqual(derivePictogramGuarantees(production,review),[
  PICTOGRAM_GUARANTEE_LEVELS.GENERAL_ILLUSTRATION,
  PICTOGRAM_GUARANTEE_LEVELS.PHONETIC_STRUCTURED,
  PICTOGRAM_GUARANTEE_LEVELS.NAMING_REVIEW_PLANNED
]);
assert.equal(highestPictogramGuarantee(production,review),PICTOGRAM_GUARANTEE_LEVELS.NAMING_REVIEW_PLANNED);
const names=denominationCandidates(production,review);
assert.deepEqual(names.map(item=>item.label),['tour','château','donjon','tour de château']);
assert.ok(names.slice(1).every(item=>item.evidence==='declared_naming_risk'));
assert.ok(names.every(item=>item.population==='unspecified'));

const scheduled={...review,candidates:[{...review.candidates[0],namingTestStatus:'scheduled'}]};
assert.equal(highestPictogramGuarantee(production,scheduled),PICTOGRAM_GUARANTEE_LEVELS.NAMING_REVIEW_PLANNED);
const decidedWithoutCompletedTest={...scheduled,humanDecision:{decision:'prefer_candidate'}};
assert.equal(highestPictogramGuarantee(production,decidedWithoutCompletedTest),PICTOGRAM_GUARANTEE_LEVELS.NAMING_REVIEW_PLANNED);
const observed={...review,candidates:[{...review.candidates[0],namingTestStatus:'completed'}]};
assert.equal(highestPictogramGuarantee(production,observed),PICTOGRAM_GUARANTEE_LEVELS.HUMAN_OBSERVED);
const validated={...production,clinicalStatus:'validated'};
assert.equal(highestPictogramGuarantee(validated,observed),PICTOGRAM_GUARANTEE_LEVELS.CLINICALLY_VALIDATED);

const record=pictogramGuaranteeRecord(production,review);
assert.equal(record.active,true);
assert.equal(record.automaticClinicalClaim,false);
assert.equal(record.revision,'tour-tower-v1');
assert.equal(record.denominationCandidates.length,4);

const illustrationOnly={id:'prototype',label:'prototype',image:'assets/research/prototype.svg',active:false,strictEligible:false};
assert.deepEqual(derivePictogramGuarantees(illustrationOnly,null),[PICTOGRAM_GUARANTEE_LEVELS.GENERAL_ILLUSTRATION]);
console.log('pictogram guarantee model: explicit maturity and ambiguity without overclaiming');
