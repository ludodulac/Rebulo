import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const play=fs.readFileSync(new URL('../src/play-mode.js',import.meta.url),'utf8');
const age=fs.readFileSync(new URL('../src/age-profile.js',import.meta.url),'utf8');

assert.match(html,/Quel âge as-tu \?/);
for(const value of ['5','7','9','12'])assert.match(html,new RegExp(`data-rebulo-age="${value}"`));
assert.match(html,/src\/age-profile\.js/);
assert.match(play,/minAge/,'play mode must filter catalog by age');
assert.match(play,/resetCreatorSurface/,'switching back to create must clear stale content');
assert.match(age,/rebulo:agechange/);
assert.match(age,/localStorage/);
console.log('age-first direct experience: ok');
