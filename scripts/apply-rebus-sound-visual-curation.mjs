import fs from 'node:fs';
import path from 'node:path';
import {buildWholeWordCandidateIndex,wholeWordRepresentationCandidates} from '../src/syllable-representation-candidates.js';
import {isDrawableNamingCandidate} from '../src/drawable-opportunities.js';
import {buildSoundVisualCurationRegistry,visualCurationForSound,validateSoundVisualCuration} from '../src/rebus-sound-visual-curation.js';
import {normalizeIPA} from '../src/phonetic-engine.js';

const catalogPath=process.argv[2]||'data/rebus-sound-catalog.json';
const lexiquePath=process.argv[3]||'data/lexique4.compact.json';
const curationPath=process.argv[4]||'data/rebus-sound-visual-curation.json';
const reportPath=process.argv[5]||'docs/REBUS_SOUND_VISUAL_CURATION_REPORT.md';
for(const file of [catalogPath,lexiquePath,curationPath])if(!fs.existsSync(file)){console.error(`Fichier introuvable: ${file}`);process.exit(1);}

const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const lexique=JSON.parse(fs.readFileSync(lexiquePath,'utf8'));
const curation=JSON.parse(fs.readFileSync(curationPath,'utf8'));
if(catalog.formatVersion!==2||!Array.isArray(catalog.rowSchema)||!Array.isArray(catalog.soundRows)){console.error('Catalogue sonore formatVersion 2 requis.');process.exit(2);}

const entries=Array.isArray(lexique.entries)?lexique.entries:[];
const lexicalIndex=buildWholeWordCandidateIndex(entries);
const validation=validateSoundVisualCuration(curation,lexicalIndex);
if(!validation.valid){for(const error of validation.errors)console.error(`- ${error}`);process.exit(3);}
for(const warning of validation.warnings)console.warn(`- ${warning}`);
const registry=buildSoundVisualCurationRegistry(curation);

const indexes=Object.fromEntries(catalog.rowSchema.map((name,index)=>[name,index]));
for(const required of ['ipa','researchPriorityScore','exactImageReadyCount','nounLexicalCandidates','usefulTargetCount','usefulWeightedGain','schoolTargetCount','minAgeBandCandidate','usefulExamples'])if(!(required in indexes)){console.error(`Colonne catalogue absente: ${required}`);process.exit(4);}
const rowByIpa=new Map(catalog.soundRows.map(row=>[normalizeIPA(row[indexes.ipa]),row]));
const value=(row,name)=>row?.[indexes[name]];
const nounCandidateLabels=row=>(value(row,'nounLexicalCandidates')||[]).map(candidate=>candidate?.[0]).filter(Boolean);
const isNoun=candidate=>String(candidate?.pos||'').toUpperCase().split(':')[0]==='NOM';
const immediateVisualCandidates=(ipa='')=>{
  const exact=wholeWordRepresentationCandidates(ipa,lexicalIndex,0).filter(isDrawableNamingCandidate).filter(isNoun);
  const reviewed=visualCurationForSound(ipa,exact,registry);
  return {
    ...reviewed,
    immediateCandidates:reviewed.eligibleCandidates.filter(candidate=>candidate.visualCuration!=='defer_candidate')
  };
};

const decisions=curation.entries||[];
const prototypeEntries=decisions.filter(entry=>entry.decision==='prototype_candidate');
const rejectedEntries=decisions.filter(entry=>entry.decision==='reject_candidate');
const deferredEntries=decisions.filter(entry=>entry.decision==='defer_candidate');
const prototypeQueue=prototypeEntries.map(entry=>{
  const ipa=normalizeIPA(entry.ipa),row=rowByIpa.get(ipa);
  return {
    ipa,candidate:entry.candidate,
    researchPriorityScore:Number(value(row,'researchPriorityScore'))||0,
    usefulTargetCount:Number(value(row,'usefulTargetCount'))||0,
    usefulWeightedGain:Number(value(row,'usefulWeightedGain'))||0,
    schoolTargetCount:Number(value(row,'schoolTargetCount'))||0,
    minAgeBandCandidate:value(row,'minAgeBandCandidate')??null,
    usefulExamples:value(row,'usefulExamples')||[],
    visualConcept:entry.visualConcept||null,
    visualPlausibility:entry.visualPlausibility||null,
    spontaneousNamingRisk:entry.spontaneousNamingRisk||null,
    mainConfusions:entry.mainConfusions||[],
    nextGate:entry.nextGate||null,
    reason:entry.reason||null
  };
}).filter(item=>rowByIpa.has(item.ipa)&&Number(value(rowByIpa.get(item.ipa),'exactImageReadyCount'))===0).sort((a,b)=>b.researchPriorityScore-a.researchPriorityScore||b.usefulTargetCount-a.usefulTargetCount||a.ipa.localeCompare(b.ipa));
const prototypeIpas=new Set(prototypeQueue.map(item=>item.ipa));

const automaticNewIpas=(catalog.newImageResearchQueue||[]).map(normalizeIPA).filter(Boolean);
const excluded=[];
const surviving=[];
for(const ipa of automaticNewIpas){
  const review=immediateVisualCandidates(ipa);
  if(review.immediateCandidates.length){surviving.push(ipa);continue;}
  const decisionsForSound=registry.get(ipa)||[];
  if(decisionsForSound.length){
    excluded.push({
      ipa,
      rejected:review.rejectedCandidates.map(candidate=>candidate.word),
      deferred:review.deferredCandidates.map(candidate=>candidate.word),
      reason:'no_immediate_visual_candidate_after_editorial_review'
    });
  }else surviving.push(ipa);
}

const curatedNewImageResearchQueue=[];
const seen=new Set();
for(const ipa of [...prototypeQueue.map(item=>item.ipa),...surviving])if(!seen.has(ipa)){seen.add(ipa);curatedNewImageResearchQueue.push(ipa);}
const nextUnreviewedImageQueue=curatedNewImageResearchQueue.filter(ipa=>!prototypeIpas.has(ipa)&&!(registry.get(ipa)||[]).some(entry=>entry.decision==='prototype_candidate')).slice(0,250);

catalog.visualCuration={
  version:curation.version||null,
  status:curation.status||'research_only',
  source:curationPath,
  validation:{valid:true,entryCount:validation.entryCount,warningCount:validation.warnings.length},
  stats:{prototypeCandidateCount:prototypeEntries.length,rejectedCandidateCount:rejectedEntries.length,deferredCandidateCount:deferredEntries.length,automaticNewImageQueueCount:automaticNewIpas.length,curatedNewImageQueueCount:curatedNewImageResearchQueue.length,excludedAutomaticSoundCount:excluded.length},
  curatedPrototypeQueue:prototypeQueue,
  curatedNewImageResearchQueue,
  nextUnreviewedImageQueue,
  excludedAutomaticImageRoutes:excluded
};
fs.writeFileSync(catalogPath,JSON.stringify(catalog));

const candidateSummary=ipa=>{
  const review=immediateVisualCandidates(ipa);
  return review.immediateCandidates.slice(0,3).map(candidate=>candidate.word).join(', ')||'—';
};
const nextRows=nextUnreviewedImageQueue.slice(0,100).map(ipa=>({ipa,row:rowByIpa.get(ipa)})).filter(item=>item.row);
const lines=[
  '# Rebulo — curation visuelle du catalogue sonore',
  '',
  '> Rapport généré depuis le catalogue exhaustif et `data/rebus-sound-visual-curation.json`. Une décision `prototype_candidate` autorise une expérimentation visuelle, jamais une validation de dénomination, pédagogique ou clinique.',
  '',
  `- Décisions éditoriales : ${validation.entryCount}.`,
  `- Candidats retenus pour prototype : ${prototypeEntries.length}.`,
  `- Routes candidat explicitement rejetées : ${rejectedEntries.length}.`,
  `- Routes différées : ${deferredEntries.length}.`,
  `- Sons retirés de la file immédiate parce que leurs candidats actuellement revus sont tous rejetés/différés : ${excluded.length}.`,
  `- Sons restant dans la file de recherche d'image curatée : ${curatedNewImageResearchQueue.length}.`,
  '',
  '## Première vague de prototypes à examiner',
  '',
  '| Rang | Son | Candidat | Cibles utiles | Éduscol | Plausibilité | Risque de dénomination | Confusions | Prochaine preuve |',
  '|---:|---|---|---:|---:|---|---|---|---|',
  ...prototypeQueue.map((item,index)=>`| ${index+1} | /${item.ipa}/ | ${item.candidate} | ${item.usefulTargetCount} | ${item.schoolTargetCount} | ${item.visualPlausibility||'—'} | ${item.spontaneousNamingRisk||'—'} | ${item.mainConfusions.join(', ')||'—'} | ${item.nextGate||'—'} |`),
  '',
  '## Routes lexicalement exactes écartées pour l’instant',
  '',
  '| Son | Candidat | Décision | Raison |',
  '|---|---|---|---|',
  ...decisions.filter(entry=>entry.decision!=='prototype_candidate').map(entry=>`| /${normalizeIPA(entry.ipa)}/ | ${entry.candidate} | ${entry.decision} | ${entry.reason||'—'} |`),
  '',
  '## Prochaines pistes non encore revues',
  '',
  '| Rang | Son | Cibles utiles | Gain utile | Éduscol | Âge min heuristique | Candidats immédiats | Exemples utiles |',
  '|---:|---|---:|---:|---:|---:|---|---|',
  ...nextRows.map(({ipa,row},index)=>`| ${index+1} | /${ipa}/ | ${value(row,'usefulTargetCount')||0} | ${value(row,'usefulWeightedGain')||0} | ${value(row,'schoolTargetCount')||0} | ${value(row,'minAgeBandCandidate')??'—'} | ${candidateSummary(ipa)} | ${(value(row,'usefulExamples')||[]).slice(0,4).join(', ')||'—'} |`),
  '',
  '## Principe de continuité',
  '',
  '- Rejeter un candidat ne supprime jamais le son : une autre image exacte, une convention visible, une composition ou une route approximative explicite peut rester à rechercher.',
  '- Avant de générer une nouvelle image, vérifier les assets déjà présents et la file de prototypes existants.',
  '- Après prototype : test de dénomination humaine avant toute promotion de garantie.'
];
fs.mkdirSync(path.dirname(reportPath),{recursive:true});
fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(`Applied ${validation.entryCount} sound-visual decisions: ${prototypeQueue.length} prototype routes; ${excluded.length} automatic routes excluded; ${curatedNewImageResearchQueue.length} sounds remain in curated image queue.`);
