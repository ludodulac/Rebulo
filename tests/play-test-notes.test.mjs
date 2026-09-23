import assert from 'node:assert/strict';
import fs from 'node:fs';

const playMode=fs.readFileSync(new URL('../src/play-mode.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../play-mode.css',import.meta.url),'utf8');

assert.match(playMode,/const PLAY_NOTES_KEY='rebulo-play-test-notes'/,'play notes must use a stable localStorage key');
assert.match(playMode,/installPlayNotes\(\)/,'play notes panel must be installed at startup');
assert.match(playMode,/document\.createElement\('details'\)/,'tester notes must be optional and collapsed by default');
assert.match(playMode,/summary\.textContent='📝 Notes de test'/,'collapsed tester notes must remain discoverable');
assert.match(playMode,/insertAdjacentElement\('afterend',panel\)/,'notes should stay available after play controls');
assert.match(playMode,/localStorage\.setItem\(PLAY_NOTES_KEY,notesField\.value\)/,'notes must persist while trying several rebuses');
assert.match(playMode,/navigator\.clipboard\.writeText\(notesField\.value\)/,'tester must be able to copy notes back to the project conversation');
assert.match(css,/\.play-notes-panel/,'notes panel must have explicit styling');
assert.match(css,/\.play-notes-panel textarea/,'notes textarea must be styled for touch use');
assert.match(css,/keyboard-open[^}]*\.play-notes-panel\{display:none\}/,'tester notes must not consume the reduced mobile viewport while the keyboard is open');
console.log('play-test-notes: persistent tester notes stay wired');
