import fs from 'node:fs';
import { normalizeIPA, splitIPAUnits } from '../src/phonetic-engine.js';
import { buildProductiveBank } from '../src/rebus-productive-bank.js';

const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const audit = read('data/rebus-representation-bank-audit.json');
const diagnostic = read('data/rebus-remaining-reservoir-audit-diagnostic.json');
const fragmentIdeas = read('data/rebus-fragment-representation-ideas.json');
const waves = [1,2,3,4,5].map(n=>read(`data/rebus-productive-bank-wave${n}.json`));
const bank = buildProductiveBank({fragmentIdeas,productiveWaves:waves});
const indexed = new Set([...bank.keys()].map(normalizeIPA));
const seriousSound = s => s.visibleConventions.length>0 || s.representations.some(r=>['retain','prototype_candidate'].includes(r.editorialStatus)&&(r.visualBrief||r.representationProposed));
const seriousCovered = new Set([...bank.values()].filter(seriousSound).map(s=>normalizeIPA(s.ipa)));
for(const file of fs.readdirSync('data').filter(f=>/^rebus-sound-visual-curation(?:-wave\d+)?\.json$/.test(f))){for(const e of read(`data/${file}`).entries||[]){if(e.decision==='prototype_candidate'&&e.ipa)seriousCovered.add(normalizeIPA(e.ipa));}}

// Audit-only semantic overrides. These DO NOT create representations or briefs.
// Grade A = strong next-wave candidate; B = plausible with naming-control work;
// C = possible but ambiguous/rare/contextual; D is inferred for the rest.
const auditConcrete = new Map(Object.entries({
  'maman':['person','A','very common generic person; visual naming plausible'],
  'monsieur':['person','B','common but likely named homme/monsieur interchangeably'],
  'famille':['person_scene','B','common simple group scene, but composition varies'],
  'bureau':['object_place','A','common desk/office homonym; concrete and frequent'],
  'chef':['person','B','recognizable only with role cues; chef/boss ambiguity'],
  'prison':['place','A','distinctive place, common lexical item'],
  'film':['object_media','B','film reel/screen route possible; movie/image naming ambiguity'],
  'agent':['person','C','role underspecified without context'],
  'tour':['place_object','A','tower is concrete, short and highly reusable'],
  'visage':['body','A','high-frequency body concept, visually direct'],
  'pièce':['object_place','B','coin/room/piece polysemy gives options but naming ambiguity'],
  'patron':['person','C','role is context-dependent'],
  'oncle':['person','C','kinship cannot be read from isolated portrait'],
  'club':['object_place','B','club object or venue; exact naming needs control'],
  'vaisseau':['vehicle','A','spaceship/ship route is concrete and visually strong'],
  'cerveau':['body','A','anatomically direct, common'],
  'journal':['object','A','newspaper object, common and compact'],
  'témoin':['person','C','role not visually self-evident'],
  'gamin':['person','B','child is drawable; lexical choice enfant/gamin remains a risk'],
  'grand-mère':['person','B','common but kinship naming requires context'],
  'grand-père':['person','B','common but kinship naming requires context'],
  'village':['place','A','concrete place with clear compact scene'],
  'papier':['object','A','very common object/material; sheet route is simple'],
  'monstre':['character','A','highly imageable generic character'],
  'campagne':['place_nature','B','landscape is clear but may be named champ/paysage'],
  'star':['person_symbol','C','celebrity route needs context; star also English borrowing'],
  'os':['body','A','short, direct body object'],
  'suspect':['person','C','role requires narrative cues'],
  'shérif':['person','B','badge/hat route possible without text, but western cues needed'],
  'morceau':['object','C','too generic unless a specific material is chosen'],
  'ministre':['person','C','role is not visually stable without symbols/context'],
  'dossier':['object','A','folder/file object is common and drawable without text'],
  'chanson':['sound_concept','C','visual route indirect'],
  'flic':['person','C','colloquial and likely named policier'],
  'spectacle':['scene','C','scene is drawable but target word is not spontaneous'],
  'gosse':['person','B','child is clear; lexical competition enfant/gamin'],
  'copain':['person_relation','C','relationship is not visible from one person'],
  'signal':['object_symbol','B','traffic signal route plausible; naming competition feu/panneau'],
  'membre':['body_person','C','polysemy and generic body-part meaning'],
  'article':['object_abstract','C','newspaper/article route generally requires text'],
  'tante':['person','C','kinship cannot be read from isolated portrait'],
  'match':['scene','C','sports scene likely named football/jeu rather than match'],
  'planète':['nature','A','clear astronomical object, common'],
  'hêtre':['nature','B','tree is drawable but exact species naming is weak'],
  'bouleau':['nature','B','tree species, visually plausible but naming risk high'],
  'poule':['animal','A','common animal, direct'],
  'spore':['nature','C','microscopic and naming unlikely'],
  'thermes':['place','C','rare target and architecture ambiguity'],
  'éponge':['object','A','common distinctive object'],
  'croissant':['food_shape','A','very common food/shape, direct'],
  'ovale':['shape','B','simple shape but may be named ellipse'],
  'bise':['action_nature','C','polysemy kiss/wind; ambiguous'],
  'but':['object_scene','A','football goal is clear and short'],
  'butte':['nature','B','small hill; naming hill/mound competition'],
  'luth':['object','B','instrument is concrete but rare'],
  'lutte':['action','C','action naming may vary combat/bagarre'],
  'ara':['animal','B','parrot species, visually strong but exact word less common'],
  'haras':['place','B','horse-breeding place; requires multiple cues'],
  'maki':['food','B','sushi item is concrete and compact'],
  'maquis':['nature_place','C','vegetation/Resistance polysemy and naming risk'],
  'panne':['scene_object','C','breakdown scene likely named voiture cassée/problème'],
  'paonne':['animal','C','very rare lexical target'],
  'kit':['object','B','set of tools/items, exact naming depends on context'],
  'tripe':['food_body','C','concrete but undesirable/low spontaneous naming'],
  'trappe':['object','A','distinct hatch/trapdoor object, compact'],
  'filet':['object','A','net object, common and visually distinctive'],
  'batte':['object','A','bat object, short and direct'],
  'brique':['object','A','very common, compact, visually distinctive'],
  'goutte':['nature_shape','A','simple droplet, short and direct'],
  'cachette':['place_scene','B','simple hiding place scene but naming may vary'],
  'relais':['object_place','C','multiple senses and naming ambiguity'],
  'statue':['object','A','very imageable object'],
  'fantôme':['character','A','very imageable generic character'],
  'roc':['nature','A','short concrete natural object'],
  'jean':['clothing','A','common clothing item, direct'],
  'gorge':['body','B','body location needs framing; throat/neck confusion'],
  'pension':['place_abstract','C','multiple senses and context dependence'],
  'bâton':['object','A','very common, short, direct'],
  'dessin':['object','B','requires a drawing-within-drawing; target may be image'],
  'palais':['place','A','distinct building, common enough'],
  'palet':['object','B','small disc; hockey/game context may be needed'],
  'canne':['object','A','walking stick, short and direct'],
  'khan':['person','C','rare title, visually unstable'],
  'cerf':['animal','A','clear animal, short and common enough'],
  'serre':['place','A','greenhouse is concrete and visually distinctive'],
  'serf':['person','C','historical role, naming unlikely'],
  'mât':['object','A','mast is concrete and short'],
  'mas':['place','C','regional house term, naming unlikely'],
  'van':['vehicle','A','distinct vehicle, short'],
  'vanne':['object','B','valve is concrete but naming may be robinet'],
  'pouce':['body','A','body part, short and direct'],
  'pousse':['nature','B','plant shoot is concrete but lexical competition germe'],
}));

const exactUseful=(audit.usefulRows||[]).filter(r=>r?.categories?.A_exactFrenchWord&&(r.exactWords||[]).length);
const remaining=exactUseful.filter(r=>!seriousCovered.has(normalizeIPA(r.ipa)));
const netNew=remaining.filter(r=>!indexed.has(normalizeIPA(r.ipa)));
const span=r=>{const xs=(r.syllableSpans||[]).map(Number).filter(Number.isFinite);return xs.length?Math.min(...xs):null};
const units=r=>splitIPAUnits(normalizeIPA(r.ipa)).length;
const words=r=>[...new Map((r.exactWords||[]).filter(x=>x?.word).map(x=>[String(x.word).trim().toLocaleLowerCase('fr'),{word:String(x.word).trim(),pos:x.pos||null,frequency:Number(x.frequency)||0}])).values()];
const gradeRank={A:4,B:3,C:2,D:1};
const falseNegativeSet=new Set((diagnostic.topUnclassifiedFrequentNouns||[]).map(x=>`${normalizeIPA(x.ipa)}\0${String(x.word).toLocaleLowerCase('fr')}`));

function classifyWord(w){
  const k=w.word.toLocaleLowerCase('fr');
  const manual=auditConcrete.get(k);
  if(manual)return{grade:manual[1],category:manual[0],reason:manual[2],manualConcrete:true};
  const pos=String(w.pos||'').toUpperCase();
  if(pos.startsWith('NOM')&&w.frequency>=20)return{grade:'C',category:'unreviewed_frequent_noun',reason:'frequent noun missed by explicit concrete lexicon; semantic/imageability review still needed',manualConcrete:false};
  if(pos.startsWith('NOM')&&w.frequency>=2)return{grade:'C',category:'unreviewed_noun',reason:'noun with some frequency but no controlled concrete classification',manualConcrete:false};
  return{grade:'D',category:'low_visual_evidence',reason:'no strong concrete/imageable evidence in this audit',manualConcrete:false};
}
function candidateRow(r){
  const ipa=normalizeIPA(r.ipa),syllableSpan=span(r),unitCount=units(r),ws=words(r).map(w=>({...w,...classifyWord(w)}));
  ws.sort((a,b)=>gradeRank[b.grade]-gradeRank[a.grade]||b.frequency-a.frequency);
  const best=ws[0]||{grade:'D',frequency:0,word:'',category:'none',reason:'no exact word'};
  const concreteCount=ws.filter(w=>['A','B'].includes(w.grade)).length;
  const score=gradeRank[best.grade]*100 + Math.log1p(Math.max(0,best.frequency))*12 + Math.log1p(Number(r.usefulWeightedGain)||0)*6 + Math.log1p(Number(r.usefulTargetCount)||0)*7 + (syllableSpan===1?20:syllableSpan===2?14:0) + (unitCount<=3?16:unitCount<=5?10:0) + Math.max(0,concreteCount-1)*18;
  return{ipa,grade:best.grade,score:Number(score.toFixed(3)),syllableSpan,unitCount,usefulTargetCount:Number(r.usefulTargetCount)||0,usefulWeightedGain:Number(r.usefulWeightedGain)||0,bestWord:best.word,bestWordFrequency:best.frequency,bestCategory:best.category,bestReason:best.reason,concreteCandidateCount:concreteCount,exactWordCount:ws.length,words:ws};
}
const candidates=netNew.map(candidateRow).sort((a,b)=>gradeRank[b.grade]-gradeRank[a.grade]||b.score-a.score||a.ipa.localeCompare(b.ipa,'fr'));
const gradeCounts=Object.fromEntries(['A','B','C','D'].map(g=>[g,candidates.filter(x=>x.grade===g).length]));
const top100=candidates.slice(0,100);
const topMono=candidates.filter(x=>x.syllableSpan===1).slice(0,30);
const topBi=candidates.filter(x=>x.syllableSpan===2).slice(0,30);

const falseNegatives=[];
for(const c of candidates){for(const w of c.words){const key=`${c.ipa}\0${w.word.toLocaleLowerCase('fr')}`;if(w.manualConcrete&&falseNegativeSet.has(key))falseNegatives.push({ipa:c.ipa,word:w.word,frequency:w.frequency,grade:w.grade,category:w.category,reason:w.reason,syllableSpan:c.syllableSpan,unitCount:c.unitCount});}}
falseNegatives.sort((a,b)=>gradeRank[b.grade]-gradeRank[a.grade]||b.frequency-a.frequency);

const multiEditorial=candidates.filter(c=>c.words.filter(w=>['A','B','C'].includes(w.grade)&&w.manualConcrete).length>=2).map(c=>({...c,plausibleWords:c.words.filter(w=>['A','B','C'].includes(w.grade)&&w.manualConcrete)})).sort((a,b)=>b.plausibleWords.filter(w=>['A','B'].includes(w.grade)).length-a.plausibleWords.filter(w=>['A','B'].includes(w.grade)).length||b.score-a.score);

const dist=arr=>({total:arr.length,oneSyllable:arr.filter(r=>span(r)===1).length,twoSyllable:arr.filter(r=>span(r)===2).length,atMost5Units:arr.filter(r=>units(r)<=5).length,homophonesAtLeast2:arr.filter(r=>words(r).length>=2).length,homophonesAtLeast3:arr.filter(r=>words(r).length>=3).length,homophonesAtLeast4:arr.filter(r=>words(r).length>=4).length});

const out={version:'remaining-reservoir-audit-final-1',sourceMainHead:'4015af269d1698d11c6ae8441f426f148799aee9',denominatorUsefulExact:exactUseful.length,currentBank:{indexedSounds:bank.size,exactRelations:[...bank.values()].reduce((n,s)=>n+s.exactWords.length,0)},remainingNotSeriouslyCovered:dist(remaining),remainingNetNew:dist(netNew),editorialPotentialGrades:gradeCounts,falseNegativeConcreteCount:falseNegatives.length,falseNegativeConcreteTop:falseNegatives.slice(0,120),top100,top30Monosyllables:topMono,top30Bisyllables:topBi,multiRepresentationCases:multiEditorial.slice(0,40),methodRecommendation:{summary:'Do not launch a broad blind Wave 6. First expand the semantic/imageability lexicon from audited false negatives, then select a small word-first cohort dominated by A and upper-B candidates, with a dedicated multi-homophone lane.',suggestedCohort:'60–100 sounds maximum, split into: 35–50 A candidates, 15–30 B candidates, plus up to 20 multi-representation IPA when at least two distinct concrete words survive naming-control review.',stopRule:'Stop if fewer than 40 A/B sounds survive human editorial review or if acceptance falls below roughly 50%; return to semantic discovery rather than consuming C/D reservoir.'}};
fs.writeFileSync('data/rebus-remaining-reservoir-audit.json',JSON.stringify(out,null,2)+'\n');

const pct=(n,d)=>d?`${(100*n/d).toFixed(1)}%`:'—';
const lines=['# Rebulo — audit final du réservoir restant après Vague 5','',`Source : main ${out.sourceMainHead}. Aucun ajout de représentation, brief ou activation runtime.`,'', '## Réservoir exact restant','',`- Dénominateur utile avec mot exact : **${exactUseful.length}**.`,`- Banque actuelle : **${out.currentBank.indexedSounds} sons indexés / ${out.currentBank.exactRelations} relations exactes**.`,`- Restant sans couverture éditoriale sérieuse (les anciens prototypes sérieux comptent comme couverts) : **${out.remainingNotSeriouslyCovered.total}**.`,`- Dont IPA totalement net-new après V1–V5 : **${out.remainingNetNew.total}**.`,'', '### Distributions — reste non couvert sérieusement','',`- 1 syllabe : **${out.remainingNotSeriouslyCovered.oneSyllable}** (${pct(out.remainingNotSeriouslyCovered.oneSyllable,out.remainingNotSeriouslyCovered.total)}).`,`- 2 syllabes : **${out.remainingNotSeriouslyCovered.twoSyllable}** (${pct(out.remainingNotSeriouslyCovered.twoSyllable,out.remainingNotSeriouslyCovered.total)}).`,`- ≤5 unités IPA : **${out.remainingNotSeriouslyCovered.atMost5Units}** (${pct(out.remainingNotSeriouslyCovered.atMost5Units,out.remainingNotSeriouslyCovered.total)}).`,`- ≥2 formes lexicales exactes : **${out.remainingNotSeriouslyCovered.homophonesAtLeast2}**.`,`- ≥3 : **${out.remainingNotSeriouslyCovered.homophonesAtLeast3}**.`,`- ≥4 : **${out.remainingNotSeriouslyCovered.homophonesAtLeast4}**.`,'', '### Distributions — sous-réservoir net-new','',`- 1 syllabe : **${out.remainingNetNew.oneSyllable}**.`,`- 2 syllabes : **${out.remainingNetNew.twoSyllable}**.`,`- ≤5 unités IPA : **${out.remainingNetNew.atMost5Units}**.`,`- ≥2 formes lexicales exactes : **${out.remainingNetNew.homophonesAtLeast2}**.`,`- ≥3 : **${out.remainingNetNew.homophonesAtLeast3}**.`,`- ≥4 : **${out.remainingNetNew.homophonesAtLeast4}**.`,'', '## Potentiel éditorial A / B / C / D','',`- **A — fort potentiel visuel/frequent/réutilisable : ${gradeCounts.A}**.`,`- **B — plausible, mais contrôle de nomination nécessaire : ${gradeCounts.B}**.`,`- **C — possible mais ambigu, rare ou contextuel : ${gradeCounts.C}**.`,`- **D — faible potentiel visuel actuel : ${gradeCounts.D}**.`,'',`Faux négatifs concrets explicitement identifiés dans les mots que V4/V5 n’avaient pas classés : **${falseNegatives.length}**.`,'', '## 100 meilleurs candidats restants','', '| # | IPA | grade | syll. | unités | meilleur mot | fréquence | autres mots utiles |','|---:|---|:---:|---:|---:|---|---:|---|'];
top100.forEach((c,i)=>lines.push(`| ${i+1} | /${c.ipa}/ | ${c.grade} | ${c.syllableSpan??'—'} | ${c.unitCount} | ${c.bestWord} | ${c.bestWordFrequency.toFixed(3)} | ${c.words.filter(w=>w.word!==c.bestWord&&['A','B','C'].includes(w.grade)).slice(0,4).map(w=>`${w.word} (${w.grade})`).join(', ')||'—'} |`));
lines.push('','## 30 meilleurs monosyllabes','', '| # | IPA | grade | mot | fréquence | raison |','|---:|---|:---:|---|---:|---|');topMono.forEach((c,i)=>lines.push(`| ${i+1} | /${c.ipa}/ | ${c.grade} | ${c.bestWord} | ${c.bestWordFrequency.toFixed(3)} | ${c.bestReason} |`));
lines.push('','## 30 meilleurs bisyllabes','', '| # | IPA | grade | mot | fréquence | raison |','|---:|---|:---:|---|---:|---|');topBi.forEach((c,i)=>lines.push(`| ${i+1} | /${c.ipa}/ | ${c.grade} | ${c.bestWord} | ${c.bestWordFrequency.toFixed(3)} | ${c.bestReason} |`));
lines.push('','## Faux négatifs les plus importants du filtre V4/V5','', '| IPA | mot | grade | fréquence | catégorie audit |','|---|---|:---:|---:|---|');falseNegatives.slice(0,60).forEach(x=>lines.push(`| /${x.ipa}/ | ${x.word} | ${x.grade} | ${x.frequency.toFixed(3)} | ${x.category} |`));
lines.push('','## Meilleurs cas à plusieurs représentations possibles','', '| IPA | mots visuellement distincts plausibles |','|---|---|');multiEditorial.slice(0,25).forEach(c=>lines.push(`| /${c.ipa}/ | ${c.plausibleWords.map(w=>`${w.word} (${w.grade}, ${w.category})`).join(' · ')} |`));
lines.push('','## Recommandation pour une éventuelle Vague 6','', '- **Ne pas repartir sur une grosse cohorte aveugle.**', '- Étendre d’abord le lexique sémantique/imageabilité à partir des faux négatifs A/B de cet audit.', '- Constituer ensuite une cohorte **mot-first** de **60 à 100 sons maximum** : 35–50 A, 15–30 B, et une voie dédiée aux IPA ayant plusieurs homophones concrets réellement distincts.', '- Garder fréquence du mot, brièveté/réutilisabilité IPA et fréquence du son comme critères secondaires après le filtre de concrétude.', '- Les benchmarks de phrases restent des thermomètres après sélection, jamais le moteur.', '- **Stop rule** : si moins de 40 A/B survivent la revue éditoriale, ou si le taux d’acceptation tombe sous ~50 %, revenir à la découverte sémantique plutôt que consommer C/D.','', '> Cet audit ne crée aucune représentation, aucun brief, aucune image et aucune activation runtime.');
fs.writeFileSync('docs/REBUS_REMAINING_RESERVOIR_AUDIT.md',lines.join('\n')+'\n');
console.log(JSON.stringify({remaining:out.remainingNotSeriouslyCovered,netNew:out.remainingNetNew,grades:gradeCounts,falseNegatives:falseNegatives.slice(0,40),top100:top100.slice(0,30).map(x=>({ipa:x.ipa,grade:x.grade,word:x.bestWord,f:x.bestWordFrequency,span:x.syllableSpan})),multi:multiEditorial.slice(0,20).map(x=>({ipa:x.ipa,words:x.plausibleWords.map(w=>w.word)}))},null,2));
