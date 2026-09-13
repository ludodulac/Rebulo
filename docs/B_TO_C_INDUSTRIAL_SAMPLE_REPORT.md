# Rebulo — première tranche industrielle B → C

- Main de départ : `4d8655f3aae5e8b91f4de51afe32cbb53acd52c7`
- Statut : analyse uniquement; aucune activation runtime, aucun asset, aucune UI/planner/Phrase/Vague 6.
- B reste inchangé.
- Taille : **2 000 relations B** sélectionnées depuis la cartographie dérivée de 5 515 sons; aucune réévaluation intégrale des 135 140 relations.
- `humanNamingEvidence = none` : **2 000 / 2 000**.

## Résultats reproductibles du proxy

- Relations sélectionnées / examinées : **2 000 / 2 000**.
- Unités conceptuelles provisoires produites : **2 000**.
- Sons IPA distincts : **1 567**.
- A / B / C / D : **7 / 675 / 818 / 500**.
- A+B : **682 (34,1 %)**.
- Candidats avec `drawability >= 3` : **1 298 (64,9 %)**.
- A+B monosyllabes : **378**.
- A+B bisyllabes : **304**.
- A+B IPA courte (≤4 segments approx.) : **488**.
- Sons avec ≥2 concepts lexicaux sérieux après déduplication prudente : **144**.

La distribution ci-dessus est la baseline automatique reproductible. La revue conceptuelle ciblée de la voie de sauvetage, décrite plus bas, ne la réécrit pas silencieusement.

## Rendement A+B par strate

| Strate | N | A+B | Rendement |
|---|---:|---:|---:|
| legacy_v1_v5 | 136 | 70 | 51,5 % |
| concrete_priority | 480 | 380 | 79,2 % |
| multi_homophone | 320 | 47 | 14,7 % |
| two_syllable | 260 | 157 | 60,4 % |
| low_frequency_concrete | 180 | 24 | 13,3 % |
| ambiguous_control | 180 | 0 | 0 % |
| abstract_control | 160 | 3 | 1,9 % |
| low_score_rescue_random | 260 | 0 | 0 % |
| deterministic_fill | 24 | 1 | 4,2 % |

## Voie de sauvetage faible-score

La baseline automatique ne récupère aucun A/B parmi les **260** relations tirées par hash déterministe avec pré-score ≤ 7. Ce zéro ne signifie pas « aucun faux négatif » : le pré-score et le proxy éditorial partagent certains signaux, notamment POS, fréquence et type lexical.

Une revue conceptuelle ciblée des 260 relations retrouve **4 candidats B sérieux (1,5 %)** sans aucune preuve humaine de nomination :

- `basse` /bas/ — sens instrument : le POS automatique avait conservé l'adjectif et manqué le nom d'instrument; score éditorial 74,8, classe B.
- `enceinte` /ɑ̃sɛ̃t/ — sens haut-parleur : le POS automatique avait conservé l'adjectif et manqué le nom d'objet; score 75,0, classe B.
- `rature` /ʁatyʁ/ — marque barrée : le proxy de fréquence sous-estime un concept visuel ordinaire; score 68,5, classe B.
- `portable` /pɔʁtabl/ — sens téléphone : le POS automatique avait conservé l'adjectif et manqué le nom d'objet; score 73,5, classe B.

La voie de sauvetage révèle donc au moins **4 faux négatifs sérieux sur 260 (1,5 %)**. Trois sur quatre proviennent d'un **écrasement de sens/POS** et un d'une **sous-estimation par fréquence corpus**. Le minimum observé après cette revue ciblée devient **686 candidats A+B sur 2 000 (34,3 %)**, sans prétendre que les 1 740 autres relations ont reçu la même profondeur éditoriale.

Les cas `roquet`, `pitre`, `moelle`, `rebond`, `flexion`, `violet` et `battoir` ont été réexaminés comme proches du seuil mais restent C : noms alternatifs dominants, contexte nécessaire ou nommabilité spontanée trop incertaine.

## Causes principales de C/D

- `low_expected_nameability` : 565.
- `variant_or_inflection` : 467.
- `aggregate_weakness` : 398.
- `low_drawability` : 288.
- `alternative_names` : 117.
- `abstract_concept` : 97.

Le résultat de sauvetage ajoute une cause structurelle distincte : **collision de sens/POS d'une même graphie et même IPA**. Cette cause n'est pas correctement mesurée par le simple comptage des variantes.

## Catégories

- Catégorie volumique la plus productive : `nom_concret_à_vérifier`, **584 A+B sur 1 221 (47,8 %)**.
- Catégories explicites très productives mais à petits effectifs : personne 13/13, corps 9/9, aliment 10/11, objet 26/29, nature 8/9, animal 5/7, vêtement 3/3, véhicule 2/2, outil 1/1.
- Catégories les moins productives dans le proxy : action 0/291, personne_rôle_candidat 0/88, abstrait 0/97 et fonction_ou_qualité 6/202.

Le **0 % des actions** et des rôles ne doit pas être lu comme une vérité éditoriale : c'est un signal que le proxy déterministe est trop conservateur sur ces familles et qu'elles demandent une revue humaine plus forte.

## Coût éditorial probable

Avec la classification actuelle, **B+C = 1 493 relations sur 2 000 (74,7 %)** demanderaient probablement une vraie décision éditoriale avant tout passage en C exploitable : les B sont par définition « bons candidats à vérifier » et les C nécessitent recherche/arbitrage. Les A automatiques sont très peu nombreux (**7**) et les D ne peuvent pas être abandonnés sans échantillonnage de contrôle, puisque la voie de sauvetage montre des faux négatifs de sens.

À grande échelle, le coût dominant n'est donc pas le calcul des features mais la **désambiguïsation MOT → SENS/CONCEPT**, puis l'estimation de nommabilité.

## Projection prudente

La tranche est volontairement stratifiée et enrichie : **on ne doit pas multiplier naïvement 34,1 % par 135 140**. Pour la planification seulement, la sensibilité observée fournit une enveloppe très large de **29 866 à 56 894** unités sérieuses potentielles si les futures strates se comportaient de façon comparable. Cette enveloppe n'est pas une estimation populationnelle et elle est moins fiable que les rendements par strate.

Pour l'effort éditorial, la tranche suggère qu'une part majoritaire des candidats présélectionnés devra encore être arbitrée humainement. Les strates les plus propices à une automatisation supplémentaire sont `concrete_priority`, `two_syllable` et les cas historiques déjà structurés. Les strates `multi_homophone`, `low_frequency_concrete`, actions, rôles, ambiguïtés et faible pré-score doivent rester fortement supervisées.

## Limites

- `conceptCategory` et les sous-scores de la baseline sont des estimations déterministes conservatrices; ils ne constituent aucune observation humaine.
- `humanNamingEvidence` reste `none` partout, y compris pour les quatre récupérations éditoriales.
- Le mapping Lexique utilisé pour les features garde actuellement une seule entrée par couple forme+IPA; il peut donc écraser des POS/sens concurrents. La voie de sauvetage a démontré que ce point produit de vrais faux négatifs.
- Les mots non présents dans le petit lexique sémantique explicite sont volontairement classés `nom_concret_à_vérifier`, ce qui favorise les faux négatifs plutôt que les faux positifs.
- La richesse multi-concepts est sous-estimée pour la polysémie d'un même lemme : la tranche déduplique graphies/flexions mais ne dispose pas encore d'un inventaire exhaustif de sens.
- La source de sélection est la cartographie dérivée du réservoir utile, pas l'ensemble B; la projection doit donc rester prudente.
- La fréquence et `phoneticReuse` ne peuvent pas contourner les garde-fous de nommabilité/dessinabilité.

## Recommandation

**Ne pas passer encore aux 135 140 relations.** Conserver sans changement la formule #290. L'étape suivante devrait être une deuxième tranche contrôlée centrée sur deux défauts mesurés ici : (1) préserver toutes les entrées POS/sens au lieu d'écraser forme+IPA, et (2) suréchantillonner `low_frequency_concrete` et la voie faible-score avec revue conceptuelle ciblée. En parallèle, les strates concrètes à fort rendement peuvent recevoir davantage d'automatisation de priorisation, mais aucune classe automatique ne doit devenir une validation humaine ni déclencher une campagne d'images.
