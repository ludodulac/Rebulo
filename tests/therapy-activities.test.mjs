import assert from 'node:assert/strict';
import {buildTherapyActivities,selectTherapyActivity,activityInstruction} from '../src/therapy-activities.js';

const definitions=[
  {id:'syllable-blending',label:'Fusion syllabique',unit:'syllable',description:'Fusionner plusieurs unités sonores pour retrouver un mot.'},
  {id:'oral-to-written',label:"Du son vers l'écrit",unit:'word',description:"Écouter/reconstituer le mot puis l'écrire."},
  {id:'phoneme-deletion',label:'Suppression phonémique',unit:'phoneme',description:'Retirer explicitement un phonème.'}
];

const target={therapy:['syllable-blending','oral-to-written','phoneme-deletion','unknown-target']};
const activities=buildTherapyActivities(target,definitions);
assert.deepEqual(activities.map(item=>item.id),['syllable-blending','oral-to-written']);
assert.equal(selectTherapyActivity(activities,'oral-to-written').id,'oral-to-written');
assert.equal(selectTherapyActivity(activities,'missing').id,'syllable-blending');
assert.match(activityInstruction(activities[0],'child'),/nom entier de chaque image/);
assert.match(activityInstruction(activities[0],'pro'),/sans suppression ni substitution/);
assert.deepEqual(buildTherapyActivities({therapy:['phoneme-deletion']},definitions),[]);
console.log('Rebulo therapy activities: all tests passed.');
