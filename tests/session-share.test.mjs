import assert from 'node:assert/strict';
import {buildSessionSharePayload,serializeSessionShare,deserializeSessionShare,createSessionShareUrl,readSessionShareFromUrl,resolveSharedSession} from '../src/session-share.js';

const items=[{answer:'cinéma',activity:{id:'oral-to-written'}},{answer:'merci',activity:{id:'syllable-blending'}}];
const payload=buildSessionSharePayload(items,{hint:true,solution:false});
assert.deepEqual(payload,{v:1,rounds:[{target:'cinema',activity:'oral-to-written'},{target:'merci',activity:'syllable-blending'}],help:{hint:true,solution:false}});
const encoded=serializeSessionShare(payload);assert.ok(encoded&&!encoded.includes('='));assert.deepEqual(deserializeSessionShare(encoded),payload);
assert.equal(deserializeSessionShare('not-valid'),null);
assert.equal(deserializeSessionShare(serializeSessionShare({...payload,v:99})),null);
assert.equal(buildSessionSharePayload([],{}),null);
const url=createSessionShareUrl(items,{hint:false,solution:true},{href:'https://rebulo.example/app?foo=bar'});assert.match(url,/foo=bar/);assert.deepEqual(readSessionShareFromUrl({href:url}).help,{hint:false,solution:true});
assert.equal(url.includes('patient'),false);assert.equal(url.includes('date'),false);
const corpus=[{target:'cinéma',mode:'strict',assets:'ready'},{target:'merci',mode:'strict',assets:'ready'}];
const candidateFor=target=>({answer:target.target,pieces:[{image:'x.svg'}],therapyActivities:target.target==='cinéma'?[{id:'oral-to-written',label:'Du son vers l’écrit'}]:[{id:'syllable-blending',label:'Fusion syllabique'}]});
const resolved=resolveSharedSession(payload,{corpus,buildCandidate:candidateFor});assert.equal(resolved.items.length,2);assert.equal(resolved.items[0].answer,'cinéma');assert.equal(resolved.items[0].activity.id,'oral-to-written');assert.deepEqual(resolved.help,{hint:true,solution:false});
assert.equal(resolveSharedSession({...payload,rounds:[{target:'inconnu',activity:''}]},{corpus,buildCandidate:candidateFor}),null);
assert.equal(resolveSharedSession({...payload,rounds:[{target:'cinema',activity:'unknown'}]},{corpus,buildCandidate:candidateFor}),null);
assert.equal(resolveSharedSession({...payload,rounds:[{target:'cinema',activity:'oral-to-written'},{target:'cinema',activity:'oral-to-written'},{target:'cinema',activity:'oral-to-written'},{target:'cinema',activity:'oral-to-written'},{target:'cinema',activity:'oral-to-written'}]},{corpus,buildCandidate:candidateFor}),null);
console.log('session share tests: ok');
