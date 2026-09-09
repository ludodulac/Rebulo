import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/session-experience.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../play-mode.css',import.meta.url),'utf8');

for(const text of ['Aides pendant la séance','▶ Démarrer la séance','Rébus ${progress.step} sur ${progress.total}','Séance terminée'])assert.ok(source.includes(text),`missing session UX: ${text}`);
assert.ok(source.includes("buildCreatorCandidate(target,data.lexicon,data.therapy)"),'session must rebuild strict creator candidates rather than invent clues');
assert.ok(source.includes("resolveSessionEntries(queuedTargets()"),'queued session rows must be resolved without dropping unavailable entries');
assert.ok(source.includes('Séance à vérifier'),'unavailable saved items need an explicit review state');
assert.ok(source.includes('Il est conservé et doit être vérifié avant de démarrer.'),'unavailability must not look like user deletion');
assert.equal(source.includes('.filter(Boolean)'),false,'session reconstruction must not silently filter unresolved rows');
assert.equal(source.includes("candidate.therapyActivities?.[0]"),false,'missing saved activities must not silently fall back to the first current activity');
assert.ok(source.includes("img.alt=`Indice visuel ${index+1}`"),'session images must not leak their labels');
assert.ok(source.includes("safeSessionHint(current)"),'session hint must use the non-revealing hint helper');
assert.ok(source.includes("document.querySelector('#sessionAllowHint')?.checked"),'hint availability must be chosen before/during session setup');
assert.ok(source.includes("document.querySelector('#sessionAllowSolution')?.checked"),'solution availability must be chosen before/during session setup');
assert.ok(css.includes('[data-session-running="true"]'),'running session must have a focused UI state');
console.log('playable-session ux tests: unavailable rows remain intelligible and cannot be launched silently');
