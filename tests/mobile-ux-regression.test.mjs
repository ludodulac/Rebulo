import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const playCss=fs.readFileSync(new URL('../play-mode.css',import.meta.url),'utf8');
const mobileCss=fs.readFileSync(new URL('../mobile-layout.css',import.meta.url),'utf8');
const shellState=fs.readFileSync(new URL('../src/create-shell-state.js',import.meta.url),'utf8');
const bootstrap=fs.readFileSync(new URL('../src/app-bootstrap.js',import.meta.url),'utf8');

assert.match(html,/id="playArena"[^>]*\shidden\b/,'play arena must start hidden');
assert.match(html,/id="result"[^>]*\shidden\b/,'creator result must start hidden');
assert.match(html,/id="target"[^>]*placeholder="Ex\. merci, cinéma…"/,'creator must start with an example placeholder');
assert.doesNotMatch(html,/id="target"[^>]*\svalue=/,'creator must not fabricate a result on first load');
assert.match(html,/data-creator-ready="false"/,'professional tools must start gated');
assert.match(playCss,/\[hidden\]\{display:none!important\}/,'author CSS must never override the hidden attribute');
assert.match(playCss,/data-creator-ready="false"[^}]*\.session-dock/,'session tools must stay hidden before a creator result exists');
assert.match(mobileCss,/\.creator-row\{grid-template-columns:1fr 1fr/,'mobile creator actions must use a stable two-column action row');
assert.match(mobileCss,/\.creator-row input\{grid-column:1\/-1\}/,'mobile creator input must occupy its own row');
assert.match(mobileCss,/keyboard-open[^}]*#playArena\.play-arena\{[^}]*overflow-y:auto!important/,'keyboard-open play must stay scrollable inside the visible phone viewport');
assert.match(mobileCss,/keyboard-open[^}]*#playAnswerForm\{[^}]*position:sticky[^}]*bottom:0/,'the play answer field must stay reachable immediately above the mobile keyboard');
assert.match(shellState,/MutationObserver/,'creator-ready state must follow result visibility changes');
assert.match(shellState,/Écris un mot pour créer un rébus\./,'initial shell cleanup must stay aligned with the canonical empty creator status');
assert.doesNotMatch(shellState,/Écris d’abord un mot\./,'initial shell cleanup must not depend on the retired creator prompt');
assert.match(bootstrap,/id='syllablePosition'/,'syllable identification must expose a dedicated position selector');
assert.match(bootstrap,/finalOption\.hidden=true/,'final syllable must not appear as a duplicate activity option');
assert.match(bootstrap,/activitySelect\.dispatchEvent\(new Event\('change'/,'position changes must reuse the canonical activity change path');
assert.match(bootstrap,/activitySelect\.value=initialId/,'the visible activity selector must stay on the single syllable-identification family entry');

console.log('mobile UX regression guards: play answer remains reachable above the software keyboard.');
