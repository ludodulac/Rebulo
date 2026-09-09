import assert from 'node:assert/strict';
import {buildWholeWordCandidateIndex,wholeWordRepresentationCandidates} from '../src/syllable-representation-candidates.js';
import {buildSoundVisualCurationRegistry,visualCurationForSound,validateSoundVisualCuration} from '../src/rebus-sound-visual-curation.js';

const entries=[
  {word:'nid',lemma:'nid',ipa:'ni',pos:'NOM',frequency:10,syllableCount:1},
  {word:'nie',lemma:'nier',ipa:'ni',pos:'VER',frequency:5,syllableCount:1},
  {word:'ha',lemma:'ha',ipa:'a',pos:'NOM',frequency:3,syllableCount:1}
];
const index=buildWholeWordCandidateIndex(entries);
const dataset={entries:[
  {ipa:'ni',candidate:'nid',decision:'prototype_candidate',visualConcept:'Un nid isolé',nextGate:'prototype_then_naming_test'},
  {ipa:'a',candidate:'ha',decision:'reject_candidate',reason:'not spontaneously nameable'}
]};
const validation=validateSoundVisualCuration(dataset,index);
assert.equal(validation.valid,true,validation.errors.join('\n'));

const registry=buildSoundVisualCurationRegistry(dataset);
const ni=visualCurationForSound('ni',wholeWordRepresentationCandidates('ni',index,8),registry);
assert.equal(ni.prototypeCandidates[0].word,'nid');
assert.equal(ni.eligibleCandidates[0].word,'nid');
assert.equal(ni.annotated.find(item=>item.word==='nie').visualCuration,'unreviewed');

const a=visualCurationForSound('a',wholeWordRepresentationCandidates('a',index,8),registry);
assert.equal(a.rejectedCandidates[0].word,'ha');
assert.equal(a.eligibleCandidates.some(item=>item.word==='ha'),false,'rejected visual route must leave the sound open while removing that candidate from the image queue');

const invalid=validateSoundVisualCuration({entries:[{ipa:'ni',candidate:'imaginaire',decision:'prototype_candidate',visualConcept:'x'}]},index);
assert.equal(invalid.valid,false);
assert.match(invalid.errors.join('\n'),/n'est pas attesté/);

console.log('rebus sound visual curation: exact lexical evidence, prototype promotion and candidate-level rejection');
