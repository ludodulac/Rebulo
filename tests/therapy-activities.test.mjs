import assert from 'node:assert/strict';
import {buildTherapyActivities,selectTherapyActivity,activityInstruction} from '../src/therapy-activities.js';

const definitions=[
  {id:'denomination',label:'Dénomination',unit:'word',description:'Identifier une image et produire sa dénomination cible.'},
  {id:'lexical-access',label:'Accès lexical',unit:'word',description:'Travailler évocation, dénomination et accès au lexique à partir des images.'},
  {id:'phoneme-initial',label:'Phonème initial',unit:'phoneme',description:'Repérer le premier phonème d’un mot.'},
  {id:'phoneme-final',label:'Phonème final',unit:'phoneme',description:'Repérer le dernier phonème d’un mot.'},
  {id:'phoneme-segmentation',label:'Segmentation phonémique',unit:'phoneme',description:'Découper un mot en phonèmes.'},
  {id:'phoneme-blending',label:'Fusion phonémique',unit:'phoneme',description:'Fusionner des phonèmes en un mot.'},
  {id:'syllable-count',label:'Comptage syllabique',unit:'syllable',description:'Compter les syllabes orales d’un mot.'},
  {id:'syllable-blending',label:'Fusion syllabique',unit:'syllable',description:'Fusionner plusieurs unités sonores pour retrouver un mot.'},
  {id:'oral-to-written',label:"Du son vers l'écrit",unit:'word',description:"Écouter/reconstituer le mot puis l'écrire."},
  {id:'phoneme-deletion',label:'Suppression phonémique',unit:'phoneme',description:'Retirer explicitement un phonème.'}
];

const target={targetIpa:'/mɛʁsi/',syllableCount:2,therapy:['denomination','lexical-access','phoneme-initial','phoneme-final','phoneme-segmentation','phoneme-blending','syllable-count','syllable-blending','oral-to-written','phoneme-deletion','unknown-target']};
const activities=buildTherapyActivities(target,definitions);
assert.deepEqual(activities.map(item=>item.id),['denomination','lexical-access','phoneme-initial','phoneme-final','phoneme-segmentation','phoneme-blending','syllable-count','syllable-blending','oral-to-written']);
assert.equal(selectTherapyActivity(activities,'oral-to-written').id,'oral-to-written');
assert.equal(selectTherapyActivity(activities,'missing').id,'denomination');
assert.match(activityInstruction(activities[0],'child'),/Nomme chaque image/);
assert.match(activityInstruction(activities[0],'pro'),/sans indice phonémique/);
assert.match(activityInstruction(activities[1],'child'),/Retrouve son nom/);
assert.match(activityInstruction(activities[1],'pro'),/évocation lexicale/);
assert.match(activityInstruction(activities[2],'child'),/premier son/);
assert.match(activityInstruction(activities[2],'pro'),/Réponse attendue : \/m\//);
assert.equal(activities[2].expectedResponse,'m');
assert.match(activityInstruction(activities[3],'child'),/dernier son/);
assert.match(activityInstruction(activities[3],'pro'),/Réponse attendue : \/i\//);
assert.equal(activities[3].expectedResponse,'i');
assert.match(activityInstruction(activities[4],'child'),/sépare-le en petits sons/);
assert.deepEqual(activities[4].expectedResponse,['m','ɛ','ʁ','s','i']);
assert.match(activityInstruction(activities[4],'pro'),/\/m\/ \+ \/ɛ\/ \+ \/ʁ\/ \+ \/s\/ \+ \/i\//);
assert.deepEqual(activities[5].promptUnits,['m','ɛ','ʁ','s','i']);
assert.equal(activities[5].expectedResponse,'mɛʁsi');
assert.match(activityInstruction(activities[5],'child'),/\/m\/ \+ \/ɛ\/ \+ \/ʁ\/ \+ \/s\/ \+ \/i\//);
assert.match(activityInstruction(activities[5],'child'),/sans en retirer ni en changer/);
assert.match(activityInstruction(activities[5],'pro'),/calculée depuis l’IPA cible/);
assert.match(activityInstruction(activities[5],'pro'),/Réponse attendue : \/mɛʁsi\//);
assert.equal(activities[6].expectedResponse,2);
assert.match(activityInstruction(activities[6],'child'),/compte combien de syllabes/);
assert.match(activityInstruction(activities[6],'pro'),/sans fournir de découpage/);
assert.match(activityInstruction(activities[6],'pro'),/Réponse attendue : 2/);
assert.match(activityInstruction(activities[7],'child'),/nom entier de chaque image/);
assert.match(activityInstruction(activities[7],'pro'),/sans suppression ni substitution/);

const nasalInitial=buildTherapyActivities({targetIpa:'/ɛ̃fɑ̃/',therapy:['phoneme-initial']},definitions)[0];
assert.equal(nasalInitial.expectedResponse,'ɛ̃');
assert.match(nasalInitial.proInstruction,/\/ɛ̃\//);
const nasalFinal=buildTherapyActivities({targetIpa:'/ɛ̃fɑ̃/',therapy:['phoneme-final']},definitions)[0];
assert.equal(nasalFinal.expectedResponse,'ɑ̃');
assert.match(nasalFinal.proInstruction,/\/ɑ̃\//);
const nasalSegmentation=buildTherapyActivities({targetIpa:'/ɛ̃fɑ̃/',therapy:['phoneme-segmentation']},definitions)[0];
assert.deepEqual(nasalSegmentation.expectedResponse,['ɛ̃','f','ɑ̃']);
assert.match(nasalSegmentation.proInstruction,/\/ɛ̃\/ \+ \/f\/ \+ \/ɑ̃\//);
const nasalBlending=buildTherapyActivities({targetIpa:'/ɛ̃fɑ̃/',therapy:['phoneme-blending']},definitions)[0];
assert.deepEqual(nasalBlending.promptUnits,['ɛ̃','f','ɑ̃']);
assert.equal(nasalBlending.expectedResponse,'ɛ̃fɑ̃');
assert.match(nasalBlending.proInstruction,/\/ɛ̃\/ \+ \/f\/ \+ \/ɑ̃\//);
assert.deepEqual(buildTherapyActivities({therapy:['phoneme-blending']},definitions),[]);
assert.deepEqual(buildTherapyActivities({syllableCount:null,therapy:['syllable-count']},definitions),[]);
assert.deepEqual(buildTherapyActivities({syllableCount:0,therapy:['syllable-count']},definitions),[]);
assert.deepEqual(buildTherapyActivities({syllableCount:2.5,therapy:['syllable-count']},definitions),[]);
assert.deepEqual(buildTherapyActivities({therapy:['phoneme-deletion']},definitions),[]);
console.log('Rebulo therapy activities: all tests passed.');
