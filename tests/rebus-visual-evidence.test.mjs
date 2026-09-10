import assert from 'node:assert/strict';
import {buildVisualEvidenceIndex,summarizeVisualEvidence,visualEvidenceForRepresentation} from '../src/rebus-visual-evidence.js';

const seed=[{label:'chat',image:'assets/chat.svg',visualConfidence:0.98,labelStability:0.97,clinicalStatus:'naming_test_required',artRevision:'chat-v1'}];
const open=[{label:'chat',image:'assets/chat.svg',visualConfidence:0.7,labelStability:0.7,clinicalStatus:'unreviewed'},{label:'rat',image:'assets/rat.svg',visualConfidence:0.95,labelStability:0.96}];
const namingReviews={reviews:[
  {concept:'chat',revision:'chat-v1',clinicalStatus:'naming_test_required',humanDecision:null,candidates:[{asset:'assets/chat.svg',namingTestStatus:'not_run',namingRisks:['chaton']}]},
  {concept:'rat',revision:'rat-v2',clinicalStatus:'general_reviewed',humanDecision:'approved',candidates:[{asset:'assets/rat.svg',namingTestStatus:'completed',namingRisks:['souris']}]}
]};
const index=buildVisualEvidenceIndex({seed,openPictograms:open,namingReviews});
const chat=visualEvidenceForRepresentation({label:'chat',image:'assets/chat.svg'},index);
assert.equal(chat.visualEvidence.visualConfidence,0.98,'production seed metadata must take precedence over duplicate open-library metadata');
assert.equal(chat.visualEvidence.labelStability,0.97);
assert.equal(chat.visualEvidence.namingTestStatus,'not_run');
assert.equal(chat.visualEvidence.namingValidated,false,'design metadata must never imply human naming validation');
assert.deepEqual(chat.visualEvidence.namingRisks,['chaton']);

const rat=visualEvidenceForRepresentation({label:'rat',image:'assets/rat.svg'},index);
assert.equal(rat.visualEvidence.namingTestStatus,'completed');
assert.equal(rat.visualEvidence.namingValidated,true,'completed review plus explicit approval can become naming evidence');
assert.equal(rat.visualEvidence.visualConfidence,0.95);

const unknown=visualEvidenceForRepresentation({label:'x',image:'assets/x.svg'},index);
assert.equal(unknown.visualEvidence.status,'metadata_missing');
assert.equal(unknown.visualEvidence.namingValidated,false);

const summary=summarizeVisualEvidence([chat,rat,unknown]);
assert.equal(summary.imageCount,3);
assert.equal(summary.metadataAvailableCount,2);
assert.equal(summary.strongDesignMetadataCount,2);
assert.equal(summary.namingReviewPendingCount,2,'unknown and explicitly not-run assets remain pending');
assert.equal(summary.namingValidatedCount,1);

console.log('rebus-visual-evidence.test.mjs: visual design scores remain separate from explicit human naming evidence');
