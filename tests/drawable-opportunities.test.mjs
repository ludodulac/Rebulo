import assert from 'node:assert/strict';
import {buildDrawableOpportunityShortlist,buildExpansionCurationLeads,isDrawableNamingCandidate} from '../src/drawable-opportunities.js';

assert.equal(isDrawableNamingCandidate({word:"t'"}),false);
assert.equal(isDrawableNamingCandidate({word:'thé'}),true);
assert.equal(isDrawableNamingCandidate({word:'raie'}),true);

const opportunities=[
  {ipa:'te',targetCount:199,frequencySum:100,namingCandidates:[{word:'tes',frequency:10},{word:'thé',frequency:8}],examples:[{word:'raté'}]},
  {ipa:'ʁɛ',targetCount:106,frequencySum:80,namingCandidates:[{word:'raie',frequency:6},{word:'rai',frequency:4}],examples:[{word:'paraît'}]},
  {ipa:'t',targetCount:310,frequencySum:200,namingCandidates:[{word:"t'",frequency:100},{word:'t',frequency:90}],examples:[{word:'route'}]},
  {ipa:'po',targetCount:27,frequencySum:50,namingCandidates:[{word:'pot',frequency:5},{word:'peau',frequency:4}],examples:[{word:'chapeau'}]},
  {ipa:'lu',targetCount:22,frequencySum:35,namingCandidates:[{word:'loup',frequency:9},{word:'lou',frequency:1}],examples:[{word:'pelouse'}]}
];
const curated=[
  {label:'pot',ipa:'/po/',status:'prototype_research',activation:'prototype_registered',assetStatus:'available_inactive',nextGate:'naming_review',selectionReason:'asset exists',namingRisk:'plante'},
  {label:'raie',ipa:'/ʁɛ/',status:'research_candidate',activation:'not_ready',selectionReason:'animal possible',namingRisk:'ligne'}
];
const ranked=buildDrawableOpportunityShortlist(opportunities,curated);
assert.deepEqual(ranked.map(x=>x.label),['raie','pot']);
assert.equal(ranked.some(x=>x.ipa==='t'),false,'raw grammatical fragments must never enter the human-reviewed drawable queue');
assert.equal(ranked.some(x=>x.label==='thé'),false,'a lexical homophone must not become drawable-reviewed without explicit curation');
assert.equal(ranked.find(x=>x.label==='pot').nextGate,'naming_review');
assert.equal(ranked.find(x=>x.label==='raie').curationStatus,'research_candidate');
assert.equal(ranked.find(x=>x.label==='raie').exactLabelAttested,true);
assert.ok(ranked.every(x=>x.activation),'every reviewed candidate must expose its activation gate');

const leads=buildExpansionCurationLeads(opportunities,[{label:'thé',ipa:'/te/',active:true},{label:'pot',ipa:'/po/',active:true}],{limit:10});
assert.deepEqual(leads.map(x=>x.ipa),['ʁɛ','lu']);
assert.equal(leads.find(x=>x.ipa==='lu').proposedLabel,null,'lexical leads must never auto-select a pictogram label');
assert.equal(leads.find(x=>x.ipa==='lu').status,'needs_human_curation');
assert.equal(leads.find(x=>x.ipa==='lu').activation,'not_ready');
assert.deepEqual(leads.find(x=>x.ipa==='lu').lexicalCandidates.map(x=>x.word),['loup','lou']);
assert.equal(leads.some(x=>x.ipa==='t'),false,'non-drawable fragments must not become curation leads');
assert.equal(leads.some(x=>x.ipa==='te'),false,'already-active sounds must not be proposed again');
console.log('drawable opportunity shortlist and expansion curation leads: ok');
