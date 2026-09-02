import assert from 'node:assert/strict';
import {classifyStrictProductivity,PRODUCTIVITY_STATUS,groupProductiveHomophones} from '../src/phonetic-productivity.js';
const items=[
 {id:'rat',label:'rat',ipa:'/ʁa/',image:'rat.svg'},
 {id:'lit',label:'lit',ipa:'/li/',image:'lit.svg'},
 {id:'velo',label:'vélo',ipa:'/velo/',image:'velo.svg'},
 {id:'voiture',label:'voiture',ipa:'/vwatyʁ/',image:'voiture.svg'},
 {id:'raie',label:'raie',ipa:'/ʁɛ/',image:'raie.svg'},
 {id:'reine',label:'reine',ipa:'/ʁɛn/',image:'reine.svg',strictEligible:false}
];
const targets=[{word:'rallye',ipa:'/ʁali/',frequency:10},{word:'vérité',ipa:'/veʁite/'},{word:'voilà',ipa:'/vwala/'}];
const result=classifyStrictProductivity(items,targets);
assert.equal(result.rebuses.length,1);
assert.deepEqual(result.rebuses[0].decomposition,['rat','lit']);
assert.equal(result.tokens.find(x=>x.id==='rat').productivityStatus,PRODUCTIVITY_STATUS.PRODUCTIVE);
assert.equal(result.tokens.find(x=>x.id==='lit').strictUseCount,1);
assert.equal(result.tokens.find(x=>x.id==='velo').productivityStatus,PRODUCTIVITY_STATUS.CANDIDATE);
assert.equal(result.tokens.find(x=>x.id==='voiture').productivityStatus,PRODUCTIVITY_STATUS.CANDIDATE);
assert.equal(result.tokens.find(x=>x.id==='reine').productivityStatus,PRODUCTIVITY_STATUS.GENERAL);
assert.equal(result.rebuses.some(x=>x.decomposition.includes('velo')),false,'vélo entier ne doit jamais fournir /ve/');
assert.equal(result.rebuses.some(x=>x.decomposition.includes('voiture')),false,'voiture entière ne doit jamais fournir /vwa/');
const homophones=groupProductiveHomophones([{id:'mer',normalizedIPA:'mɛʁ'},{id:'maire',normalizedIPA:'mɛʁ'},{id:'rat',normalizedIPA:'ʁa'}]);
assert.equal(homophones.length,1);assert.equal(homophones[0].ipa,'mɛʁ');
console.log('phonetic productivity: ok');
