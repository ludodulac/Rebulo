import fs from 'node:fs';
import path from 'node:path';
import {buildWholeWordCandidateIndex} from '../src/syllable-representation-candidates.js';
import {buildApproximateLexicalIndex,findApproximateWholeWordCandidates} from '../src/rebus-approximation.js';
import {buildTargetVocabulary,applySchoolFrequencyEvidence,isRebuloPriorityTarget,rebuloUtilityWeight} from '../src/target-vocabulary.js';
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

for(const row of prioritizedRows){
  const candidates=findApproximateWholeWordCandidates(row.ipa,exactIndex,policy,{approximateIndex,limit:24,maxLengthDelta:1});
  for(const candidate of candidates){
    const key=`${candidate.sourceIpa}|${String(candidate.word).toLocaleLowerCase('fr')}`;
    if(!row.candidateMap.has(key))row.candidateMap.set(key,candidate);
  }
}

const compactCandidate=candidate=>({
  word:candidate.word,
  lemma:candidate.lemma,
  pos:candidate.pos,
  frequency:candidate.frequency,
  sourceIpa:candidate.sourceIpa,
  tier:candidate.approximation.tier,
  weightedRatio:candidate.approximation.weightedRatio,
  editorialApproximationPercent:candidate.approximation.editorialApproximationPercent,
  editCount:candidate.approximation.editCount,
  operations:candidate.approximation.operations.map(operation=>({type:operation.type,sourceUnit:operation.sourceUnit,targetUnit:operation.targetUnit,sourceIndex:operation.sourceIndex,targetIndex:operation.targetIndex,cost:operation.cost}))
});

const ranked=prioritizedRows.map(row=>{
  const candidates=[...row.candidateMap.values()].map(compactCandidate);
  candidates.sort((a,b)=>a.weightedRatio-b.weightedRatio||a.editCount-b.editCount||b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));
  const best=candidates[0]||null;
  const utility=Number(row.usefulWeightedGain.toFixed(3));
  const score=best?Number((Math.log10(1+utility)*150+Math.log10(1+row.usefulTargetCount)*90+(best.tier==='light'?80:35)+(1-best.weightedRatio)*60).toFixed(3)):0;
  return {ipa:row.ipa,syllableSpans:[...row.syllableSpans].sort(),usefulOccurrenceCount:row.usefulOccurrenceCount,usefulTargetCount:row.usefulTargetCount,usefulWeightedGain:utility,minAgeBandCandidate:row.minAgeBandCandidate,examples:row.examples,candidateCount:candidates.length,bestCandidate:best,candidates:candidates.slice(0,12),researchPriorityScore:score};
}).filter(row=>row.candidateCount>0).sort((a,b)=>b.researchPriorityScore-a.researchPriorityScore||b.usefulWeightedGain-a.usefulWeightedGain||b.usefulTargetCount-a.usefulTargetCount||a.ipa.localeCompare(b.ipa));

const stats={
  usefulTargetCount:usefulTargets.length,
  usefulSoundWindowCount:rows.size,
  analyzedSoundWindowCount:prioritizedRows.length,
  approximationCandidateWindowCount:ranked.length,
  lightCandidateWindowCount:ranked.filter(row=>row.candidates.some(candidate=>candidate.tier==='light')).length,
  looseOnlyCandidateWindowCount:ranked.filter(row=>row.candidates.length&&!row.candidates.some(candidate=>candidate.tier==='light')).length,
  totalCandidateCount:ranked.reduce((sum,row)=>sum+row.candidateCount,0)
};
const report={generatedAt:new Date().toISOString(),status:'research_only',scope:'highest_value_useful_sound_windows_only',policyVersion:policy.version||null,windowLimit:maxAnalyzedWindows,source:{name:lexique.source||'Lexique 4',license:lexique.license||null,entryCount:entries.length},stats,rows:ranked};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(report,null,2));

const opLabel=operation=>operation.type==='substitution'?`${operation.sourceUnit}→${operation.targetUnit}`:operation.type==='insertion'?`+${operation.targetUnit}`:`−${operation.sourceUnit}`;
const lines=[
  '# Rebulo — recherche des approximations phonétiques',
  '',
  '> Rapport de recherche uniquement. Une approximation n’est jamais assimilée au mode strict et le pourcentage est un score éditorial, non clinique.',
  '',
  `- Cibles utiles prises en compte : ${stats.usefulTargetCount}.`,
  `- Fenêtres utiles distinctes inventoriées : ${stats.usefulSoundWindowCount}.`,
  `- Fenêtres à plus forte utilité effectivement analysées pour approximation : ${stats.analyzedSoundWindowCount}.`,
  `- Fenêtres analysées avec au moins un mot entier approximatif admissible : ${stats.approximationCandidateWindowCount}.`,
  `- Fenêtres avec au moins une petite approximation : ${stats.lightCandidateWindowCount}.`,
  `- Fenêtres avec seulement des approximations de magazine : ${stats.looseOnlyCandidateWindowCount}.`,
  '',
  'La recherche approximative est volontairement bornée aux fenêtres les plus utiles. Le catalogue phonétique exact reste exhaustif ; cette file est seulement une file éditoriale de pistes à examiner.',
  '',
  '## Priorités',
  '',
  '| Rang | Son cible | Candidat | Son réel | Approx. | Modifications | Cibles utiles | Exemples |',
  '|---:|---|---|---|---:|---|---:|---|',
  ...ranked.slice(0,200).map((row,index)=>{
    const c=row.bestCandidate;
    return `| ${index+1} | /${row.ipa}/ | ${c.word} | /${c.sourceIpa}/ | ${c.editorialApproximationPercent}% | ${c.operations.map(opLabel).join(', ')||'—'} | ${row.usefulTargetCount} | ${row.examples.slice(0,4).join(', ')} |`;
  })
];
fs.mkdirSync(path.dirname(docPath),{recursive:true});
fs.writeFileSync(docPath,lines.join('\n')+'\n');
console.log(JSON.stringify(stats,null,2));
