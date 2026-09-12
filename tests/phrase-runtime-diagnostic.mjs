import {readFileSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {buildPronunciationLookup,phraseToContinuousIPA,planPhraseRepresentationPaths} from '../src/rebus-phrase-phonetics.js';
import {buildRepresentationPathIndex} from '../src/rebus-representation-paths.js';
import {playableRepresentationBankRows} from '../src/generated-play-catalog.js';

const json=path=>JSON.parse(readFileSync(new URL(`../${path}`,import.meta.url),'utf8'));
const pronunciationSource=json('data/rebus-pronunciation-lexicon.json');
const soundCatalog=json('data/rebus-sound-catalog.json');
const visibleConventions=json('data/rebus-visible-conventions.json');

const decodeStart=performance.now();
const pronunciationLookup=buildPronunciationLookup(pronunciationSource);
const pronunciationBuildMs=performance.now()-decodeStart;
const bankStart=performance.now();
const bankRows=playableRepresentationBankRows(soundCatalog,visibleConventions);
const optionIndex=buildRepresentationPathIndex(bankRows);
const bankBuildMs=performance.now()-bankStart;

const phrases=['ranger la maison','pili','merci papa','papa'];
const cases={};
for(const phrase of phrases){
  const phonetics=phraseToContinuousIPA(phrase,pronunciationLookup);
  const started=performance.now();
  const planned=planPhraseRepresentationPaths(phrase,pronunciationLookup,bankRows,{mode:'general',limit:6,maxPieces:16,allowGaps:true,optionIndex});
  const planMs=performance.now()-started;
  const route=planned.routes?.[0]||null;
  cases[phrase]={
    phonetics:{
      complete:phonetics.complete,
      continuousIpa:phonetics.continuousIpa,
      words:phonetics.words.map(word=>({text:word.text,ipa:word.ipa,resolved:word.resolved,pronunciationMethod:word.pronunciationMethod,unitStart:word.unitStart,unitEnd:word.unitEnd})),
      unresolvedWords:phonetics.unresolvedWords
    },
    status:planned.status,
    optionIndexStats:planned.optionIndexStats,
    planMs:Number(planMs.toFixed(2)),
    route:route?{
      complete:route.complete,
      coverageRatio:route.scoreBreakdown?.coverageRatio||0,
      coverageUnits:route.coverageUnits,
      uncoveredUnits:route.uncoveredUnits,
      operations:route.operations.map(op=>({kind:op.kind,label:op.label,targetIpa:op.targetIpa,image:op.image||null,symbol:op.symbol||null,crossesWordBoundary:op.crossesWordBoundary,sourceWords:(op.sourceWords||[]).map(word=>word.text)}))
    }:null
  };
}

const report={
  pronunciationRows:Array.isArray(pronunciationSource.rows)?pronunciationSource.rows.length:null,
  pronunciationForms:pronunciationLookup.size,
  pronunciationBuildMs:Number(pronunciationBuildMs.toFixed(2)),
  bankRows:bankRows.length,
  optionCount:optionIndex.optionCount,
  bankBuildMs:Number(bankBuildMs.toFixed(2)),
  cases
};
writeFileSync('phrase-runtime-diagnostic.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
