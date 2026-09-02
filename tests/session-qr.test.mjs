import assert from 'node:assert/strict';
import {renderSessionQr,SESSION_QR_OPTIONS} from '../src/session-qr.js';

const canvas={id:'qr'};
let received=null;
const encoder={toCanvas:async(...args)=>{received=args;}};
const url='https://rebulo.example/?session=eyJ2IjoxfQ&keep=exact';
assert.equal(await renderSessionQr(canvas,url,encoder),url);
assert.equal(received[0],canvas);
assert.equal(received[1],url,'QR renderer must receive the exact share URL unchanged');
assert.deepEqual(received[2],SESSION_QR_OPTIONS);
assert.equal(SESSION_QR_OPTIONS.errorCorrectionLevel,'M');
await assert.rejects(()=>renderSessionQr(null,url,encoder),/missing_session_qr/);
await assert.rejects(()=>renderSessionQr(canvas,'',encoder),/missing_session_qr/);
await assert.rejects(()=>renderSessionQr(canvas,url,{}),/qrcode_unavailable/);
console.log('session QR tests: ok');
