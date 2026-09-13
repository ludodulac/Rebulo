import fs from 'node:fs';
import { normalizeIPA, splitIPAUnits } from '../src/phonetic-engine.js';
import { buildProductiveBank } from '../src/rebus-productive-bank.js';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const audit = read('data/rebus-representation-bank-audit.json');
const fragmentIdeas = read('data/rebus-fragment-representation-ideas.json');
const waves = [1,2,3,4,5].map(n => read(`data/rebus-productive-bank-wave${n}.json`));
const bank = buildProductiveBank({ fragmentIdeas, productiveWaves: waves });

const seriousSound = s => s.visibleConventions.length > 0 || s.representations.some(r =>
  ['retain','prototype_candidate'].includes(r.editorialStatus) && (r.visualBrief || r.representationProposed)
);
const seriousBank = new Set([...bank.values()].filter(seriousSound).map(s => normalizeIPA(s.ipa)));
const indexed = new Set([...bank.keys()].map(normalizeIPA));

const prototypeIpas = new Set();
for (const file of fs.readdirSync('data').filter(f => /^rebus-sound-visual-curation(?:-wave\d+)?\.json$/.test(f))) {
  const data = read(`data/${file}`);
  for (const e of data.entries || []) {
    if (e.decision === 'prototype_candidate' && e.ipa) prototypeIpas.add(normalizeIPA(e.ipa));
  }
}
const seriousCovered = new Set([...seriousBank, ...prototypeIpas]);

const categoryWords = new Set(`chien chat cheval vache veau cochon porc mouton chèvre bouc lapin souris rat lion tigre ours loup renard singe poule coq canard oie pigeon aigle hibou chouette poisson thon requin baleine dauphin mouche abeille fourmi araignée escargot ver puce pou tique grenouille serpent lézard tortue cerf biche âne girafe éléphant zèbre pain lait beurre fromage soupe riz pâte pâtes gâteau tarte pomme poire banane orange citron fraise cerise raisin carotte tomate salade sel sucre miel œuf viande jambon vin jus café thé chocolat blé farine noix noisette amande olive huile ail oignon patate croissant biscuit bonbon glace crème yaourt tête main pied bras jambe nez bouche dent dos cou œil yeux oreille doigt cœur ventre peau langue cheveux crâne genou épaule joue menton barbe moustache front gorge poing coude talon ongle auto voiture vélo bus car train camion bateau avion moto taxi tracteur métro tram trottinette ambulance camionnette wagon marteau scie clé pelle pioche houe pince vis clou corde chaîne couteau fourche cuillère verre tasse bol assiette boîte sac panier bouteille parapluie lampe montre livre carte balle ballon chaise table lit porte fenêtre maison banc barre barreau bouchon brosse balai seau savon peigne miroir crayon stylo gomme règle dé ciseaux clef roue pneu moteur valise coffre cloche sonnette téléphone écran photo cadre pot vase bougie four fourchette poêle casserole cadenas serrure pinceau cahier enveloppe lettre horloge réveil radio télévision ordinateur clavier souris échelle éponge robinet tapis coussin couverture oreiller arbre fleur feuille herbe bois forêt mer lac rivière pluie neige vent soleil lune étoile ciel nuage pierre roche sable boue cendre feu champ pré montagne île vague eau source cascade mare étang branche racine tronc graine volcan désert colline prairie école gare port parc jardin plage route rue cour camp bar hall halle magasin classe cuisine chambre salon cave pont puits ferme usine église mairie stade piscine zoo musée hôtel boulangerie pharmacie hôpital garage banque poste marché bibliothèque bébé enfant garçon fille homme femme père mère roi reine acteur garde nain mec voisin médecin facteur maître maîtresse pompier policier soldat pirate clown cuisinier boulanger fermier docteur infirmier infirmière professeur pilote marin chapeau bonnet casque veste manteau robe jupe pantalon short chemise pull chaussure chaussures botte bottes chaussette ceinture gant gants écharpe cravate maillot pyjama lunettes tablier rond cercle carré cube boule ligne trait point croix triangle flèche pli ovale spirale rire dormir courir sauter tomber danser nager boire manger couper scier jouer sortir entrer ouvrir fermer pousser tirer laver lire écrire dessiner marcher voler conduire pédaler creuser planter arroser tousser crier souffler porter jeter peindre grimper`.split(/\s+/).map(x=>x.toLocaleLowerCase('fr')));

const exactUseful = (audit.usefulRows || []).filter(r => r?.categories?.A_exactFrenchWord && (r.exactWords || []).length);
const remaining = exactUseful.filter(r => !seriousCovered.has(normalizeIPA(r.ipa)));
const netNew = remaining.filter(r => !indexed.has(normalizeIPA(r.ipa)));

const span = r => {
  const xs = (r.syllableSpans || []).map(Number).filter(Number.isFinite);
  return xs.length ? Math.min(...xs) : null;
};
const unitCount = r => splitIPAUnits(normalizeIPA(r.ipa)).length;
const distinctWords = r => [...new Map((r.exactWords || []).filter(x=>x?.word).map(x => [String(x.word).trim().toLocaleLowerCase('fr'), x])).values()];
const countWhere = (arr, fn) => arr.filter(fn).length;
const distribution = arr => ({
  total: arr.length,
  oneSyllable: countWhere(arr, r => span(r) === 1),
  twoSyllable: countWhere(arr, r => span(r) === 2),
  oneOrTwoSyllable: countWhere(arr, r => [1,2].includes(span(r))),
  atMost5Units: countWhere(arr, r => unitCount(r) <= 5),
  homophonesAtLeast2: countWhere(arr, r => distinctWords(r).length >= 2),
  homophonesAtLeast3: countWhere(arr, r => distinctWords(r).length >= 3),
  homophonesAtLeast4: countWhere(arr, r => distinctWords(r).length >= 4),
});

const unclassifiedNouns = [];
for (const r of netNew) {
  const ipa = normalizeIPA(r.ipa);
  for (const x of distinctWords(r)) {
    const word = String(x.word).trim();
    const lower = word.toLocaleLowerCase('fr');
    const pos = String(x.pos || '').toUpperCase();
    const frequency = Number(x.frequency) || 0;
    if (!pos.startsWith('NOM') || categoryWords.has(lower)) continue;
    unclassifiedNouns.push({ ipa, word, frequency, pos: x.pos || null, syllableSpan: span(r), unitCount: unitCount(r), exactWordCount: distinctWords(r).length, usefulTargetCount: Number(r.usefulTargetCount)||0, usefulWeightedGain: Number(r.usefulWeightedGain)||0 });
  }
}
unclassifiedNouns.sort((a,b)=>b.frequency-a.frequency || b.usefulWeightedGain-a.usefulWeightedGain || a.word.localeCompare(b.word,'fr'));

const topMultiple = netNew.map(r => ({
  ipa: normalizeIPA(r.ipa), syllableSpan: span(r), unitCount: unitCount(r), usefulTargetCount: Number(r.usefulTargetCount)||0,
  usefulWeightedGain: Number(r.usefulWeightedGain)||0,
  words: distinctWords(r).map(x=>({word:x.word, pos:x.pos||null, frequency:Number(x.frequency)||0})).sort((a,b)=>b.frequency-a.frequency)
})).filter(r=>r.words.length>=2).sort((a,b)=>b.words.length-a.words.length || b.usefulWeightedGain-a.usefulWeightedGain || b.words[0].frequency-a.words[0].frequency);

const output = {
  version:'remaining-reservoir-audit-diagnostic-1',
  sourceMainHead:'4015af269d1698d11c6ae8441f426f148799aee9',
  denominatorUsefulExact: exactUseful.length,
  currentBank:{indexedSounds:bank.size, exactRelations:[...bank.values()].reduce((n,s)=>n+s.exactWords.length,0), seriousBankSounds:seriousBank.size, prototypeIpas:prototypeIpas.size, seriousCoveredUnion:seriousCovered.size},
  remainingNotSeriouslyCovered: distribution(remaining),
  remainingNetNew: distribution(netNew),
  topUnclassifiedFrequentNouns: unclassifiedNouns.slice(0,500),
  topMultipleHomophoneNetNew: topMultiple.slice(0,300)
};
fs.writeFileSync('data/rebus-remaining-reservoir-audit-diagnostic.json', JSON.stringify(output,null,2)+'\n');

const lines = [
  '# Rebulo — diagnostic du réservoir restant après Vague 5','',
  `- HEAD source : ${output.sourceMainHead}.`,
  `- Sons utiles avec mot exact : ${exactUseful.length}.`,
  `- Banque indexée : ${output.currentBank.indexedSounds} sons / ${output.currentBank.exactRelations} relations exactes.`,
  `- Sons restant sans couverture éditoriale sérieuse (incluant prototypes anciens comme déjà couverts) : ${remaining.length}.`,
  `- Dont IPA totalement net-new après V1–V5 : ${netNew.length}.`,'',
  '## Distribution — non couverts sérieusement','',
  `- 1 syllabe : ${output.remainingNotSeriouslyCovered.oneSyllable}.`,
  `- 2 syllabes : ${output.remainingNotSeriouslyCovered.twoSyllable}.`,
  `- ≤5 unités IPA : ${output.remainingNotSeriouslyCovered.atMost5Units}.`,
  `- ≥2 homophones exacts : ${output.remainingNotSeriouslyCovered.homophonesAtLeast2}.`,
  `- ≥3 : ${output.remainingNotSeriouslyCovered.homophonesAtLeast3}.`,
  `- ≥4 : ${output.remainingNotSeriouslyCovered.homophonesAtLeast4}.`,'',
  '## Faux négatifs potentiels — noms fréquents non classés par le lexique V4/V5','',
  '| Rang | IPA | mot | fréquence | syll. | unités | homophones |','|---:|---|---|---:|---:|---:|---:|'
];
unclassifiedNouns.slice(0,150).forEach((x,i)=>lines.push(`| ${i+1} | /${x.ipa}/ | ${x.word} | ${x.frequency.toFixed(3)} | ${x.syllableSpan??'—'} | ${x.unitCount} | ${x.exactWordCount} |`));
lines.push('','## IPA net-new à homophones multiples','', '| IPA | syll. | unités | mots exacts |','|---|---:|---:|---|');
topMultiple.slice(0,100).forEach(x=>lines.push(`| /${x.ipa}/ | ${x.syllableSpan??'—'} | ${x.unitCount} | ${x.words.slice(0,8).map(w=>`${w.word} (${w.frequency.toFixed(3)})`).join(', ')} |`));
fs.writeFileSync('docs/REBUS_REMAINING_RESERVOIR_DIAGNOSTIC.md', lines.join('\n')+'\n');
console.log(JSON.stringify({remaining:output.remainingNotSeriouslyCovered,netNew:output.remainingNetNew,topUnclassified:unclassifiedNouns.slice(0,80),topMultiple:topMultiple.slice(0,40)},null,2));
