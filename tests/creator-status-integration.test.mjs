import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');

assert.match(app,/import \{creatorStatus,friendlyCreatorMessage\} from '\.\/src\/creator-status\.js';/);
assert.match(app,/creatorStatus\(\{wanted\}\)\.message/);
assert.match(app,/creatorStatus\(\{wanted,target\}\)\.message/);
assert.match(app,/creatorStatus\(\{wanted,target,candidate:null\}\)\.message/);
assert.match(app,/friendlyCreatorMessage\('Chargement impossible\.'\)/);
assert.doesNotMatch(app,/Refus phonétique :/);
assert.doesNotMatch(app,/La décomposition est étudiée, mais les images nécessaires ne sont pas encore prêtes\./);
assert.doesNotMatch(app,/Aucune décomposition exacte disponible avec les concepts actifs\./);

console.log('live creator flow uses user-facing creator statuses without leaking strict internals');
