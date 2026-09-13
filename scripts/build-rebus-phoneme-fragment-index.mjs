import fs from 'node:fs';
import path from 'node:path';
import {normalizeIPA} from '../src/phonetic-engine.js';
import {buildPhonemeFragmentInventory,groupFragmentRepresentationIdeas,ideasForFragment} from '../src/rebus-phoneme-fragments.js';

const lexiquePath=process.argv[2]||'.cache/lexique4.compact.json';
const outputPath=process.argv[3]||'data/rebus-phoneme-fragment-index.json';
const docPath=process.argv[4]||'docs/PHONEME_FRAGMENT_INDEX_REPORT.md';
const ideaPath=process.argv[5]||'data/rebus-fragment-representation-ideas.json';
const conventionPath=process.argv[6]||'data/rebus-visible-conventions.json';
if(!fs.existsSync(lexiquePath)){console.error(`Lexique compact introuvable: ${lexiquePath}`);process.exit(1);}

const source=JSON.parse(fs.readFileSync(lexiquePath,'utf8'));
const entries=Array.isArray(source.entries)?source.entries:[];
const ideaData=JSON.parse(fs.readFileSync(ideaPath,'utf8'));
const conventionData=JSON.parse(fs.readFileSync(conventionPath,'utf8'));
const ideaGroups=groupFragmentRepresentationIdeas(ideaData.entries||[]);

const lexicalByIpa=new Map();
for(const entry of entries){
  const ipa=normalizeIPA(entry.ipa||'');const word=String(entry.word||'').trim();if(!ipa||!word)continue;
  if(!lexicalByIpa.has(ipa))lexicalByIpa.set(ipa,new Map());
  const byWord=lexicalByIpa.get(ipa);const key=word.toLocaleLowerCase('fr-FR').normalize('NFC');const frequency=Number(entry.frequency)||0;
  const current=byWord.get(key);
  if(!current)byWord.set(key,{word,pos:entry.pos||null,frequency,syllableCount:Number(entry.syllableCount)||null,categories:entry.pos?[entry.pos]:[]});
  else{current.frequency=Math.max(current.frequency,frequency);if(entry.pos&&!current.categories.includes(entry.pos))current.categories.push(entry.pos);}
}
const nounLike=pos=>String(pos||'').toUpperCase().split(':')[0]==='NOM';
for(const [ipa,byWord] of lexicalByIpa){const values=[...byWord.values()];values.sort((a,b)=>Number(nounLike(b.pos))-Number(nounLike(a.pos))||b.frequency-a.frequency||a.word.localeCompare(b.word,'fr'));lexicalByIpa.set(ipa,values);}

const conventionByIpa=new Map();
for(const entry of conventionData.entries||[]){const ipa=normalizeIPA(entry.ipa||'');if(!ipa)continue;if(!conventionByIpa.has(ipa))conventionByIpa.set(ipa,[]);conventionByIpa.get(ipa).push({id:entry.id,label:entry.label,kind:entry.kind,status:entry.status});}

const fragments=buildPhonemeFragmentInventory(entries,{minUnits:1,maxUnits:8});
const rows=fragments.map(fragment=>{
  const ideas=ideasForFragment(fragment.ipa,ideaGroups).map(item=>({id:item.id,label:item.label,kind:item.kind,strictness:item.strictness,description:item.description,spontaneousNamingRisk:item.spontaneousNamingRisk||'unknown',humanNamingEvidence:item.humanNamingEvidence||'none',clinicalEvidence:item.clinicalEvidence||'none'}));
  const conventions=conventionByIpa.get(fragment.ipa)||[];
  const exactLexicalCandidates=lexicalByIpa.get(fragment.ipa)||[];
  const exactLexicalDistinctWordCount=exactLexicalCandidates.length;
  const nounLexicalCandidateCount=exactLexicalCandidates.filter(item=>nounLike(item.pos)).length;
  const hasTextualLead=ideas.length>0||conventions.length>0||exactLexicalCandidates.length>0;
  return {...fragment,editorialIdeas:ideas,visibleConventions:conventions,exactLexicalCandidates,exactLexicalDistinctWordCount,nounLexicalCandidateCount,hasTextualLead};
});

const exactWordCounts=rows.filter(row=>row.exactLexicalDistinctWordCount>0).map(row=>row.exactLexicalDistinctWordCount);
const exactWordsPerSoundDistribution={};for(const count of exactWordCounts)exactWordsPerSoundDistribution[String(count)]=(exactWordsPerSoundDistribution[String(count)]||0)+1;
const legacyTopSixHidden=rows.filter(row=>row.exactLexicalDistinctWordCount>6);
const stats={
  fragmentCount:rows.length,
  withTextualLeadCount:rows.filter(row=>row.hasTextualLead).length,
  withoutTextualLeadCount:rows.filter(row=>!row.hasTextualLead).length,
  withEditorialIdeaCount:rows.filter(row=>row.editorialIdeas.length>0).length,
  withVisibleConventionCount:rows.filter(row=>row.visibleConventions.length>0).length,
  withExactLexicalCandidateCount:exactWordCounts.length,
  exactLexicalRelationCount:exactWordCounts.reduce((sum,count)=>sum+count,0),
  exactWordsPerSoundDistribution,
  maxExactLexicalWordsPerSound:Math.max(0,...exactWordCounts),
  withMultipleExactLexicalWordsCount:rows.filter(row=>row.exactLexicalDistinctWordCount>=2).length,
  legacyTopSixTruncatedSoundCount:legacyTopSixHidden.length,
  legacyTopSixHiddenRelationCount:legacyTopSixHidden.reduce((sum,row)=>sum+row.exactLexicalDistinctWordCount-6,0),
  wholeWordFragmentCount:rows.filter(row=>row.categories.includes('whole_word')).length,
  wholeSyllableFragmentCount:rows.filter(row=>row.categories.includes('whole_syllable')).length,
  multiSyllableFragmentCount:rows.filter(row=>row.categories.includes('multi_syllable')).length,
  withinSyllableFragmentCount:rows.filter(row=>row.categories.includes('within_syllable_fragment')).length,
  crossSyllableFragmentCount:rows.filter(row=>row.categories.includes('cross_syllable_fragment')).length
};

const rowSchema=['ipa','occurrenceCount','unitCounts','categories','positions','examples','wholeWordExamples','hasTextualLead','nounLexicalCandidateCount','exactLexicalDistinctWordCount','exactLexicalCandidates','visibleConventions','editorialIdeas'];
const compactRows=rows.map(row=>[
  row.ipa,row.occurrenceCount,row.unitCounts,row.categories,row.positions,row.examples,row.wholeWordExamples,row.hasTextualLead,row.nounLexicalCandidateCount,row.exactLexicalDistinctWordCount,
  row.exactLexicalCandidates.map(item=>[item.word,item.pos,item.frequency,item.syllableCount,item.categories]),
  row.visibleConventions.map(item=>[item.id,item.label,item.kind,item.status]),
  row.editorialIdeas.map(item=>[item.id,item.label,item.kind,item.strictness,item.description,item.spontaneousNamingRisk,item.humanNamingEvidence,item.clinicalEvidence])
]);

const report={
  formatVersion:2,
  generatedAt:new Date().toISOString(),
  status:'research_mapping_only',
  scope:'all_source_exact_contiguous_phoneme_fragments_up_to_eight_units',
  policy:{
    layers:'A fragment index; B exact SOUND→WORD relations; C representation potential; D created representations; E active product representations are separate layers and counters.',
    activation:'No row or lexical relation activates a production representation.',
    exactness:'Every exact lexical candidate is grouped solely by equality of normalized full-word IPA. Frequency and category affect ordering only, never membership.',
    completeness:'exactLexicalCandidates serializes every distinct Lexique word with that exact IPA; no top-N or frequency truncation is applied.',
    fragments:'A fragment may be meaningful or meaningless and may sit inside a syllable or cross a syllable boundary.',
    phraseUse:'The same phoneme units can be searched across word boundaries by the phrase planner primitives.',
    evidence:'Lexical existence is not evidence that a word has a usable image or active representation.'
  },
  source:{name:source.source||'Lexique 4',license:source.license||null,entryCount:entries.length},
  stats,rowSchema,fragmentRows:compactRows
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(report));

const promising=rows.filter(row=>row.hasTextualLead).sort((a,b)=>b.occurrenceCount-a.occurrenceCount||b.editorialIdeas.length-a.editorialIdeas.length||a.ipa.localeCompare(b.ipa)).slice(0,120);
const editorial=rows.filter(row=>row.editorialIdeas.length>0).sort((a,b)=>b.occurrenceCount-a.occurrenceCount||a.ipa.localeCompare(b.ipa));
const lines=['# Rebulo — index exhaustif de fragments phonémiques','',`- A — fragments phonémiques uniques (1–8 unités) : ${stats.fragmentCount}.`,`- B — fragments avec ≥1 mot français exact : ${stats.withExactLexicalCandidateCount}.`,`- B — relations exactes SON → MOT : ${stats.exactLexicalRelationCount}.`,`- B — maximum de mots exacts pour un son : ${stats.maxExactLexicalWordsPerSound}.`,`- Ancienne vue top-6 : ${stats.legacyTopSixTruncatedSoundCount} sons tronqués, ${stats.legacyTopSixHiddenRelationCount} relations exactes masquées.`,`- Avec brief éditorial : ${stats.withEditorialIdeaCount}.`,`- Avec convention visible exacte : ${stats.withVisibleConventionCount}.`,'','## Distribution mots exacts par son','',...Object.entries(stats.exactWordsPerSoundDistribution).sort((a,b)=>Number(a[0])-Number(b[0])).map(([count,sounds])=>`- ${count} mot(s) exact(s) : ${sounds} son(s).`),'','## Briefs éditoriaux actuels','', '| IPA | Exemples d’origine | Concepts textuels |','|---|---|---|',...editorial.map(row=>`| /${row.ipa}/ | ${row.examples.slice(0,4).join(', ')||'—'} | ${row.editorialIdeas.map(item=>`${item.label} — ${item.description}`).join('<br>')} |`),'','## 120 fragments fréquents avec une piste','', '| IPA | Occurrences | Catégories | Candidats lexicaux / conventions |','|---|---:|---|---|',...promising.map(row=>`| /${row.ipa}/ | ${row.occurrenceCount} | ${row.categories.join(', ')} | ${[...row.exactLexicalCandidates.slice(0,3).map(item=>item.word),...row.visibleConventions.slice(0,3).map(item=>item.label)].join(', ')||'—'} |`),'','> La table ci-dessus est une vue éditoriale courte. Le JSON conserve désormais toutes les relations exactes SON → MOT. Une relation lexicale exacte n’est ni une représentation créée ni une représentation active.'];
fs.mkdirSync(path.dirname(docPath),{recursive:true});fs.writeFileSync(docPath,lines.join('\n')+'\n');
console.log(JSON.stringify(stats,null,2));
