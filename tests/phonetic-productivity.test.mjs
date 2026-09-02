import assert from 'node:assert/strict';
import {classifyStrictProductivity,PRODUCTIVITY_STATUS,groupProductiveHomophones,mergeProductivityInventory} from '../src/phonetic-productivity.js';
const items=[
 {id:'rat',label:'rat',ipa:'/ʁa/',image:'rat.svg',active:true},
 {id:'lit',label:'lit',ipa:'/li/',image:'lit.svg',active:true},
 {id:'velo',label:'vélo',ipa:'/velo/',image:'velo.svg',active:true},
 {id:'voiture',label:'voiture',ipa:'/vwatyʁ/',image:'voiture.svg',active:true},
 {id:'raie',label:'raie',ipa:'/ʁɛ/',image:'raie.svg',active:false},
 {id:'reine',label:'reine',ipa:'/ʁɛn/',image:'reine.svg',strictEligible:false,active:true}
];
const targets=[{word:'rallye',ipa:'/ʁali/',frequency:10},{word:'Rallye',ipa:'/ʁali/',frequency:5},{word:'vérité',ipa:'/veʁite/'},{word:'voilà',ipa:'/vwala/'},{word:'rairai',ipa:'/ʁɛʁɛ/'}];
const result=classifyStrictProductivity(items,targets);
assert.equal(result.rebuses.length,1,'les doublons lexicaux et les prototypes inactifs ne gonflent pas la mesure');
assert.deepEqual(result.rebuses[0].decomposition,['rat','lit']);
assert.equal(result.tokens.find(x=>x.id==='rat').productivityStatus,PRODUCTIVITY_STATUS.PRODUCTIVE);
assert.equal(result.tokens.find(x=>x.id==='lit').strictUseCount,1);
assert.equal(result.tokens.find(x=>x.id==='velo').productivityStatus,PRODUCTIVITY_STATUS.CANDIDATE);
assert.equal(result.tokens.find(x=>x.id==='voiture').productivityStatus,PRODUCTIVITY_STATUS.CANDIDATE);
assert.equal(result.tokens.find(x=>x.id==='raie').productivityStatus,PRODUCTIVITY_STATUS.CANDIDATE,'un prototype inactif reste candidat mais ne crée aucune preuve');
assert.equal(result.tokens.find(x=>x.id==='raie').strictUseCount,0);
assert.equal(result.tokens.find(x=>x.id==='reine').productivityStatus,PRODUCTIVITY_STATUS.GENERAL);
assert.equal(result.rebuses.some(x=>x.decomposition.includes('velo')),false,'vélo entier ne doit jamais fournir /ve/');
assert.equal(result.rebuses.some(x=>x.decomposition.includes('voiture')),false,'voiture entière ne doit jamais fournir /vwa/');
const merged=mergeProductivityInventory([{id:'chat',label:'chat',ipa:'/ʃa/'}],[{id:'chat-open',label:'Chat',ipa:'/ʃa/'},{id:'mer',label:'mer',ipa:'/mɛʁ/'}]);
assert.deepEqual(merged.map(x=>x.id),['chat','mer'],'le seed reste prioritaire et les vagues sont dédupliquées');
const homophones=groupProductiveHomophones([{id:'mer',normalizedIPA:'mɛʁ'},{id:'maire',normalizedIPA:'mɛʁ'},{id:'rat',normalizedIPA:'ʁa'}]);
assert.equal(homophones.length,1);assert.equal(homophones[0].ipa,'mɛʁ');
console.log('phonetic productivity: ok');
