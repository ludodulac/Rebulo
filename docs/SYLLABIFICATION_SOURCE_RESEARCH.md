# Source de frontières syllabiques — décision de recherche

## But

Trouver une source réelle de frontières syllabiques françaises sans déduire les syllabes à partir des pièces du rébus, de l’orthographe ou du seul nombre de syllabes.

## Source retenue pour la recherche

Lexique documente un champ de syllabation phonologique (`SyllPhono` / historiquement `syll`) calculé sur sa représentation phonologique. La documentation Lexique indique que cette syllabation suit l’algorithme décrit par Dufour, Peereman, Pallier et Radeau, avec une segmentation syllabique calculée après retrait des schwas finaux. Lexique 4 est distribué sous licence CC BY-SA 4.0.

Références :

- https://www.lexique.org/
- https://www.lexique.org/?page_id=294
- https://openlexicon.fr/datasets-info/Lexique383/README-Lexique.html

## Décision Rebulo

`SyllPhono` constitue une source documentée de **frontières syllabiques**, mais sa notation phonologique historique n’est pas de l’IPA. Rebulo doit donc conserver deux champs distincts :

- `syllabification` : uniquement une syllabification explicitement fournie en IPA ;
- `sourceSyllabification` : la syllabation source Lexique dans sa notation d’origine.

Aucune conversion automatique `SyllPhono → IPA` n’est autorisée tant qu’un mapping explicite, testé et documenté n’a pas été validé.

## Conséquences produit

Cette recherche ne suffit pas à activer `syllable-segmentation`, `syllable-identification` ou `syllable-blending` sur les cibles générées. La prochaine étape technique est de construire un convertisseur de notation Lexique vers des unités IPA syllabifiées, puis de vérifier :

1. que la concaténation des syllabes converties redonne exactement l’IPA cible normalisée ;
2. que le nombre de syllabes correspond à `SyllNb` lorsqu’il est disponible ;
3. que les cas ambigus ou non convertibles sont rejetés plutôt qu’approximés ;
4. que les activités syllabiques ne sont activées que lorsque ces invariants sont satisfaits.

## Garde-fou

Les pièces d’un rébus restent des mots/images entiers. Elles ne deviennent jamais des syllabes par simple coïncidence de découpage.
