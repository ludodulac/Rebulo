# Couverture des rébus généraux

Ce document mesure le rendement des conventions de rébus général par rapport au socle phonétique strict. Il s'agit d'une mesure de **couverture de formes lexicales**, pas d'une validation pédagogique ou clinique.

## Référence actuelle

Le rapport de couverture courant utilise 16 pictogrammes actifs.

- vrais rébus stricts multi-pièces, formes uniques : **291**
- rébus supplémentaires générés avec exactement un nom de lettre : **88**
- total strict + image/lettre : **379**
- gain relatif apporté par les graphèmes : **+30,24 %**

Autrement dit, l'ajout d'une seule famille d'opération explicite augmente d'environ un tiers le nombre de formes accessibles sans ajouter de pictogramme.

## Forme des 88 candidats

- 73 constructions utilisent 2 opérations ;
- 15 constructions utilisent 3 opérations ;
- 45 placent le graphème à la fin ;
- 42 le placent au début ;
- 1 le place au milieu.

Lettres effectivement utilisées dans le rapport courant :

| Lettre | Formes débloquées |
| --- | ---: |
| P | 12 |
| G | 11 |
| K | 11 |
| T | 11 |
| C | 10 |
| V | 10 |
| I | 9 |
| A | 7 |
| O | 7 |

Exemples produits automatiquement : `pas + C` → *passer/passé*, `scie + T` → *cité/citer*, `rat + T` → *raté/rater*, `T + rat + pie` → *thérapie*.

## Interprétation

Le gain est assez important pour confirmer que les **opérations explicites ont un fort effet de levier** : elles réutilisent la petite bibliothèque d'images existante pour produire davantage de rébus de type magazine sans affaiblir le mode strict.

Le nombre 88 ne signifie cependant pas 88 idées ou concepts différents. Lexique contient des formes fléchies et des homophones orthographiques : *passé*, *passer*, *passée* et *passés* peuvent partager la même construction. La mesure doit donc rester une métrique de couverture technique, non un indicateur de variété ludique.

De même, une correspondance phonétique exacte avec un nom de lettre ne constitue pas une validation clinique. Les candidats `general` restent distincts de la capacité `phonetic_strict` et des statuts de validation orthophonique.

## Décision produit

Avec **+30,24 % sans nouvelle image**, le prochain investissement doit continuer à tester une seconde convention explicite plutôt que lancer immédiatement une expansion massive de la bibliothèque.

La prochaine candidate retenue est `spatial_relation`, car elle correspond à une convention classique de rébus, reste visuellement compréhensible lorsqu'elle est montrée explicitement et possède déjà un cas pilote dans le corpus : *souris*, où `sous` doit être représenté par une relation spatiale et non par un pictogramme ambigu.

Cette décision ne remplace pas l'expansion future des pictogrammes. Elle sert à mesurer d'abord le rendement marginal des conventions de rébus général, famille par famille.

## Reproductibilité

`src/general-coverage.js` calcule ces métriques à partir de `data/coverage-report.json` en réutilisant exactement le générateur `buildGraphemeCreatorTargets`. `tests/general-coverage.test.mjs` exécute cette mesure sur le rapport réel à chaque suite de tests afin que le chiffre reste vérifiable lorsque le corpus ou les règles évoluent.
