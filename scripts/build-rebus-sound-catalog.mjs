import fs from 'node:fs';
import path from 'node:path';
import {SYLLABLE_PRINT_LIBRARY} from '../src/syllable-print-library.js';
import {buildSyllableWindowInventory,groupRepresentationsBySound,phonemeEditDistance} from '../src/rebus-sound-catalog.js';
import {normalizeIPA} from '../src/phonetic-engine.js';

const lexiquePath=process.argv[2]||'data/lexique4.compact.json';
const outputPath=process.argv[3]||'data/rebus-sound-catalog.json';
const docPath=process.argv[4]||'docs/REBUS_SOUND_CATALOG.md';

if(!fs.existsSync(lexiquePath)){
  console.error(`Lexique compact introuvable: ${lexiquePath}`);
  process.exit(1);
}

const source=JSON.parse(fs.readFileSync(lexiquePath,'utf8'));
const entries=Array.isArray(source.entries)?source.entries:[];
const visibleConventions=JSON.parse(fs.readFileSync('data/rebus-visible-conventions.json','utf8'));
const researchSeeds=JSON.parse(fs.readFileSync('data/rebus-sound-research-seeds.json','utf8'));
const candidateBank=JSON.parse(fs.readFileSync('data/phonetic-brick-candidates.json','utf8'));

const existingImages=SYLLABLE_PRINT_LIBRARY.map(item=>({
  id:`syllable-print:${item.id}`,
  label:item.label,
  ipa:normalizeIPA(item.ipa),
  kind:'whole_word_image',
  status:item.status,
  image:item.image,
  source:'syllable_print_library'
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
  spontaneousNamingRisk:candidate.spontaneousNamingRisk||null
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

const dedupe=new Map();
for(const item of [...existingImages,...curatedCandidates,...conventions,...seeds]){
  const ipa=normalizeIPA(item.ipa||'');
  if(!ipa||!item.label)continue;
  const key=`${ipa}|${item.kind}|${String(item.label).toLocaleLowerCase('fr')}`;
  const previous=dedupe.get(key);
  if(!previous||previous.source!=='syllable_print_library')dedupe.set(key,{...item,ipa});
}
const representations=[...dedupe.values()];
const representationGroups=groupRepresentationsBySound(representations);
const representationMap=new Map(representationGroups.map(group=>[group.ipa,group.representations]));
const windows=buildSyllableWindowInventory(entries,{minSyllables:1,maxSyllables:2});
const rows=windows.map(row=>{
  const reps=representationMap.get(row.ipa)||[];
  return {...row,representationCount:reps.length,representations:reps};
});
const covered=rows.filter(row=>row.representationCount>0);
const missing=rows.filter(row=>row.representationCount===0);
const observedSounds=new Set(rows.map(row=>row.ipa));
const orphanRepresentations=representationGroups.filter(group=>!observedSounds.has(group.ipa));
const report={
  generatedAt:new Date().toISOString(),
  status:'research_mapping_only',
  scope:'source_exact_adjacent_windows_of_one_or_two_syllables',
  methodology:{
    sourceSyllables:'Only Lexique rows whose dotted syllabification concatenates exactly to the stored IPA are used.',
    overlap:'All adjacent one- and two-syllable windows are retained; phrase-level cross-word windows use the same primitives at runtime/research time.',
    representations:'Existing printable sound bricks, curated phonetic candidates, visible conventions and preserved research seeds are consolidated without activating them.',
    approximations:'Approximate seeds keep their own source reading and an explicit phoneme edit distance; they never become strict by scoring.'
  },
  source:{name:source.source||'Lexique 4',license:source.license||null,entryCount:entries.length},
  stats:{windowCount:rows.length,coveredWindowCount:covered.length,missingWindowCount:missing.length,representationCount:representations.length,orphanRepresentationSoundCount:orphanRepresentations.length},
  rows,
  missing,
  orphanRepresentations
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(report,null,2));

const top=rows.slice().sort((a,b)=>b.occurrenceCount-a.occurrenceCount||b.representationCount-a.representationCount).slice(0,120);
const lines=[
  '# Rebulo — catalogue des sons de rébus',
  '',
  '> Fichier généré. La source de vérité éditoriale reste dans les bibliothèques/candidats/conventions référencés par le script.',
  '',
  `- Fenêtres phonétiques exactes de 1–2 syllabes : ${rows.length}.`,
  `- Fenêtres disposant déjà d'au moins une représentation : ${covered.length}.`,
  `- Fenêtres encore sans représentation : ${missing.length}.`,
  `- Représentations agrégées : ${representations.length}.`,
  '',
  '## Règles',
  '',
  '- Les frontières syllabiques viennent uniquement des syllabifications source exactes.',
  '- Les fenêtres de deux syllabes peuvent ensuite traverser une frontière de mots dans une phrase.',
  '- Une image/mot exact, une convention visible et une approximation restent trois catégories distinctes.',
  '- Une approximation conserve sa distance phonémique; elle ne peut jamais être présentée comme stricte.',
  '',
  '## Fenêtres les plus fréquentes',
  '',
  '| Son IPA | Portée syllabique | Occurrences | Représentations | Exemples |',
  '|---|---:|---:|---:|---|',
  ...top.map(row=>`| /${row.ipa}/ | ${row.syllableSpans.join(',')} | ${row.occurrenceCount} | ${row.representationCount} | ${row.examples.slice(0,5).join(', ')} |`)
];
fs.mkdirSync(path.dirname(docPath),{recursive:true});
fs.writeFileSync(docPath,lines.join('\n')+'\n');
console.log(`Wrote ${outputPath} and ${docPath}: ${rows.length} sound windows, ${covered.length} already represented.`);
