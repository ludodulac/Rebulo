import {normalizeIPA} from './phonetic-engine.js';

export const OPENMOJI_WAVE4_SOURCE=Object.freeze({
  id:'openmoji',
  project:'OpenMoji',
  license:'CC BY-SA 4.0',
  sourceCommit:'aeb8bb3a59e2de39c754ac79180c8131c906acea',
  repository:'https://github.com/hfg-gmuend/openmoji',
  assetBase:'https://raw.githubusercontent.com/hfg-gmuend/openmoji/aeb8bb3a59e2de39c754ac79180c8131c906acea/color/svg/'
});

// Selective product-conversion cohort. These rows are phonetic-structured general
// illustrations, not human naming evidence and not clinical validation.
const ROWS=Object.freeze([
  ['olive','olive','/oliv/','1FAD2'],
  ['aiguille','aiguille','/egɥij/','1FAA1'],
  ['noeud','nœud','/nø/','1FAA2'],
  ['couteau','couteau','/kuto/','1F52A']
]);

export const OPEN_PICTOGRAMS_WAVE_4=Object.freeze(ROWS.map(([id,label,ipa,code])=>Object.freeze({
  id,label,ipa,
  image:`${OPENMOJI_WAVE4_SOURCE.assetBase}${code}.svg`,
  assetSource:`openmoji:${code}`,
  sourceFile:`color/svg/${code}.svg`,
  sourceCommit:OPENMOJI_WAVE4_SOURCE.sourceCommit,
  sourceLicense:OPENMOJI_WAVE4_SOURCE.license,
  active:true,
  strictEligible:true,
  libraryTier:'phonetic_concept',
  clinicalStatus:'unreviewed',
  visualConfidence:0.9,
  labelStability:0.82
})));

export function buildWave4GapTargets(report={}){
  const strictByIpa=new Map();
  for(const item of OPEN_PICTOGRAMS_WAVE_4){
    const ipa=normalizeIPA(item.ipa);
    if(ipa&&!strictByIpa.has(ipa))strictByIpa.set(ipa,item);
  }
  const out=[];const seen=new Set();
  for(const gap of report?.missingSounds||[]){
    if(!strictByIpa.has(normalizeIPA(gap?.ipa||'')))continue;
    for(const example of gap?.examples||[]){
      if(!example?.word||!example?.ipa)continue;
      const key=`${String(example.word).toLowerCase()}|${normalizeIPA(example.ipa)}`;
      if(seen.has(key))continue;
      seen.add(key);
      out.push({target:example.word,targetIpa:example.ipa,mode:'strict',assets:'ready',source:'open-pictogram-wave4-gap',generated:true,frequency:Number(example.frequency||0),operationCount:Array.isArray(example.frame)?example.frame.length:2});
    }
  }
  return out;
}

export function wave4LibraryStats(){
  return {total:OPEN_PICTOGRAMS_WAVE_4.length,strictEligible:OPEN_PICTOGRAMS_WAVE_4.length,generalOnly:0,source:OPENMOJI_WAVE4_SOURCE.project,license:OPENMOJI_WAVE4_SOURCE.license};
}
