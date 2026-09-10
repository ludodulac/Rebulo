import assert from 'node:assert/strict';
import fs from 'node:fs';

const batch=JSON.parse(fs.readFileSync('data/rebus-representation-comparative-batch.json','utf8'));
assert.equal(batch.status,'research_only');
assert.equal(batch.policy.noAutomaticReliableScore,true);
assert.equal(batch.policy.humanObservationRequiredForNamability,true);
assert.equal(batch.policy.clinicalValidationNeverInferred,true);
assert.equal(batch.batchDecision,'compare_before_generalize');

const byId=new Map(batch.cases.map(item=>[item.caseId,item]));
for(const item of batch.cases){
  assert.ok(item.targetIpa);
  assert.ok(item.lexicalCandidate);
  assert.ok(item.representationType);
  assert.ok(item.whyThisRoute);
  assert.ok(item.nextDecision);
  assert.ok(Array.isArray(item.proofStatus)&&item.proofStatus.length>=3);
  assert.ok(item.namingRisk.startsWith('unknown'),`${item.caseId} must not claim human naming evidence`);
  assert.equal(item.proofStatus.some(status=>status==='clinical_validated'),false);
}

const nid=byId.get('specific-existing-nid');
assert.equal(nid.asset.exists,true);
assert.equal(nid.asset.path,'assets/research/nid-comic-v1.svg');
assert.equal(fs.existsSync(nid.asset.path),true,'the comparison must inspect a real existing nid asset');
assert.ok(nid.asset.observedFeatures.includes('single central object'));
assert.ok(nid.proofStatus.includes('namability_unverified'));

const cou=byId.get('ambiguous-anatomy-cou');
assert.equal(cou.phoneticRelation,'exact');
assert.equal(cou.asset.exists,false);
assert.equal(cou.predictiveProperties.cueNeed,'likely_compare_none_vs_pointer');

const compas=byId.get('long-window-compas');
assert.equal(compas.targetIpa,'kɔ̃pa');
assert.ok(compas.proofStatus.includes('two_syllable_window'));
assert.equal(batch.policy.longWindowsRemainCompetitive,true);

const visible=byId.get('visible-convention-a');
assert.equal(visible.representationType,'spoken_letter_name');
assert.ok(visible.proofStatus.includes('visible_convention_general_mode'));
assert.ok(visible.proofStatus.includes('pictogram_route_rejected'));

const approximation=byId.get('playful-approximation-lait-les');
assert.equal(approximation.targetIpa,'le');
assert.equal(approximation.sourceIpa,'lɛ');
assert.equal(approximation.phoneticRelation,'approximate');
assert.ok(approximation.proofStatus.includes('strict_ineligible'));
assert.ok(!approximation.proofStatus.includes('phonetic_exact'));

const boue=byId.get('material-boue');
assert.equal(boue.phoneticRelation,'exact');
assert.equal(boue.predictiveProperties.objectSpecificity,'low_to_medium_observed_concept');

console.log('comparative representation batch: diversified profiles, unknown naming evidence, strict proof separation and real nid asset');
