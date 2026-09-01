import assert from 'node:assert/strict';
import {normalizeLayout,paginateSession,moveSessionItem,buildSessionProgression} from '../src/session-plan.js';
const items=[{answer:'merci',activity:{id:'syllable-blending',label:'Fusion syllabique'}},{answer:'cinéma',activity:{id:'oral-to-written',label:'Du son vers l’écrit'}},{answer:'parasol',activity:{id:'syllable-blending',label:'Fusion syllabique'}},{answer:'parapluie',activity:{id:'oral-to-written',label:'Du son vers l’écrit'}}];
assert.equal(normalizeLayout('2'),2);assert.equal(normalizeLayout(3),1);assert.equal(normalizeLayout('4'),4);
assert.deepEqual(paginateSession(items,2).map(page=>page.map(item=>item.answer)),[['merci','cinéma'],['parasol','parapluie']]);
assert.deepEqual(paginateSession(items,4).map(page=>page.length),[4]);
assert.deepEqual(moveSessionItem(items,1,0).map(item=>item.answer),['cinéma','merci','parasol','parapluie']);
assert.deepEqual(moveSessionItem(items,0,-1).map(item=>item.answer),items.map(item=>item.answer));
assert.deepEqual(buildSessionProgression(items),[
  {step:1,target:'merci',activity:'Fusion syllabique',activityId:'syllable-blending'},
  {step:2,target:'cinéma',activity:'Du son vers l’écrit',activityId:'oral-to-written'},
  {step:3,target:'parasol',activity:'Fusion syllabique',activityId:'syllable-blending'},
  {step:4,target:'parapluie',activity:'Du son vers l’écrit',activityId:'oral-to-written'}
]);
console.log('Rebulo session plan: all tests passed.');
