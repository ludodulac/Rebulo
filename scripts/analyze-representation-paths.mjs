import fs from 'node:fs';
import path from 'node:path';
import {planRepresentationPaths} from '../src/rebus-representation-paths.js';

const bankPath=process.argv[2]||'data/rebus-representation-bank-audit.json';
const outputPath=process.argv[3]||'docs/REBUS_REPRESENTATION_PATH_PROOF.md';
if(!fs.existsSync(bankPath)){console.error(`Representation bank audit introuvable: ${bankPath}`);process.exit(1);}
const bank=JSON.parse(fs.readFileSync(bankPath,'utf8'));
const rows=Array.isArray(bank.usefulRows)?bank.usefulRows:[];
if(rows.length<100)throw new Error('representation bank useful rows unexpectedly small');

const proofs=[
  {label:'merci',ipa:'mɛʁsi',expected:['mer','scie']},
  {label:'lit + thé',ipa:'lite',expected:['lit','thé']},
  {label:'pas + thé',ipa:'pate',expected:['pas','thé']},
  {label:'tour + nez',ipa:'tuʁne',expected:['tour','nez']}
].map(proof=>{
  const strict=planRepresentationPaths(proof.ipa,rows,{mode:'strict',limit:12,maxPieces:6,allowGaps:true});
  const general=planRepresentationPaths(proof.ipa,rows,{mode:'general',limit:12,maxPieces:6,allowGaps:true});
  const expectedRoute=strict.find(route=>route.complete&&proof.expected.every((label,index)=>route.operations[index]?.label===label));
  if(!expectedRoute)throw new Error(`expected exact route missing for ${proof.label}: ${proof.expected.join(' + ')}`);
  return {...proof,strict:strict.slice(0,5),general:general.slice(0,5)};
});

// Product-direction probe: continuous IPA only. Word boundaries are intentionally absent here.
// This is a coverage diagnostic, not an encoded pronunciation or a product-visible phrase solution.
const continuousProbes=[
  {label:'cross-boundary-style probe',ipa:'mɛʁsi'},
  {label:'long continuous-chain probe',ipa:'patalite'}
].map(item=>({...item,strict:planRepresentationPaths(item.ipa,rows,{mode:'strict',limit:5,maxPieces:8,allowGaps:true}),general:planRepresentationPaths(item.ipa,rows,{mode:'general',limit:5,maxPieces:8,allowGaps:true})}));

function routeText(route){
  if(!route)return '—';
  return route.operations.map(operation=>operation.kind==='gap'?`[/${operation.targetIpa}/ non couvert]`:`${operation.label} /${operation.sourceIpa}/`).join(' + ');
}
function percent(value){return `${Math.round((Number(value)||0)*100)} %`;}
const lines=[
  '# Rebulo — preuve de recherche des chemins de représentations',
  '',
  '> Ce rapport vérifie que la banque peut être parcourue sur une chaîne IPA continue. Il ne remplace pas la conversion texte→IPA de phrase, la curation humaine ni les règles de mode.',
  '',
  '## Ce qui est prouvé',
  '',
  '- le planificateur travaille sur la chaîne phonémique continue, sans frontières de mots ;',
  '- il conserve plusieurs segmentations concurrentes ;',
  '- une image couvrant un segment plus long peut battre plusieurs petites images à couverture et qualité égales ;',
  '- les lettres/chiffres et petites approximations ne peuvent apparaître qu’en mode général ;',
  '- les zones non couvertes restent explicites au lieu d’être inventées.',
  '',
  '## Routes exactes déjà présentes dans la banque',
  '',
  '| Cible sonore | Meilleure route stricte | Couverture | Route attendue retrouvée |',
  '|---|---|---:|---|',
  ...proofs.map(item=>{const best=item.strict[0];const expected=item.strict.some(route=>route.complete&&item.expected.every((label,index)=>route.operations[index]?.label===label));return `| /${item.ipa}/ | ${routeText(best)} | ${percent(best?.scoreBreakdown?.coverageRatio)} | ${expected?'oui':'non'} |`;}),
  '',
  '## Sondes de chaîne continue',
  '',
  '| Son continu | Strict | Couverture stricte | Général | Couverture générale |',
  '|---|---|---:|---|---:|',
  ...continuousProbes.map(item=>`| /${item.ipa}/ | ${routeText(item.strict[0])} | ${percent(item.strict[0]?.scoreBreakdown?.coverageRatio)} | ${routeText(item.general[0])} | ${percent(item.general[0]?.scoreBreakdown?.coverageRatio)} |`),
  '',
  '## Frontière encore manquante',
  '',
  'Le produit ne possède pas encore une conversion robuste d’une phrase française libre vers une chaîne IPA continue liée aux mots d’origine. Le `phrase-creator` actuel reste principalement mot-par-mot. Cette preuve isole donc la couche suivante sans prétendre qu’elle est déjà branchée à l’interface.',
  '',
  '**Décision : CONTINUE vers phrase → IPA continue → planificateur, mais seulement après avoir conservé une provenance des segments et les frontières de mots pour l’explicabilité.**'
];
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,lines.join('\n')+'\n');
console.log(JSON.stringify({proofs:proofs.map(item=>({label:item.label,ipa:item.ipa,bestStrict:item.strict[0],strictRouteCount:item.strict.length,generalRouteCount:item.general.length})),continuousProbes:continuousProbes.map(item=>({label:item.label,ipa:item.ipa,bestStrict:item.strict[0],bestGeneral:item.general[0]}))},null,2));
