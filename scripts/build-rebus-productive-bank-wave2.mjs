import fs from 'node:fs';
import path from 'node:path';
import {normalizeIPA,splitIPAUnits} from '../src/phonetic-engine.js';
import {buildProductiveBank} from '../src/rebus-productive-bank.js';
import {phraseToContinuousIPA} from '../src/rebus-phrase-phonetics.js';

const queuePath='data/rebus-representation-expansion-queue.json';
const differentialPath='data/rebus-representation-differential-preselection.json';
const wave1Path='data/rebus-productive-bank-wave1.json';
const fragmentIdeasPath='data/rebus-fragment-representation-ideas.json';
const pronunciationPath='data/rebus-pronunciation-lexicon.json';
const outputPath='data/rebus-productive-bank-wave2.json';
const coveragePath='data/rebus-productive-bank-wave2-phrase-coverage.json';
const reportPath='docs/REBUS_PRODUCTIVE_BANK_WAVE2_REPORT.md';
const visualSources=[
  'data/rebus-sound-visual-curation.json',
  'data/rebus-sound-visual-curation-wave2.json',
  'data/rebus-sound-visual-curation-wave3.json',
  'data/rebus-sound-visual-curation-wave4.json',
  'data/rebus-sound-visual-curation-wave5.json',
  'data/rebus-sound-visual-curation-wave6.json',
  'data/rebus-sound-visual-curation-wave7.json',
  'data/rebus-sound-visual-curation-wave8.json'
];
const curationBatchPath='data/rebus-representation-curation-batch.json';
for(const file of [queuePath,differentialPath,wave1Path,fragmentIdeasPath,pronunciationPath,curationBatchPath,...visualSources])if(!fs.existsSync(file)){console.error(`Missing required file: ${file}`);process.exit(1);}

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const queue=read(queuePath);
const differential=read(differentialPath);
const wave1=read(wave1Path);
const fragmentIdeas=read(fragmentIdeasPath);
const pronunciation=read(pronunciationPath);
const curationBatch=read(curationBatchPath);
const visualDocs=visualSources.map(file=>({file,data:read(file)}));

const wave1Schema=wave1.soundRowSchema||[];
const wave1IpaIndex=wave1Schema.indexOf('ipa');
const wave1Ipas=new Set((wave1.soundRows||[]).map(row=>normalizeIPA(row[wave1IpaIndex])).filter(Boolean));
const baseBank=buildProductiveBank({fragmentIdeas,productiveWave:wave1});
const baseIndexedIpas=new Set(baseBank.keys());
const baseSeriousIpas=new Set([...baseBank.values()].filter(sound=>sound.representations.some(rep=>rep.editorialStatus==='retain'||rep.representationPotential==='existing_editorial'||rep.representationPotential==='editorial_candidate')||sound.visibleConventions.length).map(sound=>sound.ipa));

const differentialRank=new Map((differential.rows||[]).map(row=>[normalizeIPA(row.ipa),Number(row.rank)||9999]));
const candidateKey=(ipa,word)=>`${normalizeIPA(ipa)}\u0000${String(word||'').trim()}`;
const priorDecisionByKey=new Map();
for(const {file,data} of visualDocs){
  for(const entry of data.entries||[]){
    const ipa=normalizeIPA(entry.ipa),word=String(entry.candidate||'').trim();
    if(!ipa||!word)continue;
    const key=candidateKey(ipa,word);
    const existing=priorDecisionByKey.get(key);
    const weight=entry.decision==='prototype_candidate'?3:entry.decision==='defer_candidate'?2:1;
    const existingWeight=existing?.decision==='prototype_candidate'?3:existing?.decision==='defer_candidate'?2:existing?1:0;
    if(weight>=existingWeight)priorDecisionByKey.set(key,{...entry,sourceFile:file});
  }
}
for(const row of curationBatch.rows||[]){
  const ipa=normalizeIPA(row.ipa);
  for(const candidate of row.candidates||[]){
    if(candidate.visualRoute!=='curated_prototype')continue;
    const word=String(candidate.word||'').trim();if(!ipa||!word)continue;
    const key=candidateKey(ipa,word);
    if(!priorDecisionByKey.has(key)||priorDecisionByKey.get(key).decision!=='prototype_candidate')priorDecisionByKey.set(key,{
      ipa,candidate:word,decision:'prototype_candidate',visualConcept:candidate.visualConcept||'',visualPlausibility:candidate.visualPlausibility||'unknown',spontaneousNamingRisk:candidate.spontaneousNamingRisk||'unknown',mainConfusions:candidate.mainConfusions||[],reason:'Curated prototype from representation curation batch.',sourceFile:curationBatchPath
    });
  }
}

const priorPrototypeIpas=new Set([...priorDecisionByKey.entries()].filter(([,entry])=>entry.decision==='prototype_candidate').map(([key])=>key.split('\u0000')[0]));
const nounLike=pos=>String(pos||'').toUpperCase().split(':')[0]==='NOM';
const exactCandidates=row=>(row.exactCandidates||[]).filter(c=>c?.word).map(c=>({word:String(c.word).trim(),pos:c.pos||null,frequency:Number(c.frequency)||0,proofStatus:c.proofStatus||'lexical_exact_only'}));
const rowScore=row=>{
  const ipa=normalizeIPA(row.ipa);const candidates=exactCandidates(row);const units=splitIPAUnits(ipa).length;const spans=(row.syllableSpans||[]).map(Number).filter(Number.isFinite);const minSpan=Math.min(...spans,99);
  let score=0;
  if(priorPrototypeIpas.has(ipa))score+=12000;
  const dRank=differentialRank.get(ipa);if(dRank)score+=Math.max(0,5000-dRank*12);
  score+=Math.min(500,Number(row.usefulTargetCount)||0)*22;
  score+=Math.log1p(Math.max(0,Number(row.usefulWeightedGain)||0))*70;
  if(minSpan<=1)score+=900;else if(minSpan<=2)score+=500;else score-=300;
  if(units<=2)score+=900;else if(units<=4)score+=600;else if(units<=6)score+=250;
  if(candidates.length>=2)score+=550;
  if(candidates.some(c=>nounLike(c.pos)))score+=450;
  if(candidates.filter(c=>nounLike(c.pos)).length>=2)score+=300;
  if((row.visibleConventions||[]).length)score+=100;
  return score;
};

const eligible=(queue.rows||[]).filter(row=>{
  const ipa=normalizeIPA(row.ipa);
  return ipa&&exactCandidates(row).length&&!wave1Ipas.has(ipa)&&!baseIndexedIpas.has(ipa);
}).map(row=>({...row,_selectionScore:rowScore(row)})).sort((a,b)=>b._selectionScore-a._selectionScore||Number(b.usefulTargetCount||0)-Number(a.usefulTargetCount||0)||normalizeIPA(a.ipa).localeCompare(normalizeIPA(b.ipa),'fr'));
const selected=eligible.slice(0,400);
if(selected.length!==400)throw new Error(`Expected 400 new sounds, got ${selected.length}`);

const animals=new Set(['âne','biche','bouc','cerf','chien','coq','cygne','dinde','lion','loup','mouche','mouton','ours','poule','renard','singe','taupe','tigre','vache','ver']);
const body=new Set(['bouche','bras','cou','dent','doigt','dos','face','foie','genou','jambe','main','nez','oeil','oreille','peau','pied','sein','tête']);
const foods=new Set(['beurre','blé','café','citron','crème','fraise','lait','mie','pain','pâte','poire','pomme','riz','sel','sucre','thé','vin']);
const clothing=new Set(['bas','botte','cape','gant','habit','jupe','pull','robe','sac']);
const places=new Set(['bar','camp','cour','gare','mer','parc','port','pré','rue','ville']);
const people=new Set(['bébé','fille','fils','gars','mère','père','roi','soeur']);
function semanticCategory(word,pos,concept=''){
  const w=String(word).toLocaleLowerCase('fr');const text=`${w} ${concept}`.toLocaleLowerCase('fr');
  if(animals.has(w)||/(animal|oiseau|poisson|insecte|crustacé)/.test(text))return'animal';
  if(body.has(w)||/(corps|visage|doigt|main|jambe|oreille|nez|dent)/.test(text))return'body_part';
  if(foods.has(w)||/(aliment|fruit|légume|boisson|fromage|pain|gâteau)/.test(text))return'food';
  if(clothing.has(w)||/(vêtement|chaussure|chapeau)/.test(text))return'clothing';
  if(places.has(w)||/(lieu|route|rue|gare|port|champ|mer)/.test(text))return'place_or_landscape';
  if(people.has(w)||/(personne|enfant|homme|femme|père|mère)/.test(text))return'person';
  if(String(pos||'').toUpperCase().startsWith('VER'))return'drawable_action';
  if(/(pluie|vent|orage|nuit|jour|soleil|lune|fumée|feu)/.test(text))return'scene_or_phenomenon';
  return'concrete_object_or_scene';
}
function detailedBrief(entry,word){
  const base=String(entry.visualConcept||entry.brief||'').trim();
  const conf=(entry.mainConfusions||entry.confusions||[]).filter(Boolean);
  const avoid=conf.length?` Éviter explicitement une composition qui ferait répondre « ${conf.join(' », « ')} » plutôt que « ${word} ».`:'';
  return `${base}${base&&/[.!?]$/.test(base)?'':' .'}`.replace(' .','.').trim()+` Illustration jeunesse de rébus, sujet principal unique ou scène minimale, cadrage centré, silhouette ou action immédiatement lisible, fond simple, aucun texte ni symbole parasite.${avoid}`;
}

const soundRowSchema=['rank','ipa','usefulTargetCount','syllableSpan','exactWords','exactCandidateMetadata','selectionScore','selectionSignals'];
const soundRows=[];const representations=[];const explicitDeferrals=[];const explicitRejections=[];const visibleConventionReferences={};
for(let i=0;i<selected.length;i++){
  const row=selected[i],ipa=normalizeIPA(row.ipa),candidates=exactCandidates(row);
  const exactWords=[...new Set(candidates.map(c=>c.word))];
  const spans=(row.syllableSpans||[]).map(Number).filter(Number.isFinite);const span=Math.min(...spans,99);
  const signals=[];
  if(differentialRank.has(ipa))signals.push('differential_preselection');
  if(splitIPAUnits(ipa).length<=4)signals.push('short_phonetic_piece');
  if(span<=1)signals.push('one_syllable');else if(span<=2)signals.push('two_syllables');
  if(exactWords.length>=2)signals.push('multiple_exact_homophones');
  if(candidates.some(c=>nounLike(c.pos)))signals.push('noun_candidate');
  if(priorPrototypeIpas.has(ipa))signals.push('prior_curated_visual_hypothesis');
  if(Number(row.usefulTargetCount)>=10)signals.push('high_reuse');
  soundRows.push([i+1,ipa,Number(row.usefulTargetCount)||0,span===99?null:span,exactWords,candidates.map(c=>[c.word,c.pos,c.frequency]),Number(row._selectionScore.toFixed(3)),signals]);
  const conventions=[...new Set((row.visibleConventions||[]).map(x=>x.label).filter(Boolean))];if(conventions.length)visibleConventionReferences[ipa]=conventions;
  for(const candidate of candidates){
    const key=candidateKey(ipa,candidate.word),decision=priorDecisionByKey.get(key);
    if(decision?.decision==='prototype_candidate'&&(decision.visualConcept||decision.brief)){
      const category=semanticCategory(candidate.word,candidate.pos,decision.visualConcept||decision.brief||'');
      representations.push({
        ipa,word:candidate.word,type:category==='drawable_action'||category==='scene_or_phenomenon'||category==='place_or_landscape'||category==='person'?'scene':'pictogram',semanticCategory:category,
        brief:detailedBrief(decision,candidate.word),anticipatedNamingRisk:decision.spontaneousNamingRisk==='unknown'?(decision.visualPlausibility==='high'?'medium':'medium_high'):decision.spontaneousNamingRisk,
        confusions:decision.mainConfusions||[],editorialStatus:'retain',sourceCuration:decision.sourceFile,sourceReason:decision.reason||null,frequency:candidate.frequency
      });
    }else if(decision?.decision==='defer_candidate'){
      explicitDeferrals.push([ipa,candidate.word,decision.mainConfusions||[],decision.reason||'Exact lexical relation; prior visual review deferred the representation.']);
    }else if(decision?.decision==='reject_candidate'){
      explicitRejections.push([ipa,candidate.word,decision.mainConfusions||[],decision.reason||'Exact lexical relation; prior visual review rejected this candidate as a serious image route.']);
    }else{
      const isPromisingNoun=nounLike(candidate.pos)&&candidate.frequency>=1&&splitIPAUnits(ipa).length<=6;
      if(isPromisingNoun)explicitDeferrals.push([ipa,candidate.word,[],`Exact lexical noun kept for later visual examination; no sufficiently specific curated visual hypothesis exists yet in the canonical research bank.`]);
      else explicitRejections.push([ipa,candidate.word,[],`Exact lexical relation preserved, but no serious pictographic hypothesis is retained in this wave; lexical exactness alone is insufficient.`]);
    }
  }
}

const defaults={matchStatus:'exact',source:'Lexique 4',spontaneousNamingRisk:'unknown',humanNamingEvidence:'none',clinicalEvidence:'none',runtimeStatus:'inactive_editorial'};
const output={
  version:'2.0.0-wave2',status:'curated_textual_bank_not_automatically_active',
  policy:{
    purpose:'Expand the productive SON → exact word(s) → serious representation(s) → visual brief layer with 400 net-new sounds, prioritizing short reusable 1–2 syllable pieces and concrete homophones.',
    selection:'400 sounds are selected after excluding every IPA already indexed by the merged pre-wave2 productive bank. Differential preselection, useful yield, shortness, 1–2 syllable span, homophone multiplicity, noun evidence and prior curated visual hypotheses increase review priority.',
    exactness:'All lexical relations come from the existing exact expansion queue; no approximation is promoted to exact.',
    visualGate:'A pictographic representation is retained only when an existing canonical visual-curation source already contains a prototype hypothesis with a visual concept. Other exact words are explicitly deferred or rejected for this wave.',
    naming:'spontaneousNamingRisk remains unknown in the productive relation. Prior editorial risk is copied only into anticipatedNamingRisk; humanNamingEvidence and clinicalEvidence remain none.',
    activation:'All new relations remain runtime-inactive. This wave creates no final image and no planner/runtime promotion.'
  },
  representationDefaults:defaults,
  soundRowSchema,soundRows,representations,explicitDeferrals,explicitRejections,visibleConventionReferences,
  selectionSource:{queue:queuePath,differential:differentialPath,excludedBaseIndexedSoundCount:baseIndexedIpas.size,selectedSoundCount:selected.length},
  shortCoreMonitor:['pa','pi','li','si','ma','mi','mo','la','le','lu','ʁa','ʁi','ʁo','ka','ko','ku','ta','to','tu','sa','so','su'].map(ipa=>({ipa,status:baseBank.has(ipa)?(baseSeriousIpas.has(ipa)?'already_serious_before_wave2':'already_indexed_without_serious_representation'):'not_previously_indexed'}))
};
fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');

// Build cumulative bank and measure serious editorial coverage.
const cumulativeBank=buildProductiveBank({fragmentIdeas,productiveWaves:[wave1,output]});
const seriousSound= sound=>sound.visibleConventions.length>0||sound.representations.some(rep=>rep.editorialStatus==='retain'&&(rep.visualBrief||rep.representationProposed));
const seriousIpas=new Set([...cumulativeBank.values()].filter(seriousSound).map(sound=>sound.ipa));
const cumulative={
  indexedSoundCount:cumulativeBank.size,
  exactWordRelationCount:[...cumulativeBank.values()].reduce((sum,sound)=>sum+sound.exactWords.length,0),
  seriousRepresentationSoundCount:seriousIpas.size,
  seriousRepresentationRelationCount:[...cumulativeBank.values()].reduce((sum,sound)=>sum+sound.representations.filter(rep=>rep.editorialStatus==='retain'&&(rep.visualBrief||rep.representationProposed)).length+sound.visibleConventions.length,0),
  usefulSoundDenominator:5741,
  usefulSoundSeriousRepresentationPercent:Number((seriousIpas.size/5741*100).toFixed(2))
};

const phrases=[
  'Le chien dort près de la porte',
  'Marie pose le livre sur la table',
  'Nous mangeons du pain avec du fromage',
  'Le train arrive demain matin',
  'Paul regarde la mer depuis le port',
  'La pluie tombe sur le toit',
  'Un chat noir traverse la rue',
  'Les enfants jouent dans le jardin',
  "Je bois un verre d'eau",
  'Le facteur apporte une lettre',
  'Ma sœur prépare une soupe chaude',
  'Il met son manteau avant de sortir',
  'La voiture roule sur la route',
  'Le bébé tient la main de sa mère',
  'Un oiseau construit son nid',
  'Le bateau quitte le port',
  'Elle coupe une pomme avec un couteau',
  "Nous prenons le bus après l'école",
  'Le soleil se lève derrière la maison',
  'Grand-père lit le journal dans le salon'
];
const seriousPieces=[...seriousIpas].map(ipa=>({ipa,units:splitIPAUnits(ipa)})).filter(x=>x.units.length).sort((a,b)=>b.units.length-a.units.length||a.ipa.localeCompare(b.ipa,'fr'));
function bestEditorialCoverage(continuousIpa=''){
  const target=splitIPAUnits(continuousIpa);const n=target.length;const dp=Array(n+1).fill(null);dp[0]={covered:0,pieces:[],gaps:0};
  const better=(a,b)=>!b||a.covered>b.covered||(a.covered===b.covered&&a.pieces.length<b.pieces.length)||(a.covered===b.covered&&a.pieces.length===b.pieces.length&&a.gaps<b.gaps);
  for(let i=0;i<n;i++){
    const state=dp[i];if(!state)continue;
    const gap={covered:state.covered,pieces:state.pieces,gaps:state.gaps+1};if(better(gap,dp[i+1]))dp[i+1]=gap;
    for(const piece of seriousPieces){
      const len=piece.units.length;if(i+len>n)continue;let ok=true;for(let j=0;j<len;j++)if(target[i+j]!==piece.units[j]){ok=false;break;}if(!ok)continue;
      const next={covered:state.covered+len,pieces:[...state.pieces,piece.ipa],gaps:state.gaps};if(better(next,dp[i+len]))dp[i+len]=next;
    }
  }
  const best=dp[n]||{covered:0,pieces:[],gaps:n};return{unitCount:n,coveredUnitCount:best.covered,coverageRatio:n?Number((best.covered/n).toFixed(4)):0,pieces:best.pieces,uncoveredUnitCount:n-best.covered};
}
const phraseRows=phrases.map(phrase=>{const phon=phraseToContinuousIPA(phrase,pronunciation);const coverage=bestEditorialCoverage(phon.continuousIpa);return{phrase,pronunciationComplete:phon.complete,continuousIpa:phon.continuousIpa,unresolvedWords:phon.unresolvedWords,...coverage};});
const coverageSummary={phraseCount:phraseRows.length,pronunciationResolvedCount:phraseRows.filter(x=>x.pronunciationComplete).length,meanCoverageRatio:Number((phraseRows.reduce((s,x)=>s+x.coverageRatio,0)/phraseRows.length).toFixed(4)),phrasesAtLeastHalfCovered:phraseRows.filter(x=>x.coverageRatio>=.5).length,phrasesFullyCovered:phraseRows.filter(x=>x.coverageRatio===1).length};
fs.writeFileSync(coveragePath,JSON.stringify({schemaVersion:'1.0',status:'editorial_bank_coverage_not_runtime',policy:{independence:'The twenty phrases are fixed ordinary French sentences chosen independently of the selected wave2 sounds. No phrase-specific representation rule exists.',interpretation:'Coverage uses only IPA pieces with a retained editorial representation or canonical visible convention. Runtime activation is irrelevant and remains unchanged.'},summary:coverageSummary,rows:phraseRows},null,2)+'\n');

const retainedIpas=new Set(representations.map(x=>x.ipa));const conventionIpas=new Set(Object.keys(visibleConventionReferences));
const stats={
  examinedSoundCount:soundRows.length,
  enrichedSoundCount:new Set([...retainedIpas,...conventionIpas]).size,
  newExactWordRelationCount:soundRows.reduce((s,row)=>s+new Set(row[4]||[]).size,0),
  multipleExactHomophoneSoundCount:soundRows.filter(row=>new Set(row[4]||[]).size>=2).length,
  newPictographicRepresentationCount:representations.filter(x=>x.type==='pictogram'||x.type==='scene').length,
  newVisualBriefCount:representations.filter(x=>x.brief).length,
  rejectedCandidateCount:explicitRejections.length,
  deferredCandidateCount:explicitDeferrals.length,
  soundWithoutGoodRepresentationCount:soundRows.filter(row=>!retainedIpas.has(row[1])&&!conventionIpas.has(row[1])).length,
  runtimeActivationCount:0
};
const topExamples=representations.slice().sort((a,b)=>(b.frequency||0)-(a.frequency||0)).slice(0,20);
const lines=[
  '# Rebulo — banque productive, vague 2',
  '',
  '> Vague éditoriale uniquement : aucune image finale et aucune activation runtime.',
  '',
  `- Sons supplémentaires examinés : ${stats.examinedSoundCount}.`,
  `- Sons enrichis : ${stats.enrichedSoundCount}.`,
  `- Nouvelles relations son → mot exact : ${stats.newExactWordRelationCount}.`,
  `- Sons à homophonie exacte multiple : ${stats.multipleExactHomophoneSoundCount}.`,
  `- Représentations pictographiques/scènes intégrées : ${stats.newPictographicRepresentationCount}.`,
  `- Briefs visuels : ${stats.newVisualBriefCount}.`,
  `- Rejets explicites : ${stats.rejectedCandidateCount}.`,
  `- Différés : ${stats.deferredCandidateCount}.`,
  `- Sons sans bonne représentation retenue : ${stats.soundWithoutGoodRepresentationCount}.`,
  `- Activations runtime : ${stats.runtimeActivationCount}.`,
  '',
  '## Totaux cumulés',
  '',
  `- Sons indexés : ${cumulative.indexedSoundCount}.`,
  `- Relations son → mot exact : ${cumulative.exactWordRelationCount}.`,
  `- Sons avec au moins une représentation éditoriale sérieuse : ${cumulative.seriousRepresentationSoundCount}.`,
  `- Relations éditoriales sérieuses (conventions comprises) : ${cumulative.seriousRepresentationRelationCount}.`,
  `- Couverture des 5 741 sons utiles par au moins une représentation sérieuse : ${cumulative.usefulSoundSeriousRepresentationPercent}%.`,
  '',
  '## Vingt exemples de représentations intégrées',
  '',
  '| Son | Mot | Catégorie | Risque anticipé | Confusions |',
  '|---|---|---|---|---|',
  ...topExamples.map(x=>`| /${x.ipa}/ | ${x.word} | ${x.semanticCategory} | ${x.anticipatedNamingRisk} | ${(x.confusions||[]).join(', ')||'—'} |`),
  '',
  '## Couverture de 20 phrases naturelles indépendantes',
  '',
  `Couverture moyenne de la chaîne phonétique par des représentations éditoriales préparées : ${(coverageSummary.meanCoverageRatio*100).toFixed(1)}%.`,
  '',
  '| Phrase | IPA résolue | Couverture éditoriale | Unités non couvertes |',
  '|---|---|---:|---:|',
  ...phraseRows.map(x=>`| ${x.phrase} | ${x.pronunciationComplete?'oui':'non'} | ${(x.coverageRatio*100).toFixed(1)}% | ${x.uncoveredUnitCount} |`),
  '',
  '> Cette couverture est purement éditoriale : une brique préparée n’est ni une image fabriquée, ni une preuve de dénomination humaine, ni une activation produit.'
];
fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(JSON.stringify({wave:stats,cumulative,phraseCoverage:coverageSummary},null,2));
