import {readFileSync,writeFileSync} from 'node:fs';
import {buildAutomaticCreatorTargets} from '../src/creator-catalog.js';
import {buildNumberGapTargets,buildOpenPictogramGapTargets} from '../src/open-pictogram-library.js';
import {buildWave2GapTargets} from '../src/open-pictogram-library-wave2.js';
import {buildWave3GapTargets} from '../src/open-pictogram-library-wave3.js';
import {playableRepresentationBankRows,generatedPlayableBankRebuses} from '../src/generated-play-catalog.js';
import {assertExactPlayableRounds} from '../src/play-game.js';

const json=path=>JSON.parse(readFileSync(new URL(`../${path}`,import.meta.url),'utf8'));
const soundCatalog=json('data/rebus-sound-catalog.json');
const visibleConventions=json('data/rebus-visible-conventions.json');
const coverage=json('data/coverage-report.json');
const bankRows=playableRepresentationBankRows(soundCatalog,visibleConventions);
const playRebuses=generatedPlayableBankRebuses(coverage,soundCatalog,visibleConventions);
assertExactPlayableRounds(playRebuses,'compiled Play runtime');
const creatorTargets=[
  ...buildAutomaticCreatorTargets(coverage),
  ...buildOpenPictogramGapTargets(coverage),
  ...buildWave2GapTargets(coverage),
  ...buildWave3GapTargets(coverage),
  ...buildNumberGapTargets(coverage)
];
const payload={
  status:'compiled_runtime_view_not_editorial_source',
  generatedFrom:['data/rebus-sound-catalog.json','data/rebus-visible-conventions.json','data/coverage-report.json'],
  bankRows,
  playRebuses,
  creatorTargets
};
const serialized=JSON.stringify(payload);
writeFileSync('data/rebulo-compact-runtime.json',serialized);
console.log(JSON.stringify({bankRows:bankRows.length,playRebuses:playRebuses.length,creatorTargets:creatorTargets.length,bytes:Buffer.byteLength(serialized),playPhoneticInvariant:'exact'}));
