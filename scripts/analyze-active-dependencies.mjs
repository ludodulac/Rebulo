import fs from 'node:fs';
import { normalizeIPA, segmentTargetWithLexicon, rankDecompositions } from '../src/phonetic-engine.js';

const lexiquePath=process.argv[2]||'data/lexique4.compact.json';
const pictogramPath=process.argv[3]||'data/lexicon-seed.json';
const outputPath=process.argv[4]||'data/active-dependency-report.json';

const lexique=JSON.parse(fs.readFileSync(lexiquePath,'utf8'));
const pictograms=JSON.parse(fs.readFileSync(pictogramPath,'utf8'));
const entries=Array.isArray(lexique)?lexique:(lexique.entries||[]);
const active=pictograms.filter(item=>item.active!==false&&item.ipa&&item.label);

function uniqueWords(records){return new Set(records.map(item=>String(item.word).toLocaleLowerCase('fr-FR'))).size;}
function strictMultiPiece(inventory){
  const out=[];
  for(const entry of entries){
    if(!entry?.word||!entry?.ipa)continue;
    const target=normalizeIPA(entry.ipa);
    if(!target)continue;
    const decompositions=rankDecompositions(segmentTargetWithLexicon(target,inventory,4));
    if(!decompositions.length||decompositions[0].length<2)continue;
    out.push({word:entry.word,decomposition:decompositions[0].map(piece=>piece.id||piece.label)});
  }
  return out;
}

const baseline=strictMultiPiece(active);
const baselineUnique=uniqueWords(baseline);
const dependencies=active.map(pictogram=>{
  const without=active.filter(item=>item.id!==pictogram.id);
  const reduced=strictMultiPiece(without);
  const reducedUnique=uniqueWords(reduced);
  const usedByEntries=baseline.filter(record=>record.decomposition.includes(pictogram.id)).length;
  const usedByUniqueWords=uniqueWords(baseline.filter(record=>record.decomposition.includes(pictogram.id)));
  const strictUniqueLoss=baselineUnique-reducedUnique;
  return {
    id:pictogram.id,
    label:pictogram.label,
    ipa:pictogram.ipa,
    image:pictogram.image,
    clinicalStatus:pictogram.clinicalStatus||'undocumented',
    artRevision:pictogram.artRevision||null,
    assetSource:pictogram.assetSource||'undocumented',
    usedByStrictMultiPieceEntries:usedByEntries,
    usedByStrictMultiPieceUniqueWords:usedByUniqueWords,
    strictUniqueLossIfUnavailable:strictUniqueLoss,
    strictUniqueRetentionIfUnavailable:baselineUnique?Number((reducedUnique/baselineUnique).toFixed(4)):1,
    migrationPriority:strictUniqueLoss>0?'protect_before_visual_change':'low_dependency'
  };
}).sort((a,b)=>b.strictUniqueLossIfUnavailable-a.strictUniqueLossIfUnavailable||b.usedByStrictMultiPieceUniqueWords-a.usedByStrictMultiPieceUniqueWords||a.label.localeCompare(b.label,'fr'));

const report={
  schemaVersion:'1.0',
  generatedAt:new Date().toISOString(),
  source:lexique.source||lexiquePath,
  methodology:{
    baseline:'Rébus stricts multi-images uniquement : concaténation de dénominations entières de pictogrammes actifs.',
    dependency:'Chaque pictogramme est retiré temporairement puis la couverture est recalculée avec le même moteur strict. La perte mesure les mots uniques qui deviennent impossibles, en tenant compte des décompositions alternatives.',
    clinicalCaution:'Ce classement mesure la dépendance du générateur, pas la validité clinique d’un stimulus. Une migration visuelle change la révision et exige une nouvelle vérification de dénomination avant toute revendication clinique.'
  },
  baseline:{activePictogramCount:active.length,strictMultiPieceEntries:baseline.length,strictMultiPieceUniqueWords:baselineUnique},
  dependencies
};
fs.writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');
console.log(`Active dependency baseline: ${baselineUnique} strict multi-piece unique words`);
console.log(`Top dependencies: ${dependencies.slice(0,8).map(item=>`${item.label} (-${item.strictUniqueLossIfUnavailable})`).join(', ')}`);
console.log(`Report -> ${outputPath}`);
