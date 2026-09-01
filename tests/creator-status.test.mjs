import assert from 'node:assert/strict';
import {creatorStatus,friendlyCreatorMessage} from '../src/creator-status.js';

assert.equal(creatorStatus({wanted:''}).code,'empty');
assert.match(creatorStatus({wanted:'x'}).message,/Aucun rébus exact/);
assert.deepEqual(creatorStatus({wanted:'parade',target:{mode:'rejected'}}),{
  code:'not-exact',
  message:'Ce mot ne permet pas encore un rébus exact avec les règles actuelles.'
});
assert.equal(creatorStatus({wanted:'tableau',target:{mode:'strict',assets:'missing'}}).code,'assets-missing');
assert.equal(creatorStatus({wanted:'merci',target:{mode:'strict',assets:'ready'},candidate:null}).code,'no-active-combination');
assert.equal(creatorStatus({wanted:'merci',target:{mode:'strict',assets:'ready'},candidate:{therapyActivities:[]}}).code,'ready-no-activity');
assert.equal(creatorStatus({wanted:'merci',target:{mode:'strict',assets:'ready'},candidate:{therapyActivities:[{id:'denomination'}]}}).code,'ready');

assert.equal(friendlyCreatorMessage('Refus phonétique : détail interne'),creatorStatus({wanted:'mot',target:{mode:'rejected'}}).message);
assert.equal(friendlyCreatorMessage('Rébus créé.',true),'Rébus exact créé.');
assert.equal(friendlyCreatorMessage('Rébus créé.',false),'Rébus exact créé. Aucune activité supplémentaire n’est disponible pour ce mot.');
assert.match(friendlyCreatorMessage('Chargement impossible.'),/Recharge la page/);
assert.equal(friendlyCreatorMessage('Message inconnu'),'Message inconnu');

console.log('creator-status tests passed');
