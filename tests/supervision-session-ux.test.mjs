import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const play=fs.readFileSync(new URL('../src/play-mode.js',import.meta.url),'utf8');
const session=fs.readFileSync(new URL('../src/session-experience.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../play-mode.css',import.meta.url),'utf8');

assert.match(html,/data-experience="play"/,'play must be the declared primary experience');
assert.match(html,/Joue avec les sons et les mots grâce aux rébus/);
assert.match(html,/id="playMode"[^>]*aria-pressed="true"/);
assert.match(html,/data-creator-kind="word"/);
assert.match(html,/data-creator-kind="phrase"/);
assert.match(html,/src\/session-experience\.js/,'session experience must be wired in HTML');
assert.match(play,/import '\.\/creator-kind\.js'/,'Mot/Phrase controller must be wired into the visible app');
assert.match(html,/Fiche à imprimer/);
assert.match(html,/Fiche de séance/);
assert.doesNotMatch(html,/id="downloadRebus"[^>]*>PDF</);
assert.doesNotMatch(html,/id="downloadSeries"[^>]*>PDF</);
assert.match(session,/MutationObserver/,'session progression must follow queue changes');
assert.match(session,/session-progress/);
assert.match(css,/\.play-rebus\{[^}]*flex-wrap:nowrap[^}]*overflow-x:auto/,'multi-piece play sequence must retain one reading line');
assert.match(css,/\.session-progress/);

console.log('supervision session UX guards: ok');
