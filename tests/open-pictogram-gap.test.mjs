import assert from 'node:assert/strict';
import {OPEN_PICTOGRAMS,buildNumberGapTargets,buildOpenPictogramGapTargets} from '../src/open-pictogram-library.js';

const strictPiece=OPEN_PICTOGRAMS.find(item=>item.strictEligible!==false);
const report={missingSounds:[{ipa:strictPiece.ipa,examples:[{word:'mot-test',ipa:`${strictPiece.ipa.replaceAll('/','')}/x/`,frequency:42,frame:['mer',`[${strictPiece.ipa.replaceAll('/','')}]`]}]}]};
const strictTargets=buildOpenPictogramGapTargets(report);
assert.equal(strictTargets.length,1);
assert.equal(strictTargets[0].mode,'strict');
assert.equal(strictTargets[0].assets,'ready');
assert.equal(strictTargets[0].source,'open-pictogram-gap');

const numberReport={missingSounds:[{ipa:'/dø/',examples:[{word:'deuxième-test',ipa:'/mɛʁdø/',frequency:10,frame:['mer','[dø]']}]}]};
const numberTargets=buildNumberGapTargets(numberReport);
assert.equal(numberTargets.length,1);
assert.equal(numberTargets[0].mode,'general');
assert.deepEqual(numberTargets[0].operations[1],{type:'grapheme',grapheme:'2',reading:'deux'});

const ambiguous=OPEN_PICTOGRAMS.find(item=>item.strictEligible===false);
const ambiguousReport={missingSounds:[{ipa:ambiguous.ipa,examples:[{word:'ambigu',ipa:ambiguous.ipa,frequency:1,frame:[`[${ambiguous.ipa}]`,'mer']}]}]};
assert.equal(buildOpenPictogramGapTargets(ambiguousReport).length,0,'general-only assets do not unlock strict targets');
console.log('open pictogram coverage-gap targets: ok');