import fs from 'node:fs';
import path from 'node:path';
import {buildDifferentialPreselection} from '../src/rebus-representation-differential-preselection.js';

const queuePath=process.argv[2]||'data/rebus-representation-expansion-queue.json';
const outputPath=process.argv[3]||'data/rebus-representation-differential-preselection.json';
const reportPath=process.argv[4]||'docs/REBUS_REPRESENTATION_DIFFERENTIAL_PRESELECTION.md';
if(!fs.existsSync(queuePath)){console.error(`Missing required file: ${queuePath}`);process.exit(1);}
const queue=JSON.parse(fs.readFileSync(queuePath,'utf8'));
const rows=buildDifferentialPreselection(queue.rows||[],{limit:220,twoSyllableReserve:80,minScore:7});
const stats={
  preselectedSoundCount:rows.length,
  multipleExactCandidateSoundCount:rows.filter(r=>r.preselectionSignals.includes('multiple_exact_candidates')).length,
  nounVsNonNounSoundCount:rows.filter(r=>r.preselectionSignals.includes('noun_vs_non_noun_contrast')).length,
  multipleNounSoundCount:rows.filter(r=>r.preselectionSignals.includes('multiple_nouns')).length,
  registeredAssetSoundCount:rows.filter(r=>r.registeredAssetCandidateCount>0).length,
  researchAssetLeadSoundCount:rows.filter(r=>r.researchAssetLeadCandidateCount>0).length,
  visibleConventionSoundCount:rows.filter(r=>r.visibleConventions.length>0).length,
  twoSyllableSoundCount:rows.filter(r=>r.twoSyllableFirstClass).length
};
const output={schemaVersion:'1.0',generatedAt:new Date().toISOString(),status:'research_preselection_only',purpose:'Présélectionner à grande échelle les sons où les homophones exacts, la structure lexicale, les assets ou les fenêtres longues justifient un examen éditorial humain.',policy:{machineRole:'La machine classe les cas à examiner; elle ne choisit jamais automatiquement une bonne image.',visualEvidence:'POS, fréquence, multiplicité, longueur et présence d’asset sont des indices descriptifs, pas des preuves de dessinabilité ou de nommabilité.',proof:'exact phonetics != lexical obviousness != visual plausibility != spontaneous namability != clinical validation',activation:'Toutes les sorties gardent visualDecision=unknown, spontaneousNamingRisk=unknown, humanNamingEvidence=none, clinicalEvidence=none et automaticActivation=false.'},selection:{globalLimit:220,twoSyllableReserve:80,minScore:7,note:'Union du haut du classement descriptif et d’une réserve deux-syllabes. Aucun score ne peut promouvoir une représentation.'},stats,rows};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');
const lines=['# Rebulo — présélection différentielle des homophones','', '> Cette liste sert à décider quoi examiner. Elle ne décide ni quelle image est bonne ni comment des humains la nommeront.','',`- Sons présélectionnés : ${stats.preselectedSoundCount}.`,`- Plusieurs candidats exacts : ${stats.multipleExactCandidateSoundCount}.`,`- Contraste nom / non-nom : ${stats.nounVsNonNounSoundCount}.`,`- Plusieurs noms exacts : ${stats.multipleNounSoundCount}.`,`- Assets enregistrés présents : ${stats.registeredAssetSoundCount}.`,`- Pistes de recherche présentes : ${stats.researchAssetLeadSoundCount}.`,`- Conventions visibles présentes : ${stats.visibleConventionSoundCount}.`,`- Fenêtres deux-syllabes : ${stats.twoSyllableSoundCount}.`,'','| Rang | Son | Score descriptif | 2 syll. | Candidats exacts | Signaux |','|---:|---|---:|---|---|---|',...rows.map(r=>`| ${r.rank} | /${r.ipa}/ | ${r.preselectionScore} | ${r.twoSyllableFirstClass?'oui':'non'} | ${r.exactCandidates.slice(0,6).map(c=>`${c.word} (${c.pos||'?'})`).join(', ')} | ${r.preselectionSignals.join(', ')} |`),'','Les cas retenus doivent ensuite recevoir une décision éditoriale séparée, avec risque de dénomination laissé inconnu tant qu’aucune observation humaine n’existe.'];
fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(JSON.stringify(stats,null,2));