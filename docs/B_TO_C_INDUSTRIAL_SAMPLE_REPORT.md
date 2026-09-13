# Rebulo — première tranche industrielle B → C

- Main de départ : `4d8655f3aae5e8b91f4de51afe32cbb53acd52c7`
- Statut : analyse uniquement; aucune activation runtime, aucun asset, aucune UI/planner/Phrase/Vague 6.
- B reste inchangé.
- Taille : **2 000 relations B** sélectionnées depuis la cartographie dérivée de 5 515 sons; aucune réévaluation intégrale des 135 140 relations.
- `humanNamingEvidence = none` : **2 000 / 2 000**.

## Résultats

- Sons IPA distincts : **1567**.
- A / B / C / D : **7 / 675 / 818 / 500**.
- A+B : **682 (34.1 %)**.
- Candidats avec drawability ≥ 3 : **1298 (64.9 %)**.
- A+B monosyllabes : **378**.
- A+B bisyllabes : **304**.
- A+B IPA courte (≤4 segments approx.) : **488**.
- Sons avec ≥2 concepts lexicaux sérieux après déduplication prudente : **144**.

## Rendement A+B par strate

| Strate | N | A+B | Rendement |
|---|---:|---:|---:|
| legacy_v1_v5 | 136 | 70 | 51.5 % |
| concrete_priority | 480 | 380 | 79.2 % |
| multi_homophone | 320 | 47 | 14.7 % |
| two_syllable | 260 | 157 | 60.4 % |
| low_frequency_concrete | 180 | 24 | 13.3 % |
| ambiguous_control | 180 | 0 | 0 % |
| abstract_control | 160 | 3 | 1.9 % |
| low_score_rescue_random | 260 | 0 | 0 % |
| deterministic_fill | 24 | 1 | 4.2 % |

## Voie de sauvetage faible-score

- Relations : **260**.
- Candidats A/B récupérés malgré un pré-score ≤ 7 : **0 (0 %)**.
- Catégories récupérées : aucune.

## Causes principales de C/D

- low_expected_nameability : 565.
- variant_or_inflection : 467.
- aggregate_weakness : 398.
- low_drawability : 288.
- alternative_names : 117.
- abstract_concept : 97.

## Catégories

- Plus productives : personne (100% A+B, n=13); corps (100% A+B, n=9); vêtement (100% A+B, n=3); véhicule (100% A+B, n=2); outil (100% A+B, n=1).
- Moins productives : autre (0% A+B, n=1); personne_rôle_candidat (0% A+B, n=88); abstrait (0% A+B, n=97); action (0% A+B, n=291); fonction_ou_qualité (3% A+B, n=202).

## Projection prudente

La tranche est volontairement stratifiée et enrichie : **on ne doit pas multiplier naïvement 34.1% par 135 140**. Pour la planification seulement, la sensibilité observée donne une fourchette de travail de **29 866 à 56 894** unités sérieuses potentielles si les strates futures restent comparables. Cette fourchette n’est pas une estimation populationnelle.

## Limites

- `conceptCategory` et les sous-scores éditoriaux de cette tranche sont des estimations déterministes conservatrices; ils ne constituent aucune observation humaine.
- Les mots non présents dans le petit lexique sémantique explicite sont volontairement plafonnés par une catégorie `nom_concret_à_vérifier`, ce qui favorise les faux négatifs plutôt que les faux positifs.
- La richesse multi-concepts est sous-estimée pour la polysémie d’un même lemme : cette tranche déduplique graphies/flexions mais ne dispose pas encore d’un inventaire de sens complet.
- La source de sélection est la cartographie dérivée du réservoir utile, pas l’ensemble B; la projection doit donc rester prudente.
- La fréquence et `phoneticReuse` ne peuvent pas contourner les garde-fous de nommabilité/dessinabilité.

## Recommandation

Conserver la formule #290. Avant toute extension massive, faire une seconde tranche centrée sur la voie de sauvetage et les `nom_concret_à_vérifier`, avec revue éditoriale humaine ciblée des désaccords A/B ↔ pré-score faible. Ne lancer ni campagne d’images ni Vague 6 à partir de cette seule tranche.
