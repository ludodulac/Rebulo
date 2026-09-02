import assert from 'node:assert/strict';
import {buildDrawableOpportunityShortlist,isDrawableNamingCandidate} from '../src/drawable-opportunities.js';

assert.equal(isDrawableNamingCandidate({word:"t'"}),false);
assert.equal(isDrawableNamingCandidate({word:'thé'}),true);
assert.equal(isDrawableNamingCandidate({word:'raie'}),true);

const opportunities=[
  {ipa:'te',targetCount:199,frequencySum:100,namingCandidates:[{word:'tes',frequency:10},{word:'thé',frequency:8}],examples:[{word:'raté'}]},
  {ipa:'ʁɛ',targetCount:106,frequencySum:80,namingCandidates:[{word:'raie',frequency:6},{word:'rai',frequency:4}],examples:[{word:'paraît'}]},
  {ipa:'t',targetCount:310,frequencySum:200,namingCandidates:[{word:"t'",frequency:100},{word:'t',frequency:90}],examples:[{word:'route'}]},
  {ipa:'po',targetCount:27,frequencySum:50,namingCandidates:[{word:'pot',frequency:5},{word:'peau',frequency:4}],examples:[{word:'chapeau'}]}
];
const curated=[
  {label:'thé',ipa:'/te/',status:'research_candidate',activation:'not_ready',selectionReason:'objet concret',namingRisk:'boisson'},
  {label:'pot',ipa:'/po/',status:'prototype_research',activation:'prototype_registered',assetStatus:'available_inactive',nextGate:'naming_review',selectionReason:'asset exists',namingRisk:'plante'},
  {label:'raie',ipa:'/ʁɛ/',status:'research_candidate',activation:'not_ready',selectionReason:'animal possible',namingRisk:'ligne'}
];
const ranked=buildDrawableOpportunityShortlist(opportunities,curated);
assert.deepEqual(ranked.map(x=>x.label),['thé','raie','pot']);
assert.equal(ranked.some(x=>x.ipa==='t'),false,'raw grammatical fragments must never enter the human-reviewed drawable queue');
assert.equal(ranked.find(x=>x.label==='pot').nextGate,'naming_review');
assert.equal(ranked.find(x=>x.label==='raie').curationStatus,'research_candidate');
assert.equal(ranked.find(x=>x.label==='thé').exactLabelAttested,true);
console.log('drawable opportunity shortlist: ok');
