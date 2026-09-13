# B→C — amélioration bornée de la couverture sémantique

Statut : analyse uniquement. B inchangé. Formule #290 inchangée. `humanNamingEvidence = none`.

## Base et périmètre

- Merge #293 : `9dc7cba8ed4062add9ba15f3677dddaa9de181b8`.
- `main` réel après refresh automatique : `09ff8bf77f113b1db436c635cb8abf9522846b9f`.
- Branche : `analysis/sense-coverage-recall`.
- Corpus #293 : 400 unités, dont 99 étiquetées éditorialement.
- Extension de stress : 250 relations nouvelles, 0 chevauchement avec les 400, soit 650 unités au total.
- Aucun traitement 10–15k, aucune modification de B, aucun runtime/UI/image.

## Résultat principal sur les 99 cas étiquetés

| Mesure | Avant (#293) | Après couverture |
|---|---:|---:|
| TP | 31 | 39 |
| FP | 0 | 0 |
| TN | 45 | 45 |
| FN | 23 | 15 |
| Précision | 100,0 % | 100,0 % |
| Rappel | 57,4 % | 72,2 % |
| F1 | 72,9 % | 83,9 % |

Huit faux négatifs connus sont récupérés, sans faux positif introduit sur ce sous-ensemble. Ce gain provient entièrement de huit preuves `editorial_added`; aucun des 23 FN ne possède une preuve V1–V5 exacte IPA+graphie permettant de le convertir honnêtement en `observed`.

Cette mesure ne doit pas être extrapolée comme précision indépendante sur les 250 cas de stress : ils ne sont pas gold-labellisés. Ils servent à mesurer le comportement des routes et la disponibilité des provenances.

## Causes des 23 faux négatifs

- absence de preuve positive de sens : 16
- événement/action nominalisée : 2
- personnage visuel : 1
- collectif/relation : 1
- polysémie/contextualité : 1
- abstrait avec scène visualisable : 1
- polysémie texte/symbole/objet : 1

Recherche historique V1–V5 sur identité exacte IPA + graphie : **0/23 correspondance structurée**.

## Revue individuelle des 23 FN

| Mot | IPA | Concept sérieux attendu | Refus actuel / preuve manquante | Preuve structurée disponible | Risque FP | Décision |
|---|---|---|---|---|---|---|
| club | /klœb/ | sens concret de club | polysémie association/lieu/groupe/objet ; sens cible non fixé | non | élevé | orange |
| diable | /djabl/ | personnage démoniaque | personnage hors lexique concret sûr ; preuve de sens personnage | non | moyen | **editorial_added / vert** |
| ligne | /liɲ/ | ligne tracée | sens graphique autonome absent | non | moyen | **editorial_added / vert** |
| prof | /pʁɔf/ | professeur | rôle/personne absent ; sens nominal humain | non | moyen | **editorial_added / vert** |
| siège | /sjɛʒ/ | siège pour s'asseoir | polysémie ; sens objet mobilier | non | faible | **editorial_added / vert** |
| oeuvre | /œvʁ/ | œuvre artistique | sous-type visuel non contraint | non | élevé | orange |
| star | /staʁ/ | célébrité | rôle générique ; indices visuels non spécifiques | non | élevé | orange |
| drogue | /dʁɔg/ | substance psychotrope | nombreuses formes visuelles ; pas de canon | non | élevé | orange |
| flingue | /flɛ̃g/ | arme à feu | sens objet absent | non | moyen | **editorial_added / vert** |
| couple | /kupl/ | deux personnes en couple | relation/collectif ; preuve de sens humain | non | moyen | **editorial_added / vert** |
| mu | /my/ | sens non résolu / symbole grec possible | sens cible exact non établi, dépendance textuelle | non | élevé | orange |
| course | /kuʁs/ | course | événement nominalisé ; scène et nommabilité non garanties | non | élevé | orange |
| perte | /pɛʁt/ | perte | abstraction dépendante de ce qui est perdu | non | élevé | orange |
| chasse | /ʃas/ | chasse | activité nominalisée ; scène et nommabilité non garanties | non | élevé | orange |
| pub | /pœb/ | publicité | polysémie/contextualité ; format visuel non canonique | non | élevé | orange |
| rêve | /ʁɛv/ | rêve | abstraction visualisable mais convention ambiguë | non | élevé | orange |
| lettre | /lɛtʁ/ | lettre alphabétique ou courrier | deux sens visuels distincts ; sens cible non fixé | non | élevé | orange |
| chose | /ʃoz/ | objet indéterminé | référent trop générique | non | élevé | orange |
| gorge | /gɔʁʒ/ | gorge anatomique | partie du corps non couverte ; concurrence « cou » | non | moyen | **editorial_added / vert** |
| droite | /dʁwat/ | droite géométrique/côté/courant | polysémie majeure ; sens cible non fixé | non | élevé | orange |
| monstre | /mɔ̃stʁ/ | créature monstrueuse | créature absente du lexique concret sûr | non | faible | **editorial_added / vert** |
| vote | /vɔt/ | vote | urne/bulletin ≠ nom spontané « vote » garanti | non | élevé | orange |
| geste | /ʒɛst/ | geste | action générique ; un geste précis change souvent le mot nommé | non | élevé | orange |

### Cas explicitement demandés

- **diable** : récupérable, mais comme `editorial_added`, pas `observed`.
- **course** : reste orange ; image d'une course ≠ garantie de réponse nominale « course ».
- **chasse** : reste orange ; chasse/chasseur/fusil/poursuite concurrencent le mot cible.
- **pub** : reste orange ; publicité est multiforme et « pub » est contextuel.
- **rêve** : reste orange ; dormeur/bulle peut déclencher dormir, pensée, imagination.
- **lettre** : reste orange ; courrier et caractère alphabétique sont deux sens visuels distincts.
- **couple** : récupérable avec revue explicite comme `editorial_added`, risque moyen de « deux personnes ».

## Évolution des routes

Sur les 400 unités originales :

| Route | Avant | Après |
|---|---:|---:|
| Verte | 43 | 51 |
| Orange | 89 | 104 |
| Rouge | 268 | 245 |

Sur les 99 étiquetées : vert 8→16, orange 23→38, rouge 68→45.

La voie verte reste strictement fondée sur une preuve de sens : un `inferred_candidate` seul ne suffit jamais. Les huit nouveaux verts sont tous `editorial_added` explicites.

## 250 nouveaux cas de stress

Sélection déterministe, 0 chevauchement avec les 400 :

- concret explicite : 48 (60 demandés, réservoir disponible après exclusions insuffisant)
- abstrait/contextuel : 50
- rôle/action : 50
- ambiguïté/polysémie : 50
- faible fréquence : 40
- remplissage déterministe : 12

Dans ces 250 cas : 250 `inferred_candidate`, 2 preuves `observed` historiques déjà présentes dans `legacyEvidence`, 0 nouvel `editorial_added`.

Le corpus étendu 650 se répartit en : vert 53, orange 151, rouge 446.

## Provenances

Sur les 650 unités :

- `observed` : 37 occurrences de senseCandidate (35 historiques du prototype + 2 retrouvées dans le stress)
- `editorial_added` : 16 occurrences (8 historiques #291/#292 + 8 de cette mission)
- `inferred_candidate` : 650

Aucun `inferred_candidate` n'est converti en `observed`.

## Définition de la voie verte après cette mission

La définition ne s'élargit pas par relâchement de seuil. Elle s'élargit par **couverture de preuve**.

Un cas vert doit avoir un sens/concept visuel autonome avec :

1. identité IPA + graphie exacte ;
2. `senseCandidate` explicite ;
3. `visualConceptCandidate = true` ;
4. confiance suffisante ;
5. provenance `observed` ou `editorial_added` ;
6. ambiguïtés connues documentées ;
7. aucun passage au vert uniquement par POS NOM, fréquence, catégorie de secours ou `phoneticReuse`.

Le nombre de verts des 400 monte de 43 à 51 : +8, sans FP connu sur les 99 étiquetés.

## Travail humain restant

Cette mission a demandé une décision explicite sur les 23 FN connus pour en récupérer 8 de façon prudente. Le signal est utile mais encore trop artisanal : **0/23** récupération structurée automatique parmi les FN, toutes les nouvelles récupérations étant éditoriales.

À architecture inchangée, un lot 10–15k risquerait donc de déplacer une charge massive vers l'orange. Le travail humain doit être réduit avant changement d'échelle en ajoutant une source/inventaire de sens réellement structurée, traçable et déterministe, puis en la validant sur un nouveau corpus gold indépendant.

## Décision

**NON pour lancer maintenant 10 000–15 000 relations.**

Le compromis précision/rappel s'améliore nettement : rappel 57,4→72,2 %, F1 72,9→83,9, 0 FP introduit sur les 99 connus. Mais ce gain est produit par huit ajouts éditoriaux explicitement ciblés sur les FN déjà connus. Il démontre que la bonne preuve de sens fonctionne ; il ne démontre pas encore qu'on sait obtenir cette preuve à coût industriel.

Prochaine étape recommandée : prototyper/ingérer une source structurée de sens réellement traçable sur un corpus borné et indépendant, puis mesurer si elle transforme une fraction significative de l'orange en vert sans dégrader la précision. Garder un audit rouge par échantillonnage.
