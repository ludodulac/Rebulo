import fs from 'node:fs';
import path from 'node:path';
import {SYLLABLE_PRINT_LIBRARY} from '../src/syllable-print-library.js';
import {ALL_OPEN_PICTOGRAMS} from '../src/pictogram-print-sheets.js';
import {buildSyllableWindowInventory,groupRepresentationsBySound,phonemeEditDistance} from '../src/rebus-sound-catalog.js';
import {buildWholeWordCandidateIndex,wholeWordRepresentationCandidates} from '../src/syllable-representation-candidates.js';
import {isDrawableNamingCandidate} from '../src/drawable-opportunities.js';
import {normalizeIPA} from '../src/phonetic-engine.js';

const lexiquePath=process.argv[2]||'data/lexique4.compact.json';
const outputPath=process.argv[3]||'data/rebus-sound-catalog.json';
const docPath=process.argv[4]||'docs/REBUS_SOUND_CATALOG_REPORT.md';

if(!fs.existsSync(lexiquePath)){
  console.error(`Lexique compact introuvable: ${lexiquePath}`);
  process.exit(1);
}

const source=JSON.parse(fs.readFileSync(lexiquePath,'utf8'));
const entries=Array.isArray(source.entries)?source.entries:[];
const visibleConventions=JSON.parse(fs.readFileSync('data/rebus-visible-conventions.json','utf8'));
const researchSeeds=JSON.parse(fs.readFileSync('data/rebus-sound-research-seeds.json','utf8'));
const candidateBank=JSON.parse(fs.readFileSync('data/phonetic-brick-candidates.json','utf8'));

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

const compactCandidate=candidate=>({
  word:candidate.word,
  lemma:candidate.lemma,
  pos:candidate.pos,
  frequency:candidate.frequency,
  syllableCount:candidate.syllableCount,
  phoneticStatus:candidate.phoneticStatus
});
const countTier=(reps,tier)=>reps.filter(item=>item.tier===tier).length;
const classifyResearchState=({readyCount,researchImageCount,drawableCandidateCount,exactCandidateCount,visibleConventionCount,approximationCount})=>{
  if(readyCount>0)return 'exact_image_ready';
  if(researchImageCount>0)return 'exact_image_research';
  if(drawableCandidateCount>0)return 'exact_lexical_candidate_to_review';
  if(exactCandidateCount>0)return 'exact_lexical_candidate_low_visual_confidence';
  if(visibleConventionCount>0)return 'visible_convention_only';
  if(approximationCount>0)return 'approximation_only';
  return 'unresolved';
};
const scoreResearchPriority=row=>{
  if(row.exactImageReadyCount>0)return 0;
  let score=Math.log10(1+Math.max(0,row.occurrenceCount))*110;
  if(row.syllableSpans.includes(2))score+=28;
  if(row.drawableLexicalCandidateCount>0)score+=135+Math.min(40,row.drawableLexicalCandidateCount*8);
  else if(row.exactLexicalCandidateCount>0)score+=45;
  if(row.exactImageResearchCount>0)score+=95;
  if(row.visibleConventionCount>0)score-=15;
  if(row.approximationCount>0)score+=10;
  return Number(Math.max(0,score).toFixed(3));
};

const rows=windows.map(row=>{
  const reps=representationMap.get(row.ipa)||[];
  const exactCandidates=wholeWordRepresentationCandidates(row.ipa,lexicalCandidateIndex,8);
  const drawableCandidates=exactCandidates.filter(isDrawableNamingCandidate);
  const counts={
    readyCount:countTier(reps,'exact_image_ready'),
    researchImageCount:countTier(reps,'exact_image_research'),
    visibleConventionCount:countTier(reps,'explicit_visible_convention'),
    approximationCount:countTier(reps,'approximation_research')
  };
  const enriched={
    ...row,
    representationCount:reps.length,
    exactImageReadyCount:counts.readyCount,
    exactImageResearchCount:counts.researchImageCount,
    visibleConventionCount:counts.visibleConventionCount,
    approximationCount:counts.approximationCount,
    exactLexicalCandidateCount:exactCandidates.length,
    drawableLexicalCandidateCount:drawableCandidates.length,
    exactLexicalCandidates:exactCandidates.slice(0,5).map(compactCandidate),
    drawableLexicalCandidates:drawableCandidates.slice(0,5).map(compactCandidate),
    representations:reps,
    researchState:classifyResearchState({...counts,drawableCandidateCount:drawableCandidates.length,exactCandidateCount:exactCandidates.length})
  };
  return {...enriched,researchPriorityScore:scoreResearchPriority(enriched)};
});

const covered=rows.filter(row=>row.representationCount>0);
const missing=rows.filter(row=>row.representationCount===0);
const ready=rows.filter(row=>row.exactImageReadyCount>0);
const researchImages=rows.filter(row=>row.exactImageReadyCount===0&&row.exactImageResearchCount>0);
const drawableCandidates=rows.filter(row=>row.exactImageReadyCount===0&&row.drawableLexicalCandidateCount>0);
const unresolved=rows.filter(row=>row.researchState==='unresolved');
const visualResearchQueue=rows.filter(row=>row.exactImageReadyCount===0).sort((a,b)=>b.researchPriorityScore-a.researchPriorityScore||b.occurrenceCount-a.occurrenceCount||a.ipa.localeCompare(b.ipa)).slice(0,1000);
const observedSounds=new Set(rows.map(row=>row.ipa));
const orphanRepresentations=representationGroups.filter(group=>!observedSounds.has(group.ipa));
const report={
  generatedAt:new Date().toISOString(),
  status:'research_mapping_only',
  scope:'source_exact_adjacent_windows_of_one_or_two_syllables',
  methodology:{
    sourceSyllables:'Only Lexique rows whose stored IPA syllabification concatenates exactly to the full IPA are used, including validated monosyllables.',
    overlap:'All adjacent one- and two-syllable windows are retained; phrase-level cross-word windows use the same primitives at runtime/research time.',
    representations:'Short sound bricks, the full existing open pictogram library, curated phonetic candidates, visible conventions and preserved research seeds are consolidated without activating research rows.',
    lexicalCandidates:'Exact whole-pronunciation Lexique candidates are indexed once and attached as research leads; automatic drawability filtering is only a coarse triage, never a naming validation.',
    approximations:'Approximate seeds keep their own source reading and an explicit phoneme edit distance; they never become strict by scoring.',
    researchPriority:'Already-ready exact images receive no visual research priority. Remaining windows are ranked by corpus occurrence, two-syllable leverage, exact lexical candidate availability and existing research assets.'
  },
  source:{name:source.source||'Lexique 4',license:source.license||null,entryCount:entries.length},
  stats:{
    windowCount:rows.length,
    coveredWindowCount:covered.length,
    missingWindowCount:missing.length,
    exactImageReadyWindowCount:ready.length,
    exactImageResearchWindowCount:researchImages.length,
    drawableLexicalCandidateWindowCount:drawableCandidates.length,
    unresolvedWindowCount:unresolved.length,
    representationCount:representations.length,
    openPictogramRepresentationCount:openPictogramImages.length,
    shortBrickRepresentationCount:shortBrickImages.length,
    orphanRepresentationSoundCount:orphanRepresentations.length
  },
  rows,
  visualResearchQueue,
  missingIpas:missing.map(row=>row.ipa),
  orphanRepresentations
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(report,null,2));

const frequent=rows.slice().sort((a,b)=>b.occurrenceCount-a.occurrenceCount||b.representationCount-a.representationCount).slice(0,80);
const priorities=visualResearchQueue.slice(0,160);
const labelCandidates=row=>(row.drawableLexicalCandidates.length?row.drawableLexicalCandidates:row.exactLexicalCandidates).slice(0,3).map(candidate=>candidate.word).join(', ')||'—';
const lines=[
  '# Rebulo — rapport du catalogue des sons de rébus',
  '',
  '> Fichier généré. Le contrat et les sources canoniques sont documentés dans `REBUS_SOUND_CATALOG.md`.',
  '',
  `- Fenêtres phonétiques exactes de 1–2 syllabes : ${rows.length}.`,
  `- Fenêtres avec au moins une représentation déjà rangée : ${covered.length}.`,
  `- Fenêtres avec une image exacte prête : ${ready.length}.`,
  `- Fenêtres avec une image exacte encore en recherche : ${researchImages.length}.`,
  `- Fenêtres sans image prête mais avec un candidat lexical dessinable à revoir : ${drawableCandidates.length}.`,
  `- Fenêtres totalement non résolues : ${unresolved.length}.`,
  `- Représentations agrégées : ${representations.length}, dont ${openPictogramImages.length} pictogrammes de la bibliothèque ouverte et ${shortBrickImages.length} briques courtes existantes.`,
  '',
  '## Règles',
  '',
  '- Les frontières syllabiques viennent uniquement des syllabifications source exactes, y compris les monosyllabes validés.',
  '- Les fenêtres de deux syllabes peuvent ensuite traverser une frontière de mots dans une phrase.',
  '- Une image/mot exact, une convention visible et une approximation restent trois catégories distinctes.',
  '- Les candidats Lexique exacts sont des pistes de recherche, pas des pictogrammes validés.',
  '- Une approximation conserve sa distance phonémique; elle ne peut jamais être présentée comme stricte.',
  '',
  '## Priorités de recherche visuelle',
  '',
  '| Rang | Son IPA | 1/2 syll. | Occurrences | État | Candidats exacts à examiner | Exemples |',
  '|---:|---|---|---:|---|---|---|',
  ...priorities.map((row,index)=>`| ${index+1} | /${row.ipa}/ | ${row.syllableSpans.join(',')} | ${row.occurrenceCount} | ${row.researchState} | ${labelCandidates(row)} | ${row.examples.slice(0,4).join(', ')} |`),
  '',
  '## Fenêtres les plus fréquentes',
  '',
  '| Son IPA | Portée syllabique | Occurrences | Images prêtes | Représentations | Exemples |',
  '|---|---:|---:|---:|---:|---|',
  ...frequent.map(row=>`| /${row.ipa}/ | ${row.syllableSpans.join(',')} | ${row.occurrenceCount} | ${row.exactImageReadyCount} | ${row.representationCount} | ${row.examples.slice(0,5).join(', ')} |`)
];
fs.mkdirSync(path.dirname(docPath),{recursive:true});
fs.writeFileSync(docPath,lines.join('\n')+'\n');
console.log(`Wrote ${outputPath} and ${docPath}: ${rows.length} sound windows; ${ready.length} exact-image ready; ${drawableCandidates.length} drawable lexical leads; ${unresolved.length} unresolved.`);
