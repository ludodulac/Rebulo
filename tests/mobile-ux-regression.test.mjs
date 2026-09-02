import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const playCss=fs.readFileSync(new URL('../play-mode.css',import.meta.url),'utf8');
const mobileCss=fs.readFileSync(new URL('../mobile-layout.css',import.meta.url),'utf8');
const shellState=fs.readFileSync(new URL('../src/create-shell-state.js',import.meta.url),'utf8');

assert.match(html,/id="playArena"[^>]*\shidden\b/,'play arena must start hidden');
assert.match(html,/id="result"[^>]*\shidden\b/,'creator result must start hidden');
assert.match(html,/id="target"[^>]*placeholder="Ex\. merci, cinéma…"/,'creator must start with an example placeholder');
assert.doesNotMatch(html,/id="target"[^>]*\svalue=/,'creator must not fabricate a result on first load');
assert.match(html,/data-creator-ready="false"/,'professional tools must start gated');
assert.match(playCss,/\[hidden\]\{display:none!important\}/,'author CSS must never override the hidden attribute');
assert.match(playCss,/data-creator-ready="false"[^}]*\.session-dock/,'session tools must stay hidden before a creator result exists');
assert.match(mobileCss,/\.creator-row\{grid-template-columns:1fr 1fr/,'mobile creator actions must use a stable two-column action row');
assert.match(mobileCss,/\.creator-row input\{grid-column:1\/-1\}/,'mobile creator input must occupy its own row');
assert.match(shellState,/MutationObserver/,'creator-ready state must follow result visibility changes');

console.log('mobile UX regression guards: ok');
