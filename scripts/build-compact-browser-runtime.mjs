import {readFileSync,writeFileSync} from 'node:fs';
import {playableRepresentationBankRows,generatedPlayableBankRebuses} from '../src/generated-play-catalog.js';

const json=path=>JSON.parse(readFileSync(new URL(`../${path}`,import.meta.url),'utf8'));
const soundCatalog=json('data/rebus-sound-catalog.json');
const visibleConventions=json('data/rebus-visible-conventions.json');
const coverage=json('data/coverage-report.json');
const bankRows=playableRepresentationBankRows(soundCatalog,visibleConventions);
const playRebuses=generatedPlayableBankRebuses(coverage,soundCatalog,visibleConventions);
const payload={
  status:'compiled_runtime_view_not_editorial_source',
  generatedFrom:['data/rebus-sound-catalog.json','data/rebus-visible-conventions.json','data/coverage-report.json'],
  bankRows,
  playRebuses
};
writeFileSync('data/rebulo-compact-runtime.json',JSON.stringify(payload));
console.log(JSON.stringify({bankRows:bankRows.length,playRebuses:playRebuses.length,bytes:Buffer.byteLength(JSON.stringify(payload))}));
