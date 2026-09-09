import fs from 'node:fs';
import path from 'node:path';
import {SYLLABLE_PRINT_LIBRARY} from '../src/syllable-print-library.js';
import {ALL_OPEN_PICTOGRAMS} from '../src/pictogram-print-sheets.js';
import {buildSyllableWindowInventory,groupRepresentationsBySound,phonemeEditDistance} from '../src/rebus-sound-catalog.js';
import {buildWholeWordCandidateIndex,wholeWordRepresentationCandidates} from '../src/syllable-representation-candidates.js';
import {isDrawableNamingCandidate} from '../src/drawable-opportunities.js';
import {buildTargetVocabulary,applySchoolFrequencyEvidence,isRebuloPriorityTarget,rebuloUtilityWeight,targetVocabularyStats} from '../src/target-vocabulary.js';
import {normalizeIPA} from '../src/phonetic-engine.js';

const lexiquePath=process.argv[2]||'data/lexique4.compact.json';
const outputPath=process.argv[3]||'data/rebus-sound-catalog.json';
const docPath=process.argv[4]||'docs/REBUS_SOUND_CATALOG_REPORT.md';
const schoolEvidencePath=process.argv[5]||'data/eduscol-frequency-lexicon.json';

if(!fs.existsSync(lexiquePath)){
  console.error(`Lexique compact introuvable: ${lexiquePath}`);
  process.exit(1);
}

const source=JSON.parse(fs.readFileSync(lexiquePath,'utf8'));
const entries=Array.isArray(source.entries)?source.entries:[];
const visibleConventions=JSON.parse(fs.readFileSync('data/rebus-visible-conventions.json','utf8'));
const researchSeeds=JSON.parse(fs.readFileSync('data/rebus-sound-research-seeds.json','utf8'));
const candidateBank=JSON.parse(fs.readFileSync('data/phonetic-brick-candidates.json','utf8'));
const schoolEvidence=fs.existsSync(schoolEvidencePath)?JSON.parse(fs.readFileSync(schoolEvidencePath,'utf8')):null;

const shortBrickImages=SYLLABLE_PRINT_LIBRARY.map(item=>({
  id:`syllable-print:${item.id}`,
  label:item.label,
  ipa:normalizeIPA(item.ipa),
  kind:'whole_word_image',
  status:item.status,
  image:item.image,
  source:'syllable_print_library'
}));

const openPictogramImages=ALL_OPEN_PICTOGRAMS.filter(item=>item?.label&&item?.ipa&&item?.image).map(item=>({
  id:`open-pictogram:${item.id}`,
  label:item.label,
  ipa:normalizeIPA(item.ipa),
  kind:'whole_word_image',
  status:item.active!==false&&item.strictEligible!==false?'active':'general',
  image:item.image,
  source:'open_pictogram_library',
  strictEligible:item.strictEligible!==false,
  clinicalStatus:item.clinicalStatus||'unreviewed',
  visualConfidence:Number(item.visualConfidence)||null,
  labelStability:Number(item.labelStability)||null
}));

const curatedCandidates=(candidateBank.segments||[]).flatMap(segment=>(segment.candidates||[]).map(candidate=>({
  id:`curated:${segment.ipa}:${candidate.label}`,
  label:candidate.label,
  ipa:normalizeIPA(segment.ipa),
  kind:candidate.candidateType||'research_candidate',
  status:'research',
  source:'phonetic_brick_candidates',
  researchDecision:candidate.researchDecision||null,
  visualPlausibility:candidate.visualPlausibility||null,
  spontaneousNamingRisk:candidate.spontaneousNamingRisk||null,
  nextGate:candidate.nextGate||null
})));

const conventions=(visibleConventions.entries||[]).map(item=>({...item,source:'rebus_visible_conventions'}));
const seeds=(researchSeeds.entries||[]).map((item,index)=>({
  id:`seed:${index+1}`,
  label:item.candidate,
  ipa:normalizeIPA(item.candidateIpa),
  targetIpa:normalizeIPA(item.targetIpa),
  kind:item.kind,
  status:'research',
  source:'rebus_sound_research_seeds',
  match:item.match,
  visualPriority:item.visualPriority||null,
  distance:phonemeEditDistance(item.candidateIpa,item.targetIpa),
  note:item.note||null
}));

const sourceRank=Object.freeze({
  syllable_print_library:50,
  open_pictogram_library:40,
  rebus_visible_conventions:35,
  phonetic_brick_candidates:30,
  rebus_sound_research_seeds:20
});
const dedupe=new Map();
for(const item of [...shortBrickImages,...openPictogramImages,...curatedCandidates,...conventions,...seeds]){
  const ipa=normalizeIPA(item.ipa||'');
  if(!ipa||!item.label)continue;
  const key=`${ipa}|${item.kind}|${String(item.label).toLocaleLowerCase('fr')}`;
  const previous=dedupe.get(key);
  if(!previous||(sourceRank[item.source]||0)>(sourceRank[previous.source]||0))dedupe.set(key,{...item,ipa});
}
const representations=[...dedupe.values()];
const representationGroups=groupRepresentationsBySound(representations);
const representationMap=new Map(representationGroups.map(group=>[group.ipa,group.representations]));
const lexicalCandidateIndex=buildWholeWordCandidateIndex(entries);
const windows=buildSyllableWindowInventory(entries,{minSyllables:1,maxSyllables:2});

let targets=buildTargetVocabulary(entries);
if(schoolEvidence)targets=applySchoolFrequencyEvidence(targets,schoolEvidence);
const usefulTargets=targets.filter(isRebuloPriorityTarget);
const utilityByIpa=new Map();
for(const target of usefulTargets){
  if(target?.syllabificationStatus!=='source_exact'||!Array.isArray(target.syllables))continue;
  const syllables=target.syllables.map(normalizeIPA).filter(Boolean);
  if(!syllables.length)continue;
  const seen=new Set();
  for(let start=0;start<syllables.length;start++){
    for(let length=1;length<=2&&start+length<=syllables.length;length++){
      const ipa=syllables.slice(start,start+length).join('');
      if(!ipa)continue;
      let row=utilityByIpa.get(ipa);
      if(!row){row={usefulOccurrenceCount:0,usefulTargetCount:0,usefulWeightedGain:0,schoolTargetCount:0,minAgeBandCandidate:12,usefulExamples:[]};utilityByIpa.set(ipa,row);}
      row.usefulOccurrenceCount+=1;
      if(seen.has(ipa))continue;
      seen.add(ipa);
      row.usefulTargetCount+=1;
      row.usefulWeightedGain+=(Number(target.frequency)||0)*rebuloUtilityWeight(target);
      if(target.schoolFrequencyEvidence)row.schoolTargetCount+=1;
      row.minAgeBandCandidate=Math.min(row.minAgeBandCandidate,Number(target.ageBandCandidate)||12);
      if(row.usefulExamples.length<6&&!row.usefulExamples.includes(target.target))row.usefulExamples.push(target.target);
    }
  }
}
for(const value of utilityByIpa.values())value.usefulWeightedGain=Number(value.usefulWeightedGain.toFixed(3));

const compactCandidate=candidate=>({word:candidate.word,pos:candidate.pos,frequency:candidate.frequency,syllableCount:candidate.syllableCount});
const compactRepresentation=item=>({
  id:item.id,label:item.label,kind:item.kind,tier:item.tier,source:item.source,
  ...(item.image?{image:item.image}:{}),
  ...(item.match?{match:item.match}:{}),
  ...(item.distance?{distance:item.distance}:{}),
  ...(item.strictEligible===false?{strictEligible:false}:{}),
  ...(item.researchDecision?{researchDecision:item.researchDecision}:{})
});
const countTier=(reps,tier)=>reps.filter(item=>item.tier===tier).length;
const classifyResearchState=({readyCount,researchImageCount,nounCandidateCount,drawableCandidateCount,exactCandidateCount,visibleConventionCount,approximationCount})=>{
  if(readyCount>0)return 'exact_image_ready';
  if(researchImageCount>0)return 'exact_image_research';
  if(nounCandidateCount>0)return 'exact_noun_candidate_to_review';
  if(drawableCandidateCount>0)return 'exact_lexical_candidate_to_review';
  if(exactCandidateCount>0)return 'exact_lexical_candidate_low_visual_confidence';
  if(visibleConventionCount>0)return 'visible_convention_only';
  if(approximationCount>0)return 'approximation_only';
  return 'unresolved';
};
const scoreResearchPriority=row=>{
  if(row.exactImageReadyCount>0)return 0;
  let score=Math.log10(1+Math.max(0,row.occurrenceCount))*35;
  score+=Math.log10(1+Math.max(0,row.usefulTargetCount))*210;
  score+=Math.log10(1+Math.max(0,row.usefulWeightedGain))*38;
  score+=Math.min(45,row.schoolTargetCount*3);
  if(row.syllableSpans.includes(2))score+=35;
  if(row.nounLexicalCandidateCount>0)score+=150+Math.min(35,row.nounLexicalCandidateCount*7);
  else if(row.drawableLexicalCandidateCount>0)score+=70+Math.min(20,row.drawableLexicalCandidateCount*4);
  else if(row.exactLexicalCandidateCount>0)score+=25;
  if(row.exactImageResearchCount>0)score+=75;
  if(row.visibleConventionCount>0)score-=10;
  if(row.approximationCount>0)score+=5;
  return Number(Math.max(0,score).toFixed(3));
};

const rows=windows.map(row=>{
  const reps=representationMap.get(row.ipa)||[];
  const exactCandidates=wholeWordRepresentationCandidates(row.ipa,lexicalCandidateIndex,8);
  const drawableCandidates=exactCandidates.filter(isDrawableNamingCandidate);
  const nounCandidates=drawableCandidates.filter(candidate=>String(candidate.pos||'').toUpperCase().split(':')[0]==='NOM');
  const utility=utilityByIpa.get(row.ipa)||{usefulOccurrenceCount:0,usefulTargetCount:0,usefulWeightedGain:0,schoolTargetCount:0,minAgeBandCandidate:null,usefulExamples:[]};
  const counts={
    readyCount:countTier(reps,'exact_image_ready'),
    researchImageCount:countTier(reps,'exact_image_research'),
    visibleConventionCount:countTier(reps,'explicit_visible_convention'),
    approximationCount:countTier(reps,'approximation_research')
  };
  const enriched={
    ipa:row.ipa,
    occurrenceCount:row.occurrenceCount,
    syllableSpans:row.syllableSpans,
    examples:row.examples.slice(0,4),
    ...utility,
    representationCount:reps.length,
    exactImageReadyCount:counts.readyCount,
    exactImageResearchCount:counts.researchImageCount,
    visibleConventionCount:counts.visibleConventionCount,
    approximationCount:counts.approximationCount,
    exactLexicalCandidateCount:exactCandidates.length,
    drawableLexicalCandidateCount:drawableCandidates.length,
    nounLexicalCandidateCount:nounCandidates.length,
    exactLexicalCandidates:exactCandidates.slice(0,3).map(compactCandidate),
    nounLexicalCandidates:nounCandidates.slice(0,3).map(compactCandidate),
    representations:reps.map(compactRepresentation),
    researchState:classifyResearchState({...counts,nounCandidateCount:nounCandidates.length,drawableCandidateCount:drawableCandidates.length,exactCandidateCount:exactCandidates.length})
  };
  return {...enriched,researchPriorityScore:scoreResearchPriority(enriched)};
});

const covered=rows.filter(row=>row.representationCount>0);
const missing=rows.filter(row=>row.representationCount===0);
const ready=rows.filter(row=>row.exactImageReadyCount>0);
const researchImages=rows.filter(row=>row.exactImageReadyCount===0&&row.exactImageResearchCount>0);
const nounCandidateRows=rows.filter(row=>row.exactImageReadyCount===0&&row.nounLexicalCandidateCount>0);
const unresolved=rows.filter(row=>row.researchState==='unresolved');
const queueSort=(a,b)=>b.researchPriorityScore-a.researchPriorityScore||b.usefulTargetCount-a.usefulTargetCount||b.occurrenceCount-a.occurrenceCount||a.ipa.localeCompare(b.ipa);
const visualResearchQueue=rows.filter(row=>row.exactImageReadyCount===0).sort(queueSort).slice(0,1000);
const existingPrototypeReviewQueue=rows.filter(row=>row.exactImageReadyCount===0&&row.exactImageResearchCount>0).sort(queueSort).slice(0,250);
const newImageResearchQueue=rows.filter(row=>row.exactImageReadyCount===0&&row.exactImageResearchCount===0&&row.nounLexicalCandidateCount>0).sort(queueSort).slice(0,1000);
const observedSounds=new Set(rows.map(row=>row.ipa));
const orphanRepresentations=representationGroups.filter(group=>!observedSounds.has(group.ipa)).map(group=>({ipa:group.ipa,representations:group.representations.map(compactRepresentation)}));
const queueRow=row=>({
  ipa:row.ipa,syllableSpans:row.syllableSpans,researchPriorityScore:row.researchPriorityScore,researchState:row.researchState,
  occurrenceCount:row.occurrenceCount,usefulTargetCount:row.usefulTargetCount,usefulWeightedGain:row.usefulWeightedGain,schoolTargetCount:row.schoolTargetCount,minAgeBandCandidate:row.minAgeBandCandidate,
  nounLexicalCandidates:row.nounLexicalCandidates,exactLexicalCandidates:row.exactLexicalCandidates,representations:row.representations,usefulExamples:row.usefulExamples,examples:row.examples
});
const targetStats=targetVocabularyStats(targets);
const report={
  generatedAt:new Date().toISOString(),
  status:'research_mapping_only',
  scope:'exhaustive_source_exact_adjacent_windows_one_or_two_syllables_with_useful_product_priority',
  methodology:{
    sourceSyllables:'All Lexique rows whose stored IPA syllabification concatenates exactly to the full IPA are inventoried, including validated monosyllables.',
    productPriority:'The exhaustive inventory is separate from prioritization. Priority is driven first by Rebulo useful target vocabulary and public school-frequency evidence, then by corpus recurrence and representation opportunities.',
    overlap:'All adjacent one- and two-syllable windows are retained; phrase-level cross-word windows use the same primitives at runtime/research time.',
    representations:'Short sound bricks, the full existing open pictogram library, curated phonetic candidates, visible conventions and preserved research seeds are consolidated without activating research rows.',
    lexicalCandidates:'Exact whole-pronunciation Lexique candidates are indexed once. Noun candidates receive a research bonus because they are generally better image hypotheses, but still require human naming review.',
    approximations:'Approximate seeds keep their own source reading and explicit phoneme edit distance; they never become strict by scoring.',
    researchQueues:'existingPrototypeReviewQueue is for already-prototyped exact images; newImageResearchQueue is for exact noun candidates that still lack an image; visualResearchQueue combines all non-ready routes.'
  },
  source:{name:source.source||'Lexique 4',license:source.license||null,entryCount:entries.length},
  targetVocabulary:{...targetStats,usefulTargetCount:usefulTargets.length},
  stats:{
    windowCount:rows.length,
    coveredWindowCount:covered.length,
    missingWindowCount:missing.length,
    exactImageReadyWindowCount:ready.length,
    exactImageResearchWindowCount:researchImages.length,
    exactNounCandidateWindowCount:nounCandidateRows.length,
    unresolvedWindowCount:unresolved.length,
    representationCount:representations.length,
    openPictogramRepresentationCount:openPictogramImages.length,
    shortBrickRepresentationCount:shortBrickImages.length,
    orphanRepresentationSoundCount:orphanRepresentations.length
  },
  rows,
  visualResearchQueue:visualResearchQueue.map(queueRow),
  existingPrototypeReviewQueue:existingPrototypeReviewQueue.map(queueRow),
  newImageResearchQueue:newImageResearchQueue.map(queueRow),
  orphanRepresentations
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(report));

const frequent=rows.slice().sort((a,b)=>b.occurrenceCount-a.occurrenceCount||b.usefulTargetCount-a.usefulTargetCount).slice(0,60);
const usefulPriorities=visualResearchQueue.slice(0,120);
const prototypes=existingPrototypeReviewQueue.slice(0,40);
const newImages=newImageResearchQueue.slice(0,100);
const labels=row=>(row.nounLexicalCandidates.length?row.nounLexicalCandidates:row.exactLexicalCandidates).slice(0,3).map(candidate=>candidate.word).join(', ')||'—';
const lines=[
  '# Rebulo — rapport du catalogue des sons de rébus',
  '',
  '> Fichier généré. Le contrat et les sources canoniques sont documentés dans `REBUS_SOUND_CATALOG.md`.',
  '',
  `- Fenêtres phonétiques exactes de 1–2 syllabes inventoriées : ${rows.length}.`,
  `- Vocabulaire utile Rebulo utilisé pour la priorité : ${usefulTargets.length} cibles sur ${targets.length}.`,
  `- Fenêtres avec une image exacte prête : ${ready.length}.`,
  `- Fenêtres avec une image exacte encore en recherche : ${researchImages.length}.`,
  `- Fenêtres sans image prête mais avec au moins un nom exact à examiner : ${nounCandidateRows.length}.`,
  `- Fenêtres totalement non résolues : ${unresolved.length}.`,
  `- Représentations agrégées : ${representations.length}, dont ${openPictogramImages.length} pictogrammes de la bibliothèque ouverte et ${shortBrickImages.length} briques courtes existantes.`,
  '',
  '## Règles',
  '',
  '- L’inventaire reste exhaustif ; le classement visuel, lui, privilégie le vocabulaire réellement utile à Rebulo.',
  '- Les frontières syllabiques viennent uniquement des syllabifications source exactes, y compris les monosyllabes validés.',
  '- Les fenêtres de deux syllabes peuvent ensuite traverser une frontière de mots dans une phrase.',
  '- Une image/mot exact, une convention visible et une approximation restent trois catégories distinctes.',
  '- Les noms Lexique exacts sont des pistes de recherche, pas des pictogrammes validés.',
  '',
  '## Priorités produit — toutes routes non prêtes',
  '',
  '| Rang | Son IPA | 1/2 syll. | Cibles utiles | Gain utile | Éduscol | État | Candidats à examiner | Exemples utiles |',
  '|---:|---|---|---:|---:|---:|---|---|---|',
  ...usefulPriorities.map((row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.syllableSpans.join(',')} | ${row.usefulTargetCount} | ${row.usefulWeightedGain} | ${row.schoolTargetCount} | ${row.researchState} | ${labels(row)} | ${row.usefulExamples.slice(0,4).join(', ')||'—'} |`),
  '',
  '## Prototypes/images exactes déjà en recherche — à valider avant de redessiner',
  '',
  '| Rang | Son IPA | Cibles utiles | Représentations existantes | Candidats |',
  '|---:|---|---:|---|---|',
  ...prototypes.map((row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.usefulTargetCount} | ${row.representations.map(item=>item.label).join(', ')||'—'} | ${labels(row)} |`),
  '',
  '## Nouvelles images — sons exacts avec noms candidats mais sans image existante',
  '',
  '| Rang | Son IPA | 1/2 syll. | Cibles utiles | Âge min heuristique | Noms candidats | Exemples utiles |',
  '|---:|---|---|---:|---:|---|---|',
  ...newImages.map((row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.syllableSpans.join(',')} | ${row.usefulTargetCount} | ${row.minAgeBandCandidate??'—'} | ${labels(row)} | ${row.usefulExamples.slice(0,4).join(', ')||'—'} |`),
  '',
  '## Fenêtres les plus fréquentes dans Lexique',
  '',
  '| Son IPA | Portée syllabique | Occurrences | Cibles utiles | Images prêtes | Exemples |',
  '|---|---:|---:|---:|---:|---|',
  ...frequent.map(row=>`| /${row.ipa}/ | ${row.syllableSpans.join(',')} | ${row.occurrenceCount} | ${row.usefulTargetCount} | ${row.exactImageReadyCount} | ${row.examples.slice(0,4).join(', ')} |`)
];
fs.mkdirSync(path.dirname(docPath),{recursive:true});
fs.writeFileSync(docPath,lines.join('\n')+'\n');
console.log(`Wrote ${outputPath} and ${docPath}: ${rows.length} sound windows; ${ready.length} exact-image ready; ${nounCandidateRows.length} noun-led image opportunities; ${unresolved.length} unresolved.`);
