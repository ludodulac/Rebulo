// Wave 3: benchmark-informed ranking only; no benchmark-specific representation rule.
import fs from 'node:fs';
import {normalizeIPA,splitIPAUnits} from '../src/phonetic-engine.js';
import {buildProductiveBank} from '../src/rebus-productive-bank.js';
import {phraseToContinuousIPA} from '../src/rebus-phrase-phonetics.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const queue=read('data/rebus-representation-expansion-queue.json');
const wave1=read('data/rebus-productive-bank-wave1.json');
const wave2=read('data/rebus-productive-bank-wave2.json');
const fragmentIdeas=read('data/rebus-fragment-representation-ideas.json');
const pronunciation=read('data/rebus-pronunciation-lexicon.json');
const historical=read('data/rebus-productive-bank-wave2-phrase-coverage.json');
const audit=read('data/rebus-representation-bank-audit.json');
const curationBatch=read('data/rebus-representation-curation-batch.json');
const visualSources=[1,2,3,4,5,6,7,8].map(n=>n===1?'data/rebus-sound-visual-curation.json':`data/rebus-sound-visual-curation-wave${n}.json`).filter(fs.existsSync);
const visualDocs=visualSources.map(file=>({file,data:read(file)}));

const outPath='data/rebus-productive-bank-wave3.json';
const impactPath='data/rebus-productive-bank-wave3-impact-ranking.json';
const benchPath='data/rebus-productive-bank-wave3-benchmarks.json';
const metricsPath='data/rebus-productive-bank-wave3-useful-metrics.json';
const reportPath='docs/REBUS_PRODUCTIVE_BANK_WAVE3_REPORT.md';

const baseBank=buildProductiveBank({fragmentIdeas,productiveWaves:[wave1,wave2]});
const seriousSound=s=>s.visibleConventions.length>0||s.representations.some(r=>r.editorialStatus==='retain'&&(r.visualBrief||r.representationProposed));
const baseSeriousIpas=new Set([...baseBank.values()].filter(seriousSound).map(s=>s.ipa));
const baseIndexedIpas=new Set(baseBank.keys());
const basePieces=[...baseSeriousIpas].map(ipa=>({ipa,units:splitIPAUnits(ipa)})).filter(x=>x.units.length);

const candidateKey=(ipa,word)=>`${normalizeIPA(ipa)}\u0000${String(word||'').trim()}`;
const nounLike=pos=>String(pos||'').toUpperCase().split(':')[0]==='NOM';
const exactCandidates=row=>(row.exactCandidates||[]).filter(c=>c?.word).map(c=>({word:String(c.word).trim(),pos:c.pos||null,frequency:Number(c.frequency)||0,proofStatus:c.proofStatus||'lexical_exact_only'}));
const priorDecisionByKey=new Map();
for(const {file,data} of visualDocs){for(const e of data.entries||[]){const ipa=normalizeIPA(e.ipa),word=String(e.candidate||'').trim();if(!ipa||!word)continue;const key=candidateKey(ipa,word);const rank=e.decision==='prototype_candidate'?3:e.decision==='defer_candidate'?2:1;const old=priorDecisionByKey.get(key);const oldRank=old?.decision==='prototype_candidate'?3:old?.decision==='defer_candidate'?2:old?1:0;if(rank>=oldRank)priorDecisionByKey.set(key,{...e,sourceFile:file});}}
for(const row of curationBatch.rows||[]){const ipa=normalizeIPA(row.ipa);for(const c of row.candidates||[]){if(c.visualRoute!=='curated_prototype')continue;const word=String(c.word||'').trim();if(!ipa||!word)continue;const key=candidateKey(ipa,word);if(priorDecisionByKey.get(key)?.decision==='prototype_candidate')continue;priorDecisionByKey.set(key,{ipa,candidate:word,decision:'prototype_candidate',visualConcept:c.visualConcept||'',visualPlausibility:c.visualPlausibility||'unknown',spontaneousNamingRisk:c.spontaneousNamingRisk||'unknown',mainConfusions:c.mainConfusions||[],reason:'Curated prototype from representation curation batch.',sourceFile:'data/rebus-representation-curation-batch.json'});}}
const priorPrototypeIpas=new Set([...priorDecisionByKey.entries()].filter(([,e])=>e.decision==='prototype_candidate').map(([k])=>k.split('\u0000')[0]));

function bestCoverage(continuousIpa,pieces,extra=null){
  const target=splitIPAUnits(continuousIpa);const n=target.length;const all=extra?[...pieces,extra]:pieces;const dp=Array(n+1).fill(null);dp[0]={covered:0,pieceCount:0,pieces:[]};
  const better=(a,b)=>!b||a.covered>b.covered||(a.covered===b.covered&&a.pieceCount<b.pieceCount);
  for(let i=0;i<n;i++){const state=dp[i];if(!state)continue;const gap={covered:state.covered,pieceCount:state.pieceCount,pieces:state.pieces};if(better(gap,dp[i+1]))dp[i+1]=gap;for(const p of all){const len=p.units.length;if(!len||i+len>n)continue;let ok=true;for(let j=0;j<len;j++)if(target[i+j]!==p.units[j]){ok=false;break;}if(!ok)continue;const next={covered:state.covered+len,pieceCount:state.pieceCount+1,pieces:[...state.pieces,p.ipa]};if(better(next,dp[i+len]))dp[i+len]=next;}}
  const best=dp[n]||{covered:0,pieceCount:0,pieces:[]};return{unitCount:n,coveredUnitCount:best.covered,coverageRatio:n?best.covered/n:0,pieces:best.pieces,uncoveredUnitCount:n-best.covered};
}

const historicalPhrases=(historical.rows||[]).map(r=>r.phrase);
const historicalPhon=historicalPhrases.map(phrase=>({phrase,phon:phraseToContinuousIPA(phrase,pronunciation)}));
const historicalBaseline=historicalPhon.map(({phrase,phon})=>({phrase,phon,...bestCoverage(phon.continuousIpa,basePieces)}));

const eligible=(queue.rows||[]).map(row=>({...row,ipa:normalizeIPA(row.ipa),candidates:exactCandidates(row)})).filter(row=>row.ipa&&row.candidates.length&&!baseIndexedIpas.has(row.ipa));
const impactRows=[];
for(const row of eligible){const piece={ipa:row.ipa,units:splitIPAUnits(row.ipa)};let marginalUnits=0,phraseHitCount=0,occurrenceCount=0;for(let i=0;i<historicalPhon.length;i++){const phon=historicalPhon[i].phon;const before=historicalBaseline[i];const after=bestCoverage(phon.continuousIpa,basePieces,piece);const delta=after.coveredUnitCount-before.coveredUnitCount;if(delta>0){marginalUnits+=delta;phraseHitCount++;}const units=splitIPAUnits(phon.continuousIpa);for(let start=0;start+piece.units.length<=units.length;start++){let ok=true;for(let j=0;j<piece.units.length;j++)if(units[start+j]!==piece.units[j]){ok=false;break;}if(ok)occurrenceCount++;}}
  const spans=(row.syllableSpans||[]).map(Number).filter(Number.isFinite);const span=Math.min(...spans,99);const unitCount=piece.units.length;const multiple=row.candidates.length>=2;const nounCount=row.candidates.filter(c=>nounLike(c.pos)).length;const hasPrototype=priorPrototypeIpas.has(row.ipa);
  const lane=unitCount<=4?'A_raw_productive':(span<=2?'B_long_clear_block':'other');
  const score=marginalUnits*100000+phraseHitCount*18000+occurrenceCount*5000+Math.min(80,Number(row.usefulTargetCount)||0)*250+(unitCount<=4?9000:0)+(span<=2?5000:0)+(multiple?3500:0)+(nounCount?4500:0)+(hasPrototype?8000:0)+Math.log1p(Math.max(0,Number(row.usefulWeightedGain)||0))*300;
  impactRows.push({ipa:row.ipa,marginalUnits,phraseHitCount,occurrenceCount,unitCount,syllableSpan:span===99?null:span,usefulTargetCount:Number(row.usefulTargetCount)||0,usefulWeightedGain:Number(row.usefulWeightedGain)||0,exactWordCount:row.candidates.length,nounCandidateCount:nounCount,hasPriorPrototype:hasPrototype,lane,selectionScore:Number(score.toFixed(3)),row});
}
impactRows.sort((a,b)=>b.selectionScore-a.selectionScore||b.marginalUnits-a.marginalUnits||b.usefulTargetCount-a.usefulTargetCount||a.ipa.localeCompare(b.ipa,'fr'));

const chosen=[];const chosenSet=new Set();const add=x=>{if(x&&!chosenSet.has(x.ipa)&&chosen.length<400){chosen.push(x);chosenSet.add(x.ipa);}};
impactRows.slice(0,300).forEach(add);
impactRows.filter(x=>x.lane==='B_long_clear_block'&&x.unitCount>=4).slice(0,140).forEach(add);
impactRows.filter(x=>x.lane==='A_raw_productive').slice(0,180).forEach(add);
impactRows.forEach(add);
if(chosen.length!==400)throw new Error(`Expected 400 wave3 sounds, got ${chosen.length}`);

function semanticCategory(word,pos,concept=''){
 const t=`${word} ${concept}`.toLocaleLowerCase('fr');
 if(/chien|chat|oiseau|poisson|insecte|animal|loup|lion|ours|vache|cheval|mouche|poule|coq|canard|âne|lapin|rat/.test(t))return'animal';
 if(/main|bras|pied|tête|oeil|œil|yeux|nez|dent|bouche|dos|cou|jambe|corps|visage/.test(t))return'body_part';
 if(/pain|lait|riz|thé|café|pomme|poire|fruit|gâteau|soupe|fromage|beurre|sel|sucre|jus|vin|blé/.test(t))return'food';
 if(/route|rue|gare|port|mer|parc|pré|ville|maison|école|jardin|champ|plage/.test(t))return'place_or_landscape';
 if(/père|mère|fils|fille|bébé|roi|reine|homme|femme|enfant|personne/.test(t))return'person';
 if(String(pos||'').toUpperCase().startsWith('VER'))return'drawable_action';
 return'concrete_object_or_scene';
}
function detailedBrief(e,word){const base=String(e.visualConcept||e.brief||'').trim();const conf=(e.mainConfusions||e.confusions||[]).filter(Boolean);const avoid=conf.length?` Éviter une composition qui ferait répondre « ${conf.join(' », « ')} » plutôt que « ${word} ».`:'';return `${base}${base&&/[.!?]$/.test(base)?'':' .'}`.replace(' .','.').trim()+` Illustration jeunesse de rébus, sujet principal unique ou scène minimale, cadrage centré, forme immédiatement lisible, fond simple, aucun texte ni symbole parasite.${avoid}`;}

const soundRowSchema=['rank','ipa','usefulTargetCount','syllableSpan','exactWords','exactCandidateMetadata','selectionScore','selectionLane','historicalMarginalUnits','historicalPhraseHitCount','historicalOccurrenceCount'];
const soundRows=[],representations=[],explicitDeferrals=[],explicitRejections=[];const visibleConventionReferences={};
for(let i=0;i<chosen.length;i++){const item=chosen[i],row=item.row,candidates=item.row.candidates;const words=[...new Set(candidates.map(c=>c.word))];soundRows.push([i+1,item.ipa,item.usefulTargetCount,item.syllableSpan,words,candidates.map(c=>[c.word,c.pos,c.frequency]),item.selectionScore,item.lane,item.marginalUnits,item.phraseHitCount,item.occurrenceCount]);const conventions=[...new Set((row.visibleConventions||[]).map(x=>x.label).filter(Boolean))];if(conventions.length)visibleConventionReferences[item.ipa]=conventions;
 for(const c of candidates){const d=priorDecisionByKey.get(candidateKey(item.ipa,c.word));if(d?.decision==='prototype_candidate'&&(d.visualConcept||d.brief)){representations.push({ipa:item.ipa,word:c.word,type:['drawable_action','place_or_landscape','person'].includes(semanticCategory(c.word,c.pos,d.visualConcept||d.brief))?'scene':'pictogram',semanticCategory:semanticCategory(c.word,c.pos,d.visualConcept||d.brief),brief:detailedBrief(d,c.word),anticipatedNamingRisk:d.spontaneousNamingRisk==='unknown'?(d.visualPlausibility==='high'?'medium':'medium_high'):d.spontaneousNamingRisk,confusions:d.mainConfusions||[],editorialStatus:'retain',sourceCuration:d.sourceFile,sourceReason:d.reason||null,frequency:c.frequency});}
 else if(d?.decision==='defer_candidate')explicitDeferrals.push([item.ipa,c.word,d.mainConfusions||[],d.reason||'Prior visual review deferred this exact candidate.']);
 else if(d?.decision==='reject_candidate')explicitRejections.push([item.ipa,c.word,d.mainConfusions||[],d.reason||'Prior visual review rejected this exact candidate.']);
 else if(nounLike(c.pos)&&c.frequency>=1&&item.unitCount<=7)explicitDeferrals.push([item.ipa,c.word,[],`Exact lexical noun retained for visual review because wave 3 found useful compositional yield, but no sufficiently specific curated visual hypothesis exists yet.`]);
 else explicitRejections.push([item.ipa,c.word,[],`Exact lexical relation preserved; no serious pictographic hypothesis is retained. Phonetic yield alone is not visual evidence.`]);}}

const output={version:'3.0.0-wave3',status:'curated_textual_bank_not_automatically_active',policy:{purpose:'Select 400 net-new exact sound relations by potential marginal coverage on a fixed historical natural-phrase benchmark, while preserving a separate unseen control benchmark.',selection:'Candidate impact is measured generically by adding one exact IPA piece to the pre-wave3 serious editorial bank and recomputing maximum covered phonetic units. No phrase-specific rule or representation is created.',lanes:'A_raw_productive prioritizes short reusable bricks; B_long_clear_block preserves longer 1–2 syllable exact blocks that can reduce piece count.',visualGate:'Only pre-existing canonical prototype hypotheses with explicit visual concepts become retained representations; otherwise exact words are explicitly deferred or rejected.',evidence:'spontaneousNamingRisk remains unknown; humanNamingEvidence and clinicalEvidence remain none; runtime stays inactive.'},representationDefaults:{matchStatus:'exact',source:'Lexique 4',spontaneousNamingRisk:'unknown',humanNamingEvidence:'none',clinicalEvidence:'none',runtimeStatus:'inactive_editorial'},soundRowSchema,soundRows,representations,explicitDeferrals,explicitRejections,visibleConventionReferences,selectionSource:{candidateCount:impactRows.length,selectedSoundCount:chosen.length,historicalPhraseCount:historicalPhrases.length,method:'single-candidate marginal recomputation against fixed historical benchmark'}};
fs.writeFileSync(outPath,JSON.stringify(output,null,2)+'\n');
fs.writeFileSync(impactPath,JSON.stringify({schemaVersion:'1.0',status:'preselection_measurement_not_visual_evidence',policy:{benchmarkUse:'Historical benchmark affects ranking only; it never creates phrase-specific representations.',controlIsolation:'Control phrases are not loaded or consulted until after the 400-sound cohort is fixed.'},rows:impactRows.map(({row,...x})=>x)},null,2)+'\n');

const afterBank=buildProductiveBank({fragmentIdeas,productiveWaves:[wave1,wave2,output]});
const afterSeriousIpas=new Set([...afterBank.values()].filter(seriousSound).map(s=>s.ipa));
const afterPieces=[...afterSeriousIpas].map(ipa=>({ipa,units:splitIPAUnits(ipa)})).filter(x=>x.units.length);
const controlPhrases=[
 'Le garçon ferme doucement la fenêtre','Une petite fille dessine un arbre','Mon voisin promène son chien au parc','Nous préparons le dîner dans la cuisine','La cloche sonne à la fin de la classe','Papa cherche ses clés dans son sac','Le vent pousse les feuilles sur le chemin','Un poisson nage près du bateau','Elle écrit une carte pour son ami','Le médecin ouvre la porte du cabinet','Deux vélos passent devant la maison','La maîtresse raconte une histoire courte','Le lapin mange une carotte dans l’herbe','Ils regardent les étoiles après le repas','Ma grand-mère arrose les fleurs du jardin','Le camion livre des boîtes au magasin','Un enfant met ses chaussures avant de partir','La lune éclaire la route pendant la nuit','Nous entendons un oiseau derrière la porte','Le chat saute sur une chaise près de la table'
];
function benchmark(phrases,pieces){const rows=phrases.map(phrase=>{const phon=phraseToContinuousIPA(phrase,pronunciation);return{phrase,pronunciationComplete:phon.complete,continuousIpa:phon.continuousIpa,unresolvedWords:phon.unresolvedWords,...bestCoverage(phon.continuousIpa,pieces)};});const vals=rows.map(r=>r.coverageRatio).sort((a,b)=>a-b);const mean=vals.reduce((a,b)=>a+b,0)/Math.max(1,vals.length);const median=vals.length%2?vals[(vals.length-1)/2]:(vals[vals.length/2-1]+vals[vals.length/2])/2;return{summary:{phraseCount:rows.length,pronunciationResolvedCount:rows.filter(r=>r.pronunciationComplete).length,meanCoverageRatio:Number(mean.toFixed(4)),medianCoverageRatio:Number(median.toFixed(4)),minCoverageRatio:Number((vals[0]||0).toFixed(4)),maxCoverageRatio:Number((vals.at(-1)||0).toFixed(4))},rows};}
const historicalBefore=benchmark(historicalPhrases,basePieces),historicalAfter=benchmark(historicalPhrases,afterPieces),controlBefore=benchmark(controlPhrases,basePieces),controlAfter=benchmark(controlPhrases,afterPieces);
fs.writeFileSync(benchPath,JSON.stringify({schemaVersion:'1.0',status:'editorial_bank_coverage_not_runtime',policy:{historical:'Used only for generic ranking through marginal coverage; no phrase-specific representation rules.',control:'Twenty distinct natural phrases are evaluated only after cohort selection and never influence ranking.'},historical:{before:historicalBefore,after:historicalAfter,gainPoints:Number(((historicalAfter.summary.meanCoverageRatio-historicalBefore.summary.meanCoverageRatio)*100).toFixed(2))},control:{before:controlBefore,after:controlAfter,gainPoints:Number(((controlAfter.summary.meanCoverageRatio-controlBefore.summary.meanCoverageRatio)*100).toFixed(2))}},null,2)+'\n');

const usefulExactIpas=new Set((audit.usefulRows||[]).filter(r=>r.categories?.A_exactFrenchWord===true).map(r=>normalizeIPA(r.ipa)).filter(Boolean));
const seriousUseful=[...afterSeriousIpas].filter(ipa=>usefulExactIpas.has(ipa));
const metrics={schemaVersion:'1.0',status:'editorial_coverage_measurement',usefulExactSoundDenominator:usefulExactIpas.size,seriousRepresentationSoundCountAll:afterSeriousIpas.size,seriousUsefulExactSoundCount:seriousUseful.length,usefulExactSoundSeriousRepresentationPercent:Number((seriousUseful.length/usefulExactIpas.size*100).toFixed(2)),indexedSoundCount:afterBank.size,exactWordRelationCount:[...afterBank.values()].reduce((s,x)=>s+x.exactWords.length,0)};
fs.writeFileSync(metricsPath,JSON.stringify(metrics,null,2)+'\n');

const repIpas=new Set(representations.map(r=>r.ipa)),convIpas=new Set(Object.keys(visibleConventionReferences));
const stats={examinedSoundCount:soundRows.length,enrichedSoundCount:new Set([...repIpas,...convIpas]).size,newExactWordRelationCount:soundRows.reduce((s,r)=>s+new Set(r[4]||[]).size,0),newPictographicRepresentationCount:representations.length,newVisualBriefCount:representations.filter(r=>r.brief).length,rejectedCandidateCount:explicitRejections.length,deferredCandidateCount:explicitDeferrals.length,soundWithoutGoodRepresentationCount:soundRows.filter(r=>!repIpas.has(r[1])&&!convIpas.has(r[1])).length,runtimeActivationCount:0};
const topMarginal=chosen.filter(x=>repIpas.has(x.ipa)||convIpas.has(x.ipa)).sort((a,b)=>b.marginalUnits-a.marginalUnits||b.phraseHitCount-a.phraseHitCount||b.occurrenceCount-a.occurrenceCount).slice(0,20);
const topVisual=representations.slice().sort((a,b)=>(b.frequency||0)-(a.frequency||0)||a.ipa.localeCompare(b.ipa,'fr')).slice(0,20);
const pct=x=>(x*100).toFixed(1)+'%';
const lines=['# Rebulo — banque productive, vague 3 orientée rendement','','> Sélection par rendement phonétique marginal sur le benchmark historique. Le benchmark de contrôle est évalué seulement après la sélection. Aucune activation runtime, aucune image finale.','',`- Sons supplémentaires examinés : ${stats.examinedSoundCount}.`,`- Sons enrichis : ${stats.enrichedSoundCount}.`,`- Relations exactes ajoutées : ${stats.newExactWordRelationCount}.`,`- Représentations pictographiques/scènes : ${stats.newPictographicRepresentationCount}.`,`- Briefs visuels : ${stats.newVisualBriefCount}.`,`- Rejets explicites : ${stats.rejectedCandidateCount}.`,`- Différés : ${stats.deferredCandidateCount}.`,`- Sons sans bonne représentation retenue : ${stats.soundWithoutGoodRepresentationCount}.`,`- Activations runtime : 0.`,'','## Totaux cumulés','',`- Sons indexés : ${metrics.indexedSoundCount}.`,`- Relations son → mot exact : ${metrics.exactWordRelationCount}.`,`- Sons sérieux tous indexés : ${metrics.seriousRepresentationSoundCountAll}.`,`- Sons utiles avec mot exact enrichis : ${metrics.seriousUsefulExactSoundCount} / ${metrics.usefulExactSoundDenominator} (${metrics.usefulExactSoundSeriousRepresentationPercent}%).`,'','## Benchmarks','',`- Historique avant : ${pct(historicalBefore.summary.meanCoverageRatio)} ; après : ${pct(historicalAfter.summary.meanCoverageRatio)} ; gain : ${((historicalAfter.summary.meanCoverageRatio-historicalBefore.summary.meanCoverageRatio)*100).toFixed(2)} points.`,`- Contrôle avant : ${pct(controlBefore.summary.meanCoverageRatio)} ; après : ${pct(controlAfter.summary.meanCoverageRatio)} ; gain : ${((controlAfter.summary.meanCoverageRatio-controlBefore.summary.meanCoverageRatio)*100).toFixed(2)} points.`,`- Historique après — médiane ${pct(historicalAfter.summary.medianCoverageRatio)}, min ${pct(historicalAfter.summary.minCoverageRatio)}, max ${pct(historicalAfter.summary.maxCoverageRatio)}.`,`- Contrôle après — médiane ${pct(controlAfter.summary.medianCoverageRatio)}, min ${pct(controlAfter.summary.minCoverageRatio)}, max ${pct(controlAfter.summary.maxCoverageRatio)}.`,'','## 20 fragments à plus fort rendement marginal','','| Son | Voie | Gain unités historique | Phrases améliorées | Occurrences |','|---|---|---:|---:|---:|',...topMarginal.map(x=>`| /${x.ipa}/ | ${x.lane} | ${x.marginalUnits} | ${x.phraseHitCount} | ${x.occurrenceCount} |`),'','## 20 meilleurs nouveaux concepts visuels','','| Son | Mot | Catégorie | Risque anticipé | Confusions |','|---|---|---|---|---|',...topVisual.map(x=>`| /${x.ipa}/ | ${x.word} | ${x.semanticCategory} | ${x.anticipatedNamingRisk} | ${(x.confusions||[]).join(', ')||'—'} |`),'','## Benchmark historique — après','','| Phrase | Couverture |','|---|---:|',...historicalAfter.rows.map(r=>`| ${r.phrase} | ${pct(r.coverageRatio)} |`),'','## Benchmark de contrôle — après','','| Phrase | Couverture |','|---|---:|',...controlAfter.rows.map(r=>`| ${r.phrase} | ${pct(r.coverageRatio)} |`),'','> Les deux benchmarks mesurent uniquement la couverture éditoriale préparée. Ils ne prouvent ni dénomination spontanée, ni validation clinique, ni disponibilité runtime.'];
fs.writeFileSync(reportPath,lines.join('\n')+'\n');
console.log(JSON.stringify({wave:stats,metrics,historical:{before:historicalBefore.summary,after:historicalAfter.summary,gainPoints:Number(((historicalAfter.summary.meanCoverageRatio-historicalBefore.summary.meanCoverageRatio)*100).toFixed(2))},control:{before:controlBefore.summary,after:controlAfter.summary,gainPoints:Number(((controlAfter.summary.meanCoverageRatio-controlBefore.summary.meanCoverageRatio)*100).toFixed(2))}},null,2));
