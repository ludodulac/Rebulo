import assert from 'node:assert/strict';
import {classifyRepresentationBank,decodeSoundCatalog,findExactImageCombinations,readyImagePieces,representationBankStats} from '../src/rebus-representation-bank.js';

const rowSchema=['ipa','syllableSpans','occurrenceCount','usefulOccurrenceCount','usefulTargetCount','usefulWeightedGain','schoolTargetCount','minAgeBandCandidate','researchState','researchPriorityScore','exactImageReadyCount','exactImageResearchCount','visibleConventionCount','approximationCount','exactLexicalCandidateCount','nounLexicalCandidateCount','examples','usefulExamples','exactLexicalCandidates','nounLexicalCandidates','representations'];
const rep=(id,label,kind,tier,image=null)=>[id,label,kind,tier,'test',image,null,null,null,null];
const row=(ipa,{useful=1,exact=0,ready=0,reps=[],words=[]}={})=>[ipa,[1],1,1,useful,100,1,5,ready?'exact_image_ready':exact?'exact_noun_candidate_to_review':'unresolved',100,ready,0,reps.filter(item=>item[3]==='explicit_visible_convention').length,0,exact,exact,[],['exemple'],words.map(word=>[word,'NOM',10,1]),words.map(word=>[word,'NOM',10,1]),reps];

const catalog={
  formatVersion:2,rowSchema,
  soundRows:[
    row('pa',{exact:1,ready:1,reps:[rep('img-pa','pas','whole_word_image','exact_image_ready','pa.svg')],words:['pas']}),
    row('ta',{exact:1,ready:1,reps:[rep('img-ta','tas','whole_word_image','exact_image_ready','ta.svg')],words:['tas']}),
    row('pata',{exact:1,words:['pata']}),
    row('ɛl',{exact:1,reps:[rep('letter-l','L','letter_name','explicit_visible_convention')],words:['aile']}),
    row('ɥit',{exact:1,reps:[rep('digit-8','8','number_symbol','explicit_visible_convention')],words:['huit']}),
    row('le',{exact:2,words:['lé','les']}),
    row('xyz',{exact:0})
  ],
  visualCuration:{curatedPrototypeQueue:[],excludedAutomaticImageRoutes:[{ipa:'le'}]}
};
const approximation={rows:[{ipa:'le',candidates:[{word:'lait',sourceIpa:'lɛ',tier:'light',editorialApproximationPercent:15,existingAsset:true,image:'lait.svg'}]}]};

const decoded=decodeSoundCatalog(catalog);
assert.equal(decoded.length,7);
const pieces=readyImagePieces(decoded);
assert.deepEqual(findExactImageCombinations('pata',pieces)[0].map(item=>item.label),['pas','tas']);

const classified=classifyRepresentationBank(catalog,approximation);
const byIpa=new Map(classified.map(item=>[item.ipa,item]));
assert.equal(byIpa.get('pa').categories.D_obviousOrReadyPictogram,true);
assert.equal(byIpa.get('pata').categories.F_exactMultiPictogram,true,'two exact ready images should cover a longer sound without approximation');
assert.equal(byIpa.get('ɛl').categories.G_letter,true);
assert.equal(byIpa.get('ɥit').categories.H_number,true);
assert.equal(byIpa.get('le').categories.B_multipleExactFrenchWords,true);
assert.equal(byIpa.get('le').categories.C_exactWordVisualNotReady,true,'exact lexical existence must stay separate from visual readiness');
assert.equal(byIpa.get('le').categories.E_lightApproximation,true);
assert.equal(byIpa.get('le').categories.I_noCurrentReasonableRepresentation,false,'a light existing-asset approximation is a current general-mode route');
assert.equal(byIpa.get('xyz').categories.I_noCurrentReasonableRepresentation,true);

const stats=representationBankStats(classified);
assert.equal(stats.useful.soundCount,7);
assert.equal(stats.useful.D_obviousOrReadyPictogram,2);
assert.equal(stats.useful.F_exactMultiPictogram,1);
assert.equal(stats.useful.G_letter,1);
assert.equal(stats.useful.H_number,1);
assert.equal(stats.useful.I_noCurrentReasonableRepresentation,1);

console.log('rebus-representation-bank.test.mjs: A-I categories keep lexical, visual, composition, convention and approximation evidence separate');
