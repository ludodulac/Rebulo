# Rebulo — cartographie des briques phonétiques

- Vocabulaire linguistique présélectionné : 14135 lemmes.
- Vocabulaire utile pilotant les priorités : 8094 lemmes.
- Arrière-plan Lexique non prioritaire : 6041 lemmes.
- Cibles appuyées par la liste scolaire Éduscol : 1341.
- Segments IPA du vocabulaire utile : 25075.
- Recherche de routes difficiles : 250 briques issues directement des 128 cibles difficiles; les 60 priorités globales restent inchangées.

## Couverture utile Rebulo

- Image entière : 300 (3.7 %).
- Plusieurs images : 94 (1.2 %).
- Avec lettre explicite : 161 (2.0 %).
- Non résolu : 7539 (93.1 %).

## Vague de prototypes actuelle

- Première vague : haie /ɛ/, oie /wa/, or /ɔʁ/.
- Simulation phonétique : +32 cibles techniquement jouables.
- Vague suivante : as /as/.
- Réserve : tee /ti/, anse /ɑ̃s/.

## Stratégies explicites pour les segments difficiles

| Segment | Mots utiles | Stratégie | Pistes lexicales | Fallback visible | Statut |
|---|---:|---|---|---|---|
| /mɑ̃/ | 18 | alternate_segmentation_first | man, mans, mens | MENT | contextual_grapheme_rule_not_yet_authorized |
| /ɛ̃/ | 16 | alternate_segmentation_first | hein, ain | IN, UN | contextual_grapheme_rule_not_yet_authorized |
| /œʁ/ | 11 | scene_comparison | heure | — | compare_two_scene_variants_in_blind_naming_test |
| /aʁ/ | 8 | scene_comparison_for_older_users | art | [object Object] | grapheme_sound_general_mode_research_only |
| /al/ | 9 | alternate_segmentation_preferred | halle, ale | [object Object], [object Object] | grapheme_sound_general_mode_research_only |
| /tʁ/ | 30 | alternate_segmentation_required | — | TR | grapheme_cluster_general_mode_research_only |
| /sjɔ̃/ | 20 | alternate_segmentation_required | scion | TION, SION | contextual_grapheme_rule_not_yet_authorized |
| /di/ | 16 | alternate_segmentation_required | dit | [object Object] | grapheme_sound_general_mode_research_only |

## Alternatives automatiques aux segments difficiles

| Segment difficile | Mots utiles débloqués | Autre segment | Candidat naturel | Mots communs | Exemples |
|---|---:|---|---|---:|---|
| /tʁ/ | 30 | /t/ | — | 9 | travers, attraper, traverser, rattraper, tracer, patrie |
| /k/ | 85 | /ks/ | — | 4 | sexy, accident, lexie, maxi |
| /t/ | 99 | /tʁ/ | — | 9 | travers, attraper, traverser, rattraper, tracer, patrie |
| /l/ | 69 | /al/ | ale | 9 | allô, signal, allo, idéal, haleine, allergie |
| /s/ | 67 | /l/ | — | 5 | laisse, domicile, missile, lester, docile |
| /p/ | 52 | /pʁ/ | — | 6 | esprit, prix, privé, pris, primaire, priver |
| /ʁ/ | 86 | /aʁ/ | art | 8 | art, bagarre, are, harper, artère, mouchard |
| /n/ | 70 | /ʁ/ | — | 6 | reine, sirène, arène, marraine, rênes, raina |
| /b/ | 60 | /bl/ | — | 2 | obliger, obligé |
| /d/ | 48 | /di/ | dit | 12 | dîner, paradis, midi, diriger, diner, divers |
| /st/ | 22 | /s/ | — | 1 | mystère |
| /bl/ | 18 | /b/ | — | 2 | obliger, obligé |
| /m/ | 32 | /l/ | — | 2 | mille, similaire |
| /pʁ/ | 16 | /p/ | — | 6 | esprit, prix, privé, pris, primaire, priver |
| /ks/ | 8 | /k/ | — | 4 | sexy, accident, lexie, maxi |

## Candidats déjà curatés — priorité qualité × utilité

| Rang | Segment | Meilleur candidat | Score qualité | Mots utiles débloqués | Priorité combinée |
|---:|---|---|---:|---:|---:|
| 1 | /e/ | É | 50 | 45 | 310.373 |
| 2 | /ʁe/ | ré | 59 | 38 | 310.02 |
| 3 | /ɛ/ | haie | 85 | 13 | 179.546 |
| 4 | /ɑ̃/ | AN | 50 | 22 | 170.647 |
| 5 | /œʁ/ | heure | 59 | 11 | 120.647 |
| 6 | /sjɔ̃/ | — | — | 20 | 105.551 |
| 7 | /di/ | — | — | 16 | 87.738 |
| 8 | /al/ | halle | 52 | 9 | 86.613 |
| 9 | /ɔʁ/ | or | 85 | 4 | 84.696 |
| 10 | /ti/ | tee | 69 | 6 | 83.875 |
| 11 | /aʁ/ | art | 56 | 8 | 83.339 |
| 12 | /wa/ | oie | 95 | 4 | 82.142 |
| 13 | /as/ | as | 85 | 4 | 74.94 |
| 14 | /kɔ̃/ | — | — | 11 | 67.148 |
| 15 | /ʁo/ | rot | 49 | 7 | 57.383 |
| 16 | /ɑ̃s/ | anse | 63 | 1 | 31.475 |

## Priorités automatiques de recherche utiles

| Rang | Segment | Mots utiles débloqués | Gain utile pondéré | Gain global | Candidats à examiner |
|---:|---|---:|---:|---:|---|
| 1 | /e/ | 45 | 10897.495 | 79 | eh, hé, ais, est |
| 2 | /ʁe/ | 38 | 2970.755 | 61 | ré, rée |
| 3 | /sjɔ̃/ | 20 | 1198.672 | 30 | scion, cyon, scions |
| 4 | /mɑ̃/ | 18 | 4496.016 | 29 | man, mans, mens |
| 5 | /di/ | 16 | 858.981 | 24 | dit, die, dit |
| 6 | /ɑ̃/ | 22 | 7323.249 | 34 | an, han |
| 7 | /ɛ̃/ | 16 | 4589.302 | 23 | hein, ein, eins, ain |
| 8 | /tʁ/ | 30 | 12380.404 | 52 | — |
| 9 | /œʁ/ | 11 | 4210.431 | 12 | heure, heurt, heur |
| 10 | /al/ | 9 | 847.595 | 14 | ale, halle, hâle, hale |
| 11 | /aʁ/ | 8 | 437.525 | 14 | art, are, hart, arrhes |
| 12 | /f/ | 48 | 21893 | 77 | — |
| 13 | /k/ | 85 | 21852.369 | 136 | — |
| 14 | /t/ | 99 | 18999.231 | 159 | — |
| 15 | /l/ | 69 | 17177.351 | 112 | — |
| 16 | /s/ | 67 | 15112.669 | 108 | — |
| 17 | /p/ | 52 | 11667.19 | 69 | — |
| 18 | /ʁ/ | 86 | 11578.22 | 138 | — |
| 19 | /ɛ/ | 13 | 577.501 | 21 | hey, haie, es, aie |
| 20 | /ʁo/ | 7 | 45.224 | 18 | rot, rho, rôt, rhô |
| 21 | /n/ | 70 | 6782.85 | 113 | — |
| 22 | /b/ | 60 | 4891.51 | 94 | — |
| 23 | /d/ | 48 | 3674.071 | 83 | — |
| 24 | /kɔ̃/ | 11 | 983.024 | 22 | con |
| 25 | /z/ | 20 | 602.516 | 29 | zzz, zzzz |
| 26 | /ɑ̃t/ | 8 | 79.617 | 13 | ante, ente, hante, ente |
| 27 | /st/ | 22 | 3047.656 | 40 | — |
| 28 | /ti/ | 6 | 300.539 | 16 | tee, tie |
| 29 | /wa/ | 4 | 83.804 | 5 | oie, ouah, oye, wouah |
| 30 | /ɔʁ/ | 4 | 382.03 | 6 | or, ord, ort, ore |

> Les graphèmes du registre des segments difficiles sont des pistes de recherche du mode général, pas des règles autorisées. La liste Éduscol renforce l’utilité scolaire; elle ne fournit pas d’âge d’acquisition.
