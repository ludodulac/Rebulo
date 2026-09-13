# Rebulo — deuxième tranche contrôlée B → C

## Statut

- Main réel de départ : `95d1fbc62148767c3fe5a71cb9084e8990e565dd`.
- Analyse uniquement. B est inchangé.
- Aucun asset, image, SVG, runtime, UI, CSS, planner, Phrase ou Vague 6.
- Formule, poids et garde-fous #290 inchangés.
- `humanNamingEvidence = none` partout.

## Échantillon indépendant

La tranche contient exactement **2 000 relations B**, toutes nouvelles par rapport aux 2 000 relations de #291 : **2 000 nouvelles, 0 chevauchement**. La sélection est déterministe (`rebulo-b2c-sample2-2026-09-13`) et utilise dès l'origine l'identité **graphie exacte NFC + IPA**.

`lexicalEntries[]` conserve les entrées exactes et replie seulement les doublons techniques de même lemme exact + POS. La catégorisation sémantique explicite conserve elle aussi les diacritiques ; une fuite initiale de normalisation (`mûr` pouvant hériter de `mur`) a été détectée avant gel de la tranche, corrigée puis la tranche a été régénérée.

## Stratification

| Strate | N | A | B | C | D | A+B | Rendement A+B |
|---|---:|---:|---:|---:|---:|---:|---:|
| concrete_priority | 460 | 0 | 78 | 382 | 0 | 78 | 17,0 % |
| low_frequency_concrete | 320 | 0 | 0 | 320 | 0 | 0 | 0,0 % |
| low_score_rescue | 360 | 0 | 0 | 9 | 351 | 0 | 0,0 % |
| pos_sense_risk | 260 | 0 | 0 | 79 | 181 | 0 | 0,0 % |
| multi_concept_ipa | 260 | 0 | 0 | 196 | 64 | 0 | 0,0 % |
| negative_control | 220 | 0 | 0 | 32 | 188 | 0 | 0,0 % |
| two_syllable_control | 120 | 0 | 0 | 72 | 48 | 0 | 0,0 % |

Cette tranche est volontairement beaucoup plus difficile que #291 : **1 340 / 2 000** relations sont placées dans les strates rescue, POS/sens, multi-concept, négative ou faible fréquence. Le rendement global ne doit donc pas être lu comme un échantillon aléatoire de B.

## Baseline automatique

- Relations sélectionnées / examinées : **2 000 / 2 000**.
- Relations nouvelles : **2 000**.
- IPA distinctes : **1 641**.
- A / B / C / D : **0 / 78 / 1 090 / 832**.
- A+B : **78 (3,9 %)**.
- A+B monosyllabes : **77**.
- A+B bisyllabes : **1**.
- A+B IPA courte : **73**.
- Unités conceptuelles baseline : **2 000**.
- Proxy lexical de sons avec richesse multi-concept sérieuse : **2** ; après audit éditorial des seuls positifs et rescue, **0 son** n'a encore ≥2 concepts visuels sérieux confirmés dans cette tranche. Ce résultat ne signifie pas absence de polysémie dans B : la strate ne dispose pas d'un inventaire de sens complet.

Principales causes C/D automatiques : `aggregate_weakness` **1 060**, `low_expected_nameability` **860**, `low_drawability` **352**, `abstract_concept` **16**, `alternative_names` **9**.

## Low-score rescue

Les **360** relations de `low_score_rescue` ont une baseline séparée : **0 A/B automatique**. La revue conceptuelle ciblée récupère **4 B = 1,1 %** :

| Mot exact | Sens visuel récupéré | Cause du faux négatif |
|---|---|---|
| mûres | fruits mûres | sens concret nominal absent de `lexicalEntries[]` |
| afro | coiffure afro | POS disponible adjectival + sens nominal concret absent |
| mineur | travailleur de mine | POS disponible adjectival + nom de métier absent |
| louche | ustensile | POS disponible adjectival + nom d'ustensile absent |

Ces quatre unités sont éditoriales, pas des validations humaines. La baseline n'est pas réécrite. Les cas `jumelle`, `lotion`, `automne`, `ânesse`, `menotte` et `marron` ont notamment été conservés C : ils sont dessinables ou concrets, mais la dénomination cible reste trop concurrencée.

Les causes de faux négatifs récupérés sont donc : **3 mauvais POS + sens concret absent**, **1 sens concret absent**. Aucune récupération n'est due à une modification de formule ni à `phoneticReuse`.

## Audit des faux positifs A/B

Les **78 B automatiques** ont tous été audités ; il n'y a aucun A automatique. **32 / 78 = 41,0 %** sont des faux positifs éditoriaux dans la méthode automatique actuelle. Exemples : `job`, `soin`, `calme`, `offre`, `force`, `honte`, `crime`, `nombre`, `code`, `style`, `rôle`, `ouest`, `gloire`, `m`, `j`, `titre`, `genre`, `doute`, `preuve`, `blague`.

Le défaut dominant est la catégorie de secours **`nom_concret_à_vérifier`**, qui confond « NOM lexical » avec « concept visuel autonome ». Les familles observées sont : notions abstraites/contextuelles, dépendance au texte/symbole, ambiguïté de sens ou de représentation, rôles/collectifs génériques et événements/scènes difficiles à nommer.

Après audit complet des positifs et ajout des quatre rescue, le **minimum éditorialement soutenu** est **50 concepts sérieux sur 2 000 (2,5 %)**. Ce chiffre n'est pas une reclassification exhaustive : les autres C/D hors rescue n'ont pas subi une revue conceptuelle complète.

## POS / sens

Dans cette tranche exacte :

- relations avec plusieurs `lexicalEntries[]` exactes : **0** ;
- relations avec plusieurs POS exacts : **0** ;
- relations sans entrée lexicale : **0**.

Le risque mesuré est donc moins un écrasement interne qu'un **inventaire de sens incomplet** : `mûres`, `afro`, `mineur`, `louche` ont une entrée lexicale mais le sens nominal concret pertinent manque dans le miroir. La structure C doit continuer à séparer : données lexicales observées / sens visuel éditorial documenté.

## Comparaison #291 / tranche 2

| Mesure | #291 | Tranche 2 | Comparabilité |
|---|---:|---:|---|
| Relations | 2 000 | 2 000 | oui pour taille, non pour composition |
| IPA distinctes | 1 567 | 1 641 | oui descriptif |
| A+B automatique | 682 (34,1 %) | 78 (3,9 %) | **non directement** : tranche 2 exclut #291 et sur-échantillonne les zones faibles |
| concrete_priority | 380/480 (79,2 %) | 78/460 (17,0 %) | partiellement : tranche 2 prend le réservoir résiduel après #291 |
| low_frequency_concrete | 24/180 (13,3 %) | 0/320 (0 %) | partiellement : seuils/quota renforcés et tranche résiduelle |
| low-score rescue automatique | 0/260 | 0/360 | oui : même phénomène |
| rescue après revue | 4/260 (1,5 %) | 4/360 (1,1 %) | bonne comparaison directionnelle |
| faux positifs détectés | 2 lors de l'audit orthographique ciblé | 32/78 lors d'un audit **exhaustif** des A/B | non comparable en taux |
| richesse multi-concept | proxy 144 sons | proxy 2, confirmé 0 après audits limités | non comparable : méthode et composition différentes |

### Lecture

La méthode reste productive, mais **le premier réservoir facile s'épuise vite**. Le `concrete_priority` de #291 avait capté les meilleurs candidats disponibles ; la seconde tranche, explicitement nouvelle, rencontre davantage de noms génériques, sens ambigus et faibles fréquences. Le signal rescue reste stable autour de **1–1,5 %** : faible en rendement mais suffisamment réel pour interdire la suppression aveugle de toute la queue faible-score.

Le coût éditorial de la tranche 2 est élevé : 438 décisions ciblées ont été faites (360 rescue + 78 positifs), et **1 090 C** restent des cas où une vraie résolution MOT→SENS peut encore être nécessaire. Le calcul de scores n'est pas le coût dominant ; la désambiguïsation sémantique et la nommabilité le sont.

## Passage à l'échelle : trois voies

Les volumes ci-dessous sont des **fourchettes de charge de planification sur les 135 140 relations B**, pas des estimations du nombre final de représentations C. Les deux tranches sont stratifiées et ne permettent pas une extrapolation populationnelle propre.

### VOIE VERTE — prétraitement massif prudent

Critères proposés : NOM exact, catégorie concrète **explicite** (pas seulement `nom_concret_à_vérifier`), graphie+IPA exacte, pas de risque POS/sens détecté, fréquence/familiarité suffisante, simplicité/nameability proxy ≥3, aucun garde-fou.

- Volume de travail plausible : **10–20 % de B**, soit environ **13 500–27 000 relations** à prétraiter automatiquement.
- Rendement observé disponible : `concrete_priority` va de **79,2 %** dans #291 à **17,0 %** dans le réservoir résiduel de tranche 2 ; le pool n'est donc pas homogène. Les 78 B automatiques de tranche 2 n'ont qu'une précision éditoriale de **59 %** après audit, ce qui interdit d'utiliser le fallback nominal générique en voie verte.
- Risque : moyen si la sémantique reste heuristique, faible à moyen si l'on exige une catégorie concrète explicite.
- Travail humain : **spot-audit 5–10 %**, plus audit systématique de toute nouvelle règle sémantique.

### VOIE ORANGE — résolution éditoriale / sémantique

Critères : noms `nom_concret_à_vérifier`, faible fréquence concrète, POS/sens à risque, C proches du seuil, homophones multi-concepts, catégories possiblement concrètes mais non documentées.

- Volume de travail plausible : **50–60 % de B**, soit environ **67 500–81 000 relations**.
- Rendement observé : très variable ; #291 trouvait encore 13,3 % A+B automatiques dans `low_frequency_concrete`, tranche 2 0 % automatique, tandis que des sens usuels sérieux sont récupérés par revue.
- Risque : élevé sans résolution de sens.
- Travail humain : aujourd'hui proche de **1 décision par unité ambiguë** ; l'objectif industriel doit être de réduire ce coût via un inventaire de sens/catégories vérifiable, puis ne soumettre à l'humain que les désaccords et seuils.

### VOIE ROUGE / SAUVETAGE — queue faible

Critères : pré-score faible, fonctions/adjectifs/actions, très faible fréquence, ambiguïté élevée, négatifs probables.

- Volume de travail plausible : **20–35 % de B**, soit environ **27 000–47 000 relations**.
- Rendement rescue observé après revue : **1,5 %** dans #291 et **1,1 %** dans tranche 2.
- Risque : faible rendement mais faux négatifs réels, surtout quand un sens nominal usuel manque au miroir.
- Travail humain : **ne pas tout curer** ; auditer un échantillon déterministe récurrent de **10–20 %** de la voie rouge, avec sur-échantillonnage des graphies/POS connus pour produire des nominalisations ou sens concrets absents.

Ces fourchettes ne sont pas additives avec précision et ne doivent pas être utilisées comme comptage final de C ; elles servent à dimensionner une architecture de traitement.

## Recommandation précise

**Ne pas lancer les 135 140 relations.** La prochaine étape doit être une phase d'industrialisation de la **résolution MOT→SENS**, pas une troisième curation artisanale de 2 000 lignes :

1. construire un `senseCandidates[]` séparé de `lexicalEntries[]`, traçable par source, avec statut `observed / editorial_added / inferred_candidate` ;
2. interdire à `inferred_candidate` de créer seul une unité C sans règle/signal explicite ;
3. remplacer le fallback `nom_concret_à_vérifier` comme voie verte par des catégories concrètes sourcées ou règles lexicales testées ;
4. lancer ensuite un **lot de prétraitement plus large mais borné** (par exemple 10 000–15 000 relations) réparti en vert/orange/rouge, avec audits déterministes de précision et de faux négatifs ;
5. conserver la formule #290 inchangée tant que les erreurs mesurées proviennent principalement du sens/catégorisation et non des poids.

La conclusion des deux tranches est nette : la prochaine amélioration de rendement vient de la **qualité de l'unité conceptuelle**, pas d'un assouplissement du score.
