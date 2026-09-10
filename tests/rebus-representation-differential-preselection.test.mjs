import assert from 'node:assert/strict';
import {differentialPreselectionEvidence,buildDifferentialPreselection} from '../src/rebus-representation-differential-preselection.js';

const contrast={ipa:'ɛl',syllableSpans:[1],usefulTargetCount:12,usefulWeightedGain:30,curatedVisualHypothesisCount:0,twoSyllableFirstClass:false,registeredAssetCandidateCount:0,researchAssetLeadCandidateCount:0,visibleConventions:[],exactCandidates:[{word:'aile',pos:'NOM',noun:true,proofStatus:'lexical_exact_only'},{word:'elle',pos:'PRO',noun:false,proofStatus:'lexical_exact_only'},{word:'hèle',pos:'VER',noun:false,proofStatus:'lexical_exact_only'}]};
const evidence=differentialPreselectionEvidence(contrast);
assert.ok(evidence.signals.includes('multiple_exact_candidates'));
assert.ok(evidence.signals.includes('noun_vs_non_noun_contrast'));
assert.ok(evidence.signals.includes('function_like_vs_noun'));

const two={...contrast,ipa:'kɔ̃te',twoSyllableFirstClass:true,syllableSpans:[2],exactCandidates:[{word:'comté',pos:'NOM',noun:true,proofStatus:'lexical_exact_only'},{word:'compter',pos:'VER',noun:false,proofStatus:'lexical_exact_only'}]};
const asset={...contrast,ipa:'kyʁi',twoSyllableFirstClass:true,registeredAssetCandidateCount:1,exactCandidates:[{word:'curry',pos:'NOM',noun:true,proofStatus:'lexical_exact_only'}]};
const alreadyCurated={...contrast,ipa:'ni',curatedVisualHypothesisCount:1};
const selected=buildDifferentialPreselection([contrast,two,asset,alreadyCurated],{limit:2,twoSyllableReserve:2,minScore:1});
assert.equal(selected.some(row=>row.ipa==='ni'),false,'already curated sounds should not consume the next examination wave');
assert.equal(selected.filter(row=>row.twoSyllableFirstClass).length,2,'two-syllable reserve remains first-class');
assert.ok(selected.every(row=>row.visualDecision==='unknown'));
assert.ok(selected.every(row=>row.spontaneousNamingRisk==='unknown'));
assert.ok(selected.every(row=>row.humanNamingEvidence==='none'));
assert.ok(selected.every(row=>row.clinicalEvidence==='none'));
assert.ok(selected.every(row=>row.automaticActivation===false));
console.log('representation differential preselection: ok');
