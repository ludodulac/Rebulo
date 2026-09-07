import fs from 'node:fs';
import path from 'node:path';
import {buildTargetVocabulary,buildSyllableInventory,targetVocabularyStats} from '../src/target-vocabulary.js';

const input=process.argv[2]||'data/lexique4.compact.json';
const output=process.argv[3]||'data/target-vocabulary-report.json';

if(!fs.existsSync(input)){
  console.error(`Lexique compact introuvable: ${input}`);
  console.error('Importer d’abord Lexique 4 avec: npm run import:lexique -- <Lexique400.tsv>');
  process.exit(1);
}

const source=JSON.parse(fs.readFileSync(input,'utf8'));
const entries=Array.isArray(source?.entries)?source.entries:[];
const targets=buildTargetVocabulary(entries);
const syllables=buildSyllableInventory(targets);
const stats=targetVocabularyStats(targets);

const report={
  generatedAt:new Date().toISOString(),
  source:source?.source||'Lexique 4',
  sourceLicense:source?.license||'CC BY-SA 4.0',
  status:'editorial-preselection',
  caution:'Les niveaux d’âge sont une présélection heuristique fondée sur fréquence, longueur et nombre de syllabes. Ils ne constituent ni un âge d’acquisition ni une validation clinique. La syllabation n’est considérée exacte que lorsqu’elle provient explicitement de la source lexicale.',
  selectionPolicy:{
    lexicalCategories:['NOM','VER','ADJ','ADV','ONO'],
    onePreferredFormPerLemma:true,
    ageBands:'5–6, 7–8, 9–11, 12+; heuristique seulement',
    sourceSyllabificationRequiredForExactInventory:true
  },
  stats,
  syllableInventoryCount:syllables.length,
  syllableInventory:syllables,
  targets
};

fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(`Built ${targets.length} target lemmas and ${syllables.length} source syllables -> ${output}`);
