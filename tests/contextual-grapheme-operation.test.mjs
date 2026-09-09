import assert from 'node:assert/strict';
import {contextualGraphemeRule,validateContextualGraphemeEvidence,buildContextualGraphemeOperation,canInferContextualGraphemeWithoutLexicalEvidence} from '../src/contextual-grapheme-operation.js';

assert.equal(contextualGraphemeRule('TR').ipa,'tʁ');
assert.equal(contextualGraphemeRule('TION').ipa,'sjɔ̃');
assert.equal(contextualGraphemeRule('SION').ipa,'sjɔ̃');
assert.equal(contextualGraphemeRule('MENT').ipa,'mɑ̃');
assert.equal(contextualGraphemeRule('IN'),null,'IN must stay unsupported until grapheme-to-phoneme alignment exists');
assert.equal(contextualGraphemeRule('UN'),null,'UN must stay unsupported until grapheme-to-phoneme alignment exists');
assert.equal(canInferContextualGraphemeWithoutLexicalEvidence(),false);

const train=validateContextualGraphemeEvidence({grapheme:'TR',sourceWord:'train',sourceIpa:'/tʁɛ̃/',segmentIpa:'/tʁ/'});
assert.equal(train.ok,true);assert.equal(train.reason,'exact_prefix_word_and_ipa_evidence');
const travail=buildContextualGraphemeOperation({grapheme:'TR',sourceWord:'travail',sourceIpa:'/tʁavaj/',segmentIpa:'/tʁ/'});
assert.ok(travail);assert.equal(travail.context,'prefix_exact_word_and_ipa_evidence');assert.equal(travail.operationType,'contextual_grapheme');
assert.equal(buildContextualGraphemeOperation({grapheme:'TR',sourceWord:'autre',sourceIpa:'/otʁ/',segmentIpa:'/tʁ/'}),null,'internal TR must remain blocked without grapheme-to-phoneme alignment');
assert.equal(buildContextualGraphemeOperation({grapheme:'TR',sourceWord:'train',sourceIpa:'/dʁɛ̃/',segmentIpa:'/tʁ/'}),null,'orthographic TR cannot override mismatching source IPA');

const nation=validateContextualGraphemeEvidence({grapheme:'TION',sourceWord:'nation',sourceIpa:'/nasjɔ̃/',segmentIpa:'/sjɔ̃/'});
assert.equal(nation.ok,true);assert.equal(nation.reason,'exact_suffix_word_and_ipa_evidence');
const passion=buildContextualGraphemeOperation({grapheme:'SION',sourceWord:'passion',sourceIpa:'/pasjɔ̃/',segmentIpa:'/sjɔ̃/'});
assert.ok(passion);assert.equal(passion.type,'contextual_grapheme');assert.equal(passion.strictCompatible,false);assert.equal(passion.automaticActivation,false);
const rapidement=buildContextualGraphemeOperation({grapheme:'MENT',sourceWord:'rapidement',sourceIpa:'/ʁapidmɑ̃/',segmentIpa:'/mɑ̃/'});
assert.ok(rapidement);assert.equal(rapidement.grapheme,'MENT');

assert.equal(buildContextualGraphemeOperation({grapheme:'TION',sourceWord:'question',sourceIpa:'/kɛstjɔ̃/',segmentIpa:'/sjɔ̃/'}),null,'question must not license TION→/sjɔ̃/ when the exact IPA suffix is /tjɔ̃/');
assert.equal(buildContextualGraphemeOperation({grapheme:'SION',sourceWord:'vision',sourceIpa:'/vizjɔ̃/',segmentIpa:'/sjɔ̃/'}),null,'vision must not license SION→/sjɔ̃/ when the exact IPA suffix is /zjɔ̃/');
assert.equal(buildContextualGraphemeOperation({grapheme:'MENT',sourceWord:'ferment',sourceIpa:'/fɛʁm/',segmentIpa:'/mɑ̃/'}),null,'orthography alone must never invent the MENT sound');
assert.equal(buildContextualGraphemeOperation({grapheme:'MENT',sourceWord:'rapidement',sourceIpa:'/ʁapidmɑ̃/',segmentIpa:'/mɑn/'}),null,'declared segment IPA must match exactly');
assert.equal(buildContextualGraphemeOperation({grapheme:'IN',sourceWord:'matin',sourceIpa:'/matɛ̃/',segmentIpa:'/ɛ̃/'}),null,'IN remains blocked without explicit alignment semantics');

console.log('contextual grapheme operations: TR prefix plus TION/SION/MENT suffix rules require exact word+IPA edge evidence; IN/UN remain blocked.');
