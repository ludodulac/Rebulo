import assert from 'node:assert/strict';
import {sanitizeFilePart,worksheetCopy,worksheetMetadata} from '../src/pdf-export.js';

const rebus={answer:'cinéma',targetIpa:'/sinema/',pieces:[{label:'scie',ipa:'/si/'},{label:'nez',ipa:'/ne/'},{label:'mât',ipa:'/ma/'}]};
assert.equal(sanitizeFilePart('Cinéma !'),'cinema');
const child=worksheetCopy(rebus,'child');assert.equal(child.showAnswer,false);assert.equal(child.showLabels,false);assert.equal(child.showIpa,false);assert.equal(child.answerLine,true);assert.equal(child.title,'Quel mot entends-tu ?');
const pro=worksheetCopy(rebus,'pro');assert.equal(pro.showAnswer,true);assert.equal(pro.showLabels,true);assert.equal(pro.showIpa,true);assert.equal(pro.answerLine,false);assert.equal(pro.title,'cinéma');assert.equal(pro.proof,'/si/ + /ne/ + /ma/ = /sinema/');
assert.deepEqual(worksheetMetadata({patient:'Léa',date:'2026-09-01',level:'Entraînement'}),['Patient / élève : Léa','Date : 2026-09-01','Niveau : Entraînement']);
assert.deepEqual(worksheetMetadata({patient:'',date:'',level:''}),[]);
console.log('Rebulo PDF worksheet modes: all tests passed.');
