import fs from 'node:fs';
import path from 'node:path';
import {buildWholeWordCandidateIndex} from '../src/syllable-representation-candidates.js';
import {buildApproximateLexicalIndex,findApproximateWholeWordCandidates} from '../src/rebus-approximation.js';
import {buildTargetVocabulary,applySchoolFrequencyEvidence,isRebuloPriorityTarget,rebuloUtilityWeight} from '../src/target-vocabulary.js';
import {isDrawableNamingCandidate} from '../src/drawable-opportunities.js';
import {ALL_OPEN_PICTOGRAMS} from '../src/pictogram-print-sheets.js';
import {normalizeIPA} from '../src/phonetic-engine.js';

const lexiquePath=process.argv[2]||'data/lexique4.compact.json';
const outputPath=process.argv[3]||'data/rebus-approximation-research.json';
const docPath=process.argv[4]||'docs/REBUS_APPROXIMATION_RESEARCH.md';
const schoolEvidencePath=process.argv[5]||'data/eduscol-frequency-lexicon.json';
const policyPath=process.argv[6]||'data/rebus-approximation-policy.json';
const maxAnalyzedWindows=Math.max(100,Number(process.env.REBUS_APPROXIMATION_WINDOW_LIMIT)||2000);

for(const required of [lexiquePath,policyPath])if(!fs.existsSync(required)){console.error(`Missing required file: ${required}`);process.exit(1);}
const lexique=JSON.parse(fs.readFileSync(lexiquePath,'utf8'));
const entries=Array.isArray(lexique.entries)?lexique.entries:[];
const policy=JSON.parse(fs.readFileSync(policyPath,'utf8'));
const schoolEvidence=fs.existsSync(schoolEvidencePath)?JSON.parse(fs.readFileSync(schoolEvidencePath,'utf8')):null;
let targets=buildTargetVocabulary(entries);
if(schoolEvidence)targets=applySchoolFrequencyEvidence(targets,schoolEvidence);
const usefulTargets=targets.filter(isRebuloPriorityTarget).filter(target=>target.syllabificationStatus==='source_exact'&&Array.isArray(target.syllables)&&target.syllables.length);
const exactIndex=buildWholeWordCandidateIndex(entries);
const approximateIndex=buildApproximateLexicalIndex(exactIndex);

// Existing illustrated assets are the cheapest and safest editorial leads: search them before proposing new artwork.
const assetExactIndex=new Map();
for(const item of ALL_OPEN_PICTOGRAMS){
  const ipa=normalizeIPA(item?.ipa||'');
  const label=String(item?.label||'').trim();
  if(!ipa||!label||!item?.image||item?.active===false)continue;
  if(!assetExactIndex.has(ipa))assetExactIndex.set(ipa,[]);
  assetExactIndex.get(ipa).push({
    word:label,lemma:label,pos:'NOM',frequency:0,syllableCount:null,
    assetId:item.id||null,image:item.image,source:'open_pictogram_library',
    visualConfidence:Number(item.visualConfidence)||null,labelStability:Number(item.labelStability)||null,
    sourceStrictEligible:item.strictEligible!==false,clinicalStatus:item.clinicalStatus||'unreviewed'
  });
}
const assetApproximateIndex=buildApproximateLexicalIndex(assetExactIndex);

const rows=new Map();
for(const target of usefulTargets){
  const syllables=target.syllables.map(normalizeIPA).filter(Boolean);
  const seen=new Set();
  for(let start=0;start<syllables.length;start++){
    for(let length=1;length<=2&&start+length<=syllables.length;length++){
      const ipa=syllables.slice(start,start+length).join('');
      if(!ipa)continue;
      let row=rows.get(ipa);
      if(!row){row={ipa,syllableSpans:new Set(),usefulOccurrenceCount:0,usefulTargetCount:0,usefulWeightedGain:0,minAgeBandCandidate:12,examples:[],candidateMap:new Map()};rows.set(ipa,row);}
      row.syllableSpans.add(length);
      row.usefulOccurrenceCount+=1;
      if(seen.has(ipa))continue;
      seen.add(ipa);
      row.usefulTargetCount+=1;
      row.usefulWeightedGain+=(Number(target.frequency)||0)*rebuloUtilityWeight(target);
      row.minAgeBandCandidate=Math.min(row.minAgeBandCandidate,Number(target.ageBandCandidate)||12);
      if(row.examples.length<8&&!row.examples.includes(target.target))row.examples.push(target.target);
    }
  }
}

const prioritizedRows=[...rows.values()].sort((a,b)=>
  b.usefulWeightedGain-a.usefulWeightedGain||
  b.usefulTargetCount-a.usefulTargetCount||
  b.usefulOccurrenceCount-a.usefulOccurrenceCount||
  a.minAgeBandCandidate-b.minAgeBandCandidate||
  a.ipa.localeCompare(b.ipa)
).slice(0,maxAnalyzedWindows);

const lexicalPos=value=>String(value||'').trim().toUpperCase().split(':')[0];
const visualCandidateScore=candidate=>{
  const existingAsset=candidate.source==='open_pictogram_library'?1:0;
  const noun=lexicalPos(candidate.pos)==='NOM'?1:0;
  const frequency=Math.max(0,Number(candidate.frequency)||0);
  const visual=Number(candidate.visualConfidence)||0;
  const label=Number(candidate.labelStability)||0;
  return existingAsset*10000+noun*1000+(visual+label)*80+Math.log10(1+frequency)*20-(Number(candidate.approximation?.weightedRatio)||1)*100;
};

for(const row of prioritizedRows){
  const assetCandidates=findApproximateWholeWordCandidates(row.ipa,assetExactIndex,policy,{approximateIndex:assetApproximateIndex,limit:32,maxLengthDelta:1})
    .map(candidate=>({...candidate,source:'open_pictogram_library'}));
  const lexicalCandidates=findApproximateWholeWordCandidates(row.ipa,exactIndex,policy,{approximateIndex,limit:48,maxLengthDelta:1})
    .filter(isDrawableNamingCandidate)
    .map(candidate=>({...candidate,source:'lexique_visual_lead'}));
  const candidates=[...assetCandidates,...lexicalCandidates].sort((a,b)=>visualCandidateScore(b)-visualCandidateScore(a)||a.word.localeCompare(b.word,'fr'));
  for(const candidate of candidates){
    const key=`${candidate.source}|${candidate.sourceIpa}|${String(candidate.word).toLocaleLowerCase('fr')}`;
    if(!row.candidateMap.has(key))row.candidateMap.set(key,candidate);
  }
}

const compactOperation=operation=>({
  type:operation.type,
  sourceUnit:operation.sourceUnit,
  targetUnit:operation.targetUnit,
  sourceIndex:operation.sourceIndex,
  targetIndex:operation.targetIndex,
  cost:operation.cost,
  ...(operation.editPosition?{editPosition:operation.editPosition}:{})
});

const compactCandidate=candidate=>({
  word:candidate.word,
  lemma:candidate.lemma,
  pos:candidate.pos,
  frequency:candidate.frequency,
  source:candidate.source,
  sourceIpa:candidate.sourceIpa,
  tier:candidate.approximation.tier,
  weightedRatio:candidate.approximation.weightedRatio,
  editorialApproximationPercent:candidate.approximation.editorialApproximationPercent,
  editCount:candidate.approximation.editCount,
  nounCandidate:lexicalPos(candidate.pos)==='NOM',
  existingAsset:candidate.source==='open_pictogram_library',
  ...(candidate.assetId?{assetId:candidate.assetId}:{}),
  ...(candidate.image?{image:candidate.image}:{}),
  ...(candidate.visualConfidence?{visualConfidence:candidate.visualConfidence}:{}),
  ...(candidate.labelStability?{labelStability:candidate.labelStability}:{}),
  operations:candidate.approximation.operations.map(compactOperation)
});

const ranked=prioritizedRows.map(row=>{
  const candidates=[...row.candidateMap.values()].map(compactCandidate);
  candidates.sort((a,b)=>Number(b.existingAsset)-Number(a.existingAsset)||Number(b.nounCandidate)-Number(a.nounCandidate)||a.weightedRatio-b.weightedRatio||a.editCount-b.editCount||b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));
  const assetCandidates=candidates.filter(candidate=>candidate.existingAsset);
  const nounCandidates=candidates.filter(candidate=>candidate.nounCandidate&&!candidate.existingAsset);
  const best=assetCandidates[0]||nounCandidates[0]||null;
  const utility=Number(row.usefulWeightedGain.toFixed(3));
  const score=best?Number((Math.log10(1+utility)*150+Math.log10(1+row.usefulTargetCount)*90+(best.existingAsset?350:0)+(best.nounCandidate?110:0)+(best.tier==='light'?80:35)+(1-best.weightedRatio)*60).toFixed(3)):0;
  return {ipa:row.ipa,syllableSpans:[...row.syllableSpans].sort(),usefulOccurrenceCount:row.usefulOccurrenceCount,usefulTargetCount:row.usefulTargetCount,usefulWeightedGain:utility,minAgeBandCandidate:row.minAgeBandCandidate,examples:row.examples,candidateCount:candidates.length,existingAssetCandidateCount:assetCandidates.length,nounCandidateCount:nounCandidates.length,bestCandidate:best,candidates:candidates.slice(0,12),researchPriorityScore:score};
}).filter(row=>row.bestCandidate).sort((a,b)=>b.researchPriorityScore-a.researchPriorityScore||Number(b.existingAssetCandidateCount>0)-Number(a.existingAssetCandidateCount>0)||b.usefulWeightedGain-a.usefulWeightedGain||b.usefulTargetCount-a.usefulTargetCount||a.ipa.localeCompare(b.ipa));

const stats={
  usefulTargetCount:usefulTargets.length,
  usefulSoundWindowCount:rows.size,
  analyzedSoundWindowCount:prioritizedRows.length,
  approximationCandidateWindowCount:ranked.length,
  existingAssetCandidateWindowCount:ranked.filter(row=>row.existingAssetCandidateCount>0).length,
  lightExistingAssetWindowCount:ranked.filter(row=>row.candidates.some(candidate=>candidate.existingAsset&&candidate.tier==='light')).length,
  lexicalNounFallbackWindowCount:ranked.filter(row=>row.existingAssetCandidateCount===0&&row.nounCandidateCount>0).length,
  totalExistingAssetCandidateCount:ranked.reduce((sum,row)=>sum+row.existingAssetCandidateCount,0),
  totalLexicalNounCandidateCount:ranked.reduce((sum,row)=>sum+row.nounCandidateCount,0)
};
const report={generatedAt:new Date().toISOString(),status:'research_only',scope:'highest_value_useful_sound_windows_existing_assets_first_then_lexical_visual_leads',policyVersion:policy.version||null,windowLimit:maxAnalyzedWindows,source:{name:lexique.source||'Lexique 4',license:lexique.license||null,entryCount:entries.length},stats,rows:ranked};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(report,null,2));

const opLabel=operation=>{
  const edit=operation.type==='substitution'?`${operation.sourceUnit}→${operation.targetUnit}`:operation.type==='insertion'?`+${operation.targetUnit}`:`−${operation.sourceUnit}`;
  return operation.editPosition?`${edit} (${operation.editPosition==='internal'?'interne':'bord'})`:edit;
};
const lines=[
  '# Rebulo — recherche des approximations phonétiques',
  '',
  '> Rapport de recherche uniquement. Une approximation n’est jamais assimilée au mode strict et le pourcentage est un score éditorial, non clinique.',
  '',
  `- Cibles utiles prises en compte : ${stats.usefulTargetCount}.`,
  `- Fenêtres utiles distinctes inventoriées : ${stats.usefulSoundWindowCount}.`,
  `- Fenêtres à plus forte utilité effectivement analysées : ${stats.analyzedSoundWindowCount}.`,
  `- Fenêtres avec au moins une piste approximative visuelle : ${stats.approximationCandidateWindowCount}.`,
  `- Fenêtres pouvant réutiliser directement un pictogramme existant : ${stats.existingAssetCandidateWindowCount}.`,
  `- Fenêtres avec un pictogramme existant dans le niveau petite approximation : ${stats.lightExistingAssetWindowCount}.`,
  `- Fenêtres sans asset proche mais avec un nom Lexique nominal à examiner : ${stats.lexicalNounFallbackWindowCount}.`,
  '',
  'L’ordre est volontaire : **réutiliser un pictogramme déjà présent** avant de proposer un nouveau dessin. Les noms Lexique ne sont que des pistes de secours à curater humainement.',
  'Une image existante utilisée en approximation conserve son vrai nom et sa vraie prononciation ; elle ne devient jamais une représentation stricte du son cible.',
  '',
  '## Priorités',
  '',
  '| Rang | Son cible | Piste | Source | Son réel | Approx. | Modifications | Cibles utiles | Exemples |',
  '|---:|---|---|---|---|---:|---|---:|---|',
  ...ranked.slice(0,200).map((row,index)=>{
    const c=row.bestCandidate;
    const source=c.existingAsset?'pictogramme existant':'nouvelle piste lexicale';
    return `| ${index+1} | /${row.ipa}/ | ${c.word} | ${source} | /${c.sourceIpa}/ | ${c.editorialApproximationPercent}% | ${c.operations.map(opLabel).join(', ')||'—'} | ${row.usefulTargetCount} | ${row.examples.slice(0,4).join(', ')} |`;
  })
];
fs.mkdirSync(path.dirname(docPath),{recursive:true});
fs.writeFileSync(docPath,lines.join('\n')+'\n');
console.log(JSON.stringify(stats,null,2));
