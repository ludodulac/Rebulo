import assert from 'node:assert/strict';
import fs from 'node:fs';

const playMode=fs.readFileSync(new URL('../src/play-mode.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../play-mode.css',import.meta.url),'utf8');

assert.match(playMode,/const PLAY_NOTES_KEY='rebulo-play-test-notes'/,'play notes must use a stable localStorage key');
assert.match(playMode,/installPlayNotes\(\)/,'play notes panel must be installed at startup');
assert.match(playMode,/insertAdjacentElement\('afterend',panel\)/,'notes should stay visible after play controls');
assert.match(playMode,/localStorage\.setItem\(PLAY_NOTES_KEY,notesField\.value\)/,'notes must persist while trying several rebuses');
assert.match(playMode,/navigator\.clipboard\.writeText\(notesField\.value\)/,'tester must be able to copy notes back to the project conversation');
assert.match(css,/\.play-notes-panel/,'notes panel must have explicit styling');
assert.match(css,/\.play-notes-panel textarea/,'notes textarea must be styled for touch use');
console.log('play-test-notes: persistent tester notes stay wired');
