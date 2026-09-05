import {readFile,writeFile} from 'node:fs/promises';
import {buildSoundRepresentationPriorities} from '../src/sound-representation-priority.js';

const readJson=async path=>JSON.parse(await readFile(new URL(`../${path}`,import.meta.url),'utf8'));
const [corpus,readingSounds,lexiconSeed,expansion]=await Promise.all([
  readJson('data/attested-rebus-corpus.json'),
  readJson('data/research-reading-sounds.json'),
  readJson('data/lexicon-seed.json'),
  readJson('data/expansion-simulation.json')
]);
const priorities=buildSoundRepresentationPriorities({corpus,readingSounds,lexiconSeed,expansion});
const tracked=new Set(['ta','po','do']);
const focus=priorities.filter(item=>tracked.has(item.ipa));
const report={
  schemaVersion:'1.0',
  status:'research_measurement_only',
  note:'greedy_contextual gains depend on earlier selected sounds and must not be read as isolated causal gains.',
  focus,
  allPriorities:priorities
};
const output=new URL('../data/visual-research-priority-report.json',import.meta.url);
await writeFile(output,`${JSON.stringify(report,null,2)}\n`);
console.log(focus.map(({ipa,strictMultiPieceGain,impactMethod,totalAttestedRebuses})=>({ipa,strictMultiPieceGain,impactMethod,totalAttestedRebuses})));
