import assert from 'node:assert/strict';
import {buildTherapyActivities,selectTherapyActivity,activityInstruction} from '../src/therapy-activities.js';

const definitions=[
  {id:'denomination',label:'Dénomination',unit:'word',description:'Identifier une image et produire sa dénomination cible.'},
  {id:'lexical-access',label:'Accès lexical',unit:'word',description:'Travailler évocation, dénomination et accès au lexique à partir des images.'},
  {id:'phoneme-initial',label:'Phonème initial',unit:'phoneme',description:'Repérer le premier phonème d’un mot.'},
  {id:'phoneme-final',label:'Phonème final',unit:'phoneme',description:'Repérer le dernier phonème d’un mot.'},
  {id:'syllable-blending',label:'Fusion syllabique',unit:'syllable',description:'Fusionner plusieurs unités sonores pour retrouver un mot.'},
  {id:'oral-to-written',label:"Du son vers l'écrit",unit:'word',description:"Écouter/reconstituer le mot puis l'écrire."},
  {id:'phoneme-deletion',label:'Suppression phonémique',unit:'phoneme',description:'Retirer explicitement un phonème.'}
];

const target={targetIpa:'/mɛʁsi/',therapy:['denomination','lexical-access','phoneme-initial','phoneme-final','syllable-blending','oral-to-written','phoneme-deletion','unknown-target']};
const activities=buildTherapyActivities(target,definitions);
assert.deepEqual(activities.map(item=>item.id),['denomination','lexical-access','phoneme-initial','phoneme-final','syllable-blending','oral-to-written']);
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
assert.match(activityInstruction(activities[4],'child'),/nom entier de chaque image/);
assert.match(activityInstruction(activities[4],'pro'),/sans suppression ni substitution/);

const nasalInitial=buildTherapyActivities({targetIpa:'/ɛ̃fɑ̃/',therapy:['phoneme-initial']},definitions)[0];
assert.equal(nasalInitial.expectedResponse,'ɛ̃');
assert.match(nasalInitial.proInstruction,/\/ɛ̃\//);
const nasalFinal=buildTherapyActivities({targetIpa:'/ɛ̃fɑ̃/',therapy:['phoneme-final']},definitions)[0];
assert.equal(nasalFinal.expectedResponse,'ɑ̃');
assert.match(nasalFinal.proInstruction,/\/ɑ̃\//);
assert.deepEqual(buildTherapyActivities({therapy:['phoneme-deletion']},definitions),[]);
console.log('Rebulo therapy activities: all tests passed.');
