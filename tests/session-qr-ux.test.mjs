import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/session-experience.js',import.meta.url),'utf8');
const qr=fs.readFileSync(new URL('../src/session-qr.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../play-mode.css',import.meta.url),'utf8');

for(const text of ['▦ QR de la séance','buildCurrentShareUrl','renderSessionQr(canvas,url)','Ce QR contient exactement le même lien de séance.'])assert.ok(source.includes(text),`missing session QR UX: ${text}`);
assert.ok(source.includes('const url=await buildCurrentShareUrl()'),'QR and share must derive from the same share URL builder');
assert.ok(qr.includes('qrcode@1.5.4/+esm'),'QR must be generated client-side from a pinned browser library');
assert.ok(qr.includes('qr.toCanvas(canvas,value,SESSION_QR_OPTIONS)'),'QR encoder must receive the share URL directly');
assert.ok(css.includes('.session-qr-panel'),'QR must appear progressively inside the prepared-session surface');
assert.equal(source.includes('patientName'),false,'patient identity must never enter QR sharing code');
console.log('session QR UX guards: ok');
