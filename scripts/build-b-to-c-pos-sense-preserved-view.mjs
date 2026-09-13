import fs from 'node:fs';

const fold=(s='')=>String(s).trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'");
const exactNorm=(s='')=>String(s).trim().toLocaleLowerCase('fr').normalize('NFC').replace(/[’]/g,"'");
const posFamily=(s='')=>String(s||'').trim().toUpperCase().split(':')[0];
const familiar=f=>{f=Number(f)||0;return f>=100?4:f>=20?3:f>=2?2:f>0?1:0;};
const clamp=v=>Math.max(0,Math.min(4,Math.round(v)));
const WEIGHTS={concreteness:10,drawability:13,expectedNameability:25,alternativeNameResistance:10,visualAmbiguityResistance:10,visualSimplicity:8,lexicalFamiliarity:10,phoneticReuse:7,compactness:4,multiRepresentationValue:3};
const FUNCTION_POS=new Set(['ADJ','ADV','ART','CON','DET','PRE','PRO','ONO']);
const ABSTRACT_SUFFIX=/(?:tion|sion|isme|itude|ité|isme|ance|ence|esse|ement|ment)$/i;
const ROLE_SUFFIX=/(?:iste|eur|euse|ier|ière|ien|ienne)$/i;
const knownCategory=new Map();const add=(cat,words)=>words.split(' ').forEach(w=>knownCategory.set(fold(w),cat));
add('animal','chien chat cheval loup coq renne oie pie vache veau mouton chèvre porc cochon lapin souris rat lion tigre ours singe poisson requin baleine dauphin poule canard aigle hibou chouette pigeon abeille fourmi mouche araignée serpent grenouille escargot');
add('aliment','pomme poire banane orange citron raisin fraise cerise noix noisette pois riz pain lait café thé soupe fromage oeuf œuf gâteau sucre sel miel radis chou tomate carotte salade viande poisson');
add('corps','oeil œil nez pied main doigt bras jambe tête tete face visage front cerveau coeur cœur os dent bouche langue oreille dos ventre peau sang');
add('nature','soleil lune étoile etoile ciel mer océan ocean rivière riviere lac montagne vallée vallee forêt foret arbre fleur feuille sable pierre roche pluie neige nuage vent feu eau planète planete');
add('lieu','route rue chemin ville village prison bureau école ecole gare port pont maison chambre cuisine jardin parc plage île ile camp champ vallée vallee entrée entree marché marche');
add('véhicule','train voiture vélo velo bus camion bateau navire avion fusée fusee vaisseau moto tracteur tram métro metro');
add('outil','scie vis pelle marteau tournevis clé cle pince hache couteau fourche aiguille clou perceuse');
add('vêtement','manteau robe chaussure gant chapeau pantalon chemise jupe pull chaussette botte ceinture');
add('objet','porte livre lit nid table bâton baton tasse verre pot seau sac balle ballon papier dossier anneau toit mur phare puits four croix pelle lyre lance tronc grain char leurre haie photo téléphone telephone chaise lampe clé cle boîte boite panier corde brosse savon montre horloge bouteille assiette cuillère cuillere fourchette');
add('personne','bébé bebe maman mère mere père pere maire roi reine marchand vendeur docteur médecin medecin pompier policier professeur enfant garçon garcon fille homme femme');
function semanticCategory(word,pos,lemma){const key=fold(lemma||word);if(knownCategory.has(key))return knownCategory.get(key);if(pos==='VER')return 'action';if(pos==='NOM'&&ABSTRACT_SUFFIX.test(key))return 'abstrait';if(pos==='NOM'&&ROLE_SUFFIX.test(key))return 'personne_rôle_candidat';if(pos==='NOM')return 'nom_concret_à_vérifier';if(FUNCTION_POS.has(pos))return 'fonction_ou_qualité';return 'autre';}
function classify(scores,category,proofStatus){let total=0;for(const [k,w] of Object.entries(WEIGHTS))total+=scores[k]*w/4;const aggregateScore=Math.round(total*10)/10;let c=aggregateScore>=80?'A':aggregateScore>=65?'B':aggregateScore>=45?'C':'D';if(scores.drawability<=1&&c<'C')c='C';if(scores.expectedNameability===0)c='D';else if(scores.expectedNameability<=1&&['A','B'].includes(c))c='C';if(c==='A'&&(scores.expectedNameability<3||scores.drawability<3||scores.visualSimplicity<3))c='B';if(category==='abstrait'&&['A','B'].includes(c))c='C';if(['visual_route_rejected','visual_route_deferred'].includes(proofStatus)&&['A','B'].includes(c))c='C';return {aggregateScore,provisionalClass:c};}

const pronunciation=JSON.parse(fs.readFileSync('data/rebus-pronunciation-lexicon.json','utf8'));
const landscape=JSON.parse(fs.readFileSync('data/rebus-representation-landscape.json','utf8'));
const sample=fs.readFileSync('data/b-to-c-industrial-sample-2000.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const review=JSON.parse(fs.readFileSync('data/b-to-c-industrial-sample-2000-rescue-editorial-review.json','utf8'));
const exactLex=new Map();for(const row of pronunciation.rows||[]){const [form,ipa,lemma,frequency,pos]=row;const key=`${exactNorm(form)}|${ipa}`;const arr=exactLex.get(key)||[];arr.push({form,ipa,lemma,frequency:Number(frequency)||0,pos:posFamily(pos)});exactLex.set(key,arr);}
const source=new Map();for(const sound of landscape.rows||[])for(const c of sound.exactCandidates||[])source.set(`${sound.ipa}|${exactNorm(c.word)}`,c);
const reviewById=new Map((review.recovered||[]).map(x=>[x.sampleId,x]));

const rows=[];const oldDist={A:0,B:0,C:0,D:0},correctedDist={A:0,B:0,C:0,D:0};let changed=0,falsePositive=0,falseNegative=0;
for(const s of sample){
  oldDist[s.provisionalClass]++;
  const entries=exactLex.get(`${exactNorm(s.exactWord)}|${s.ipa}`)||[];
  const lexicalEntries=[...new Map(entries.map(e=>[`${exactNorm(e.lemma)}|${e.pos}`,e])).values()].map(e=>({...e,sourceRowCount:entries.filter(x=>exactNorm(x.lemma)===exactNorm(e.lemma)&&x.pos===e.pos).length}));
  const primary=lexicalEntries[lexicalEntries.length-1]||{lemma:s.lemma,pos:s.pos,frequency:s.frequency};
  const csrc=source.get(`${s.ipa}|${exactNorm(s.exactWord)}`)||{};
  const pos=primary.pos||s.pos,lemma=primary.lemma||s.lemma,frequency=Number(primary.frequency??s.frequency)||0,category=semanticCategory(s.exactWord,pos,lemma);
  const concrete=knownCategory.has(fold(lemma))?4:category==='nom_concret_à_vérifier'?3:['action','personne_rôle_candidat'].includes(category)?2:category==='abstrait'?1:FUNCTION_POS.has(pos)?0:1;
  let draw=concrete>=3?3:category==='action'?2:category==='personne_rôle_candidat'?2:1;
  let naming=concrete>=3?(familiar(frequency)>=3?3:familiar(frequency)>=1?2:1):category==='action'?(familiar(frequency)>=3?2:1):1;
  let alt=concrete>=3?3:2,amb=concrete>=3?3:2,simple=concrete>=3?3:category==='action'?2:1;
  if(s.exactHomophoneCount>=4){alt=Math.max(1,alt-1);amb=Math.max(1,amb-1);}if((s.anticipatedAlternativeNames||[]).length){alt=Math.max(1,alt-1);amb=Math.max(1,amb-1);naming=Math.max(1,naming-1);}
  const proofStatus=csrc.proofStatus||'lexical_exact_only';const visual=csrc.visualPotential||'unknown';const risk=csrc.namingRisk||'unknown';
  if(proofStatus==='visual_hypothesis_curated'){draw=Math.max(draw,3);naming=Math.max(naming,risk==='low'?4:3);simple=Math.max(simple,3);}if(visual==='high'){draw=4;simple=Math.max(simple,3);}else if(visual==='medium_high')draw=Math.max(draw,3);else if(['low','very_low'].includes(visual))draw=1;if(['high','very_high','medium_high'].includes(risk))naming=Math.min(naming,1);else if(risk==='medium')naming=Math.min(naming,2);if(proofStatus==='visual_route_rejected'){draw=Math.min(draw,1);naming=Math.min(naming,1);}if(proofStatus==='visual_route_deferred'){draw=Math.min(draw,2);naming=Math.min(naming,2);}
  const scores={concreteness:clamp(concrete),drawability:clamp(draw),expectedNameability:clamp(naming),alternativeNameResistance:clamp(alt),visualAmbiguityResistance:clamp(amb),visualSimplicity:clamp(simple),lexicalFamiliarity:familiar(frequency),phoneticReuse:s.scores.phoneticReuse,compactness:s.scores.compactness,multiRepresentationValue:s.scores.multiRepresentationValue};
  const corrected=classify(scores,category,proofStatus);correctedDist[corrected.provisionalClass]++;
  if(corrected.provisionalClass!==s.provisionalClass){changed++;if(['A','B'].includes(s.provisionalClass)&&['C','D'].includes(corrected.provisionalClass))falsePositive++;if(['C','D'].includes(s.provisionalClass)&&['A','B'].includes(corrected.provisionalClass))falseNegative++;}
  const reviewed=reviewById.get(s.sampleId)||null;
  const relation=reviewed?.falseNegativeCause?.startsWith('POS/sense collapse')?'additional_visual_sense':reviewed?'same_visual_sense_reviewed':null;
  const conceptUnits=[{senseId:s.senseId,conceptLabel:s.conceptLabel,conceptCategory:s.conceptCategory,conceptDescription:s.conceptDescription,source:'baseline_proxy',scores:s.scores,aggregateScore:s.aggregateScore,provisionalClass:s.provisionalClass,humanNamingEvidence:'none'}];
  if(reviewed&&relation==='additional_visual_sense')conceptUnits.push({senseId:reviewed.senseId,conceptLabel:reviewed.conceptLabel,conceptCategory:reviewed.conceptCategory,conceptDescription:reviewed.conceptDescription,source:'editorial_sense_review',scores:reviewed.scores,aggregateScore:reviewed.aggregateScore,provisionalClass:reviewed.provisionalClass,humanNamingEvidence:'none'});
  if(reviewed&&relation==='same_visual_sense_reviewed')conceptUnits[0].editorialReassessment={senseId:reviewed.senseId,scores:reviewed.scores,aggregateScore:reviewed.aggregateScore,provisionalClass:reviewed.provisionalClass,source:'editorial_sense_review',humanNamingEvidence:'none'};
  rows.push({sampleId:s.sampleId,ipa:s.ipa,exactWord:s.exactWord,lexicalIdentityKey:`${exactNorm(s.exactWord)}|${s.ipa}`,lexicalEntries,lexicalEntryCount:lexicalEntries.length,lexicalAmbiguity:lexicalEntries.length>1?'multiple_exact_entries':'single_exact_entry',samePosPolysemyStatus:'not_observable_from_lexique_without_sense_inventory',baselineInterpretation:{lemma:s.lemma,pos:s.pos,provisionalClass:s.provisionalClass},exactOrthographyInterpretation:{lemma,pos,frequency,conceptCategory:category,scores,aggregateScore:corrected.aggregateScore,provisionalClass:corrected.provisionalClass},conceptUnits,humanNamingEvidence:'none'});
}
const editorialConceptDist={...correctedDist};let additionalConcepts=0,editorialReclassified=0;for(const r of rows){for(const u of r.conceptUnits.slice(1)){editorialConceptDist[u.provisionalClass]++;additionalConcepts++;}const reass=r.conceptUnits[0].editorialReassessment;if(reass&&reass.provisionalClass!==r.exactOrthographyInterpretation.provisionalClass){editorialConceptDist[r.exactOrthographyInterpretation.provisionalClass]--;editorialConceptDist[reass.provisionalClass]++;editorialReclassified++;}}
const impact={schemaVersion:'1.0',status:'analysis_only',relations:rows.length,baselineDistribution:oldDist,exactOrthographyDistribution:correctedDist,relationsChangingClassAfterExactOrthographyFix:changed,potentialFalsePositivesCorrected:falsePositive,potentialFalseNegativesCorrectedByExactOrthography:falseNegative,additionalVisualConceptsFromEditorialSenseReview:additionalConcepts,sameConceptEditorialReclassifications:editorialReclassified,editorialConceptDistribution:editorialConceptDist,totalConceptUnitsAfterReviewedSenseExpansion:rows.length+additionalConcepts,notes:['No relation was reselected; the same 2,000 sample IDs are retained.','The #290 weights and guards are unchanged.','Same-POS polysemy is not inferred from Lexique rows; only explicit reviewed senses become extra concept units.','Technical duplicates are collapsed by exact lemma+POS and do not create concept units.','humanNamingEvidence remains none.']};
fs.writeFileSync('data/b-to-c-industrial-sample-2000-pos-sense-preserved.jsonl',rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
fs.writeFileSync('data/b-to-c-industrial-sample-2000-pos-sense-impact.json',JSON.stringify(impact,null,2)+'\n');
console.log(JSON.stringify(impact,null,2));
