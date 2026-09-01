import assert from 'node:assert/strict';
import {assetStatusLabel,auditRebusAssets} from '../src/asset-audit.js';
const registry={sources:{openmoji:{project:'OpenMoji',license:'CC BY-SA 4.0'}},assets:[{path:'assets/rebus/lit.svg',source:'openmoji',clinicalStatus:'prototype_priority',note:'Validation à faire.'}]};
assert.equal(assetStatusLabel('prototype_priority'),'Prototype prioritaire — dénomination à valider');
const audit=auditRebusAssets([{label:'lit',image:'assets/rebus/lit.svg'},{label:'mer',image:'assets/rebus/mer.svg'}],registry);
assert.equal(audit.items[0].documented,true);assert.equal(audit.items[0].source,'OpenMoji');assert.equal(audit.items[0].license,'CC BY-SA 4.0');
assert.equal(audit.items[1].documented,false);assert.equal(audit.items[1].statusLabel,'Provenance et validation à auditer');
assert.equal(audit.allDocumented,false);assert.equal(audit.allClinicalApproved,false);
console.log('Rebulo pictogram asset audit: all tests passed.');
