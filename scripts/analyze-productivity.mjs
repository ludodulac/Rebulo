import fs from 'node:fs';
import {ALL_OPEN_PICTOGRAMS} from '../src/pictogram-print-sheets.js';
import {classifyStrictProductivity,groupProductiveHomophones,mergeProductivityInventory} from '../src/phonetic-productivity.js';

const lexiquePath=process.argv[2]||'data/lexique4.compact.json';
const seedPath=process.argv[3]||'data/lexicon-seed.json';
const outputPath=process.argv[4]||'data/phonetic-productivity-report.json';
const lexique=JSON.parse(fs.readFileSync(lexiquePath,'utf8'));
const seed=JSON.parse(fs.readFileSync(seedPath,'utf8'));
const entries=Array.isArray(lexique)?lexique:(lexique.entries||[]);
const inventory=mergeProductivityInventory(seed,ALL_OPEN_PICTOGRAMS);
const analysis=classifyStrictProductivity(inventory,entries);
const tokens=analysis.tokens.map(token=>({
  id:token.id||'',label:token.label||'',ipa:token.ipa||'',normalizedIPA:token.normalizedIPA,
  productivityStatus:token.productivityStatus,active:token.active!==false,strictEligible:token.strictEligible!==false,
  strictUseCount:token.strictUseCount,strictExamples:(token.strictExamples||[]).map(x=>({word:x.word,ipa:x.ipa,frequency:x.frequency,decomposition:x.decomposition}))
})).sort((a,b)=>b.strictUseCount-a.strictUseCount||a.label.localeCompare(b.label,'fr'));
const homophones=groupProductiveHomophones(analysis.tokens).map(group=>({ipa:group.ipa,ids:group.entries.map(x=>x.id),labels:group.entries.map(x=>x.label)}));
const report={
  generatedAt:new Date().toISOString(),source:lexique.source||'Lexique 4',lexicalEntryCount:entries.length,
  inventory:{seedCount:seed.length,openLibraryCount:ALL_OPEN_PICTOGRAMS.length,mergedCount:inventory.length},
  stats:analysis.stats,
  methodology:{
    strictProductive:'Une pièce est productive uniquement si sa prononciation entière participe à au moins un rébus exact de 2 à 4 pièces dans le corpus de référence.',
    strictCandidate:'Une pièce phonétiquement structurée sans preuve d’usage reste candidate et ne compte pas comme enrichissement productif.',
    inactive:'Une pièce active:false ne participe jamais au calcul strict, même si son IPA est connue.',
    wholeWord:'Aucune sous-partie de la prononciation d’un pictogramme ne peut être utilisée. Vélo /velo/ ne fournit ni /ve/ ni /lo/.',
    deduplication:'Les cibles lexicales sont dédupliquées par graphie normalisée + IPA ; le seed Rebulo reste prioritaire lors de la fusion des bibliothèques.'
  },
  productiveTokens:tokens.filter(x=>x.productivityStatus==='strict_productive'),
  candidateTokens:tokens.filter(x=>x.productivityStatus==='strict_candidate'),
  generalOnlyTokens:tokens.filter(x=>x.productivityStatus==='general_only'),
  illustrationOnlyTokens:tokens.filter(x=>x.productivityStatus==='illustration_only'),
  homophoneGroups:homophones
};
fs.writeFileSync(outputPath,JSON.stringify(report,null,2));
console.log(`Productivity: ${report.stats.productive}/${report.stats.tokens} productive tokens; ${report.stats.strictRebuses} unique strict rebus targets.`);
console.log(`Report -> ${outputPath}`);
