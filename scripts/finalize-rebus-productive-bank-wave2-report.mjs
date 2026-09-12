import fs from 'node:fs';
import {buildProductiveBank} from '../src/rebus-productive-bank.js';
import {normalizeIPA} from '../src/phonetic-engine.js';

const fragmentIdeas=JSON.parse(fs.readFileSync('data/rebus-fragment-representation-ideas.json','utf8'));
const wave1=JSON.parse(fs.readFileSync('data/rebus-productive-bank-wave1.json','utf8'));
const wave2=JSON.parse(fs.readFileSync('data/rebus-productive-bank-wave2.json','utf8'));
const audit=JSON.parse(fs.readFileSync('data/rebus-representation-bank-audit.json','utf8'));
const reportPath='docs/REBUS_PRODUCTIVE_BANK_WAVE2_REPORT.md';
const metricsPath='data/rebus-productive-bank-wave2-useful-metrics.json';

const bank=buildProductiveBank({fragmentIdeas,productiveWaves:[wave1,wave2]});
const seriousSound=sound=>sound.visibleConventions.length>0||sound.representations.some(rep=>rep.editorialStatus==='retain'&&(rep.visualBrief||rep.representationProposed));
const seriousAll=[...bank.values()].filter(seriousSound);
const usefulExactIpas=new Set((audit.usefulRows||[]).filter(row=>(row.exactWords||[]).length>0).map(row=>normalizeIPA(row.ipa)).filter(Boolean));
if(usefulExactIpas.size!==5741)throw new Error(`Expected 5741 useful exact-word sounds, got ${usefulExactIpas.size}`);
const seriousUseful=seriousAll.filter(sound=>usefulExactIpas.has(sound.ipa));
const percent=Number((seriousUseful.length/usefulExactIpas.size*100).toFixed(2));
const metrics={
  schemaVersion:'1.0',
  status:'editorial_coverage_measurement',
  usefulExactSoundDenominator:usefulExactIpas.size,
  seriousRepresentationSoundCountAll:seriousAll.length,
  seriousUsefulExactSoundCount:seriousUseful.length,
  usefulExactSoundSeriousRepresentationPercent:percent,
  interpretation:'The numerator is intersected with the 5,741 useful sounds that already have at least one exact French lexical candidate. Runtime activation and human naming validation remain unrelated.'
};
fs.writeFileSync(metricsPath,JSON.stringify(metrics,null,2)+'\n');
let report=fs.readFileSync(reportPath,'utf8');
report=report.replace(/- Sons avec au moins une représentation éditoriale sérieuse : \d+\./,`- Sons avec au moins une représentation éditoriale sérieuse, tous sons indexés confondus : ${seriousAll.length}.`);
report=report.replace(/- Couverture des 5 741 sons utiles par au moins une représentation sérieuse : [0-9.]+%\./,`- Sons utiles avec mot exact disposant d’au moins une représentation éditoriale sérieuse : ${seriousUseful.length} / ${usefulExactIpas.size}.\n- Couverture correspondante : ${percent.toFixed(2)}%.`);
fs.writeFileSync(reportPath,report);
console.log(JSON.stringify(metrics,null,2));
