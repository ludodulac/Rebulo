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

`SyllPhono` constitue une source documentée de **frontières syllabiques**, mais sa notation phonologique historique n’est pas de l’IPA. Rebulo conserve donc deux informations distinctes :

- `sourceSyllabification` : la syllabation Lexique originale, inchangée ;
- `syllabification` : une syllabification IPA exploitable uniquement si elle était explicitement fournie en IPA ou si la conversion du code Lexique a passé tous les contrôles stricts.

Le convertisseur `src/lexique-syllabification.js` utilise uniquement la table de codes phonémiques documentée par Lexique. Il refuse les symboles inconnus et ne promeut une conversion que si :

1. tous les symboles source sont explicitement mappés ;
2. le nombre de syllabes converties correspond à `SyllNb` lorsqu’il est disponible ;
3. la concaténation des syllabes IPA redonne exactement l’IPA cible normalisée.

Un échec laisse `syllabification` indisponible ; aucune approximation n’est produite.

## Conséquences produit

Les syllabifications validées peuvent alimenter les inventaires linguistiques marqués `source_exact`. Cette étape **n’active pas** automatiquement `syllable-segmentation`, `syllable-identification` ou `syllable-blending` dans le créateur.

Avant toute activation d’activité syllabique, il reste à définir pour chaque activité :

- les unités présentées à l’utilisateur ;
- la réponse attendue ;
- les cas d’ambiguïté ou de variation ;
- les critères de disponibilité explicites dans le runtime.

## Garde-fou

Les pièces d’un rébus restent des mots/images entiers. Elles ne deviennent jamais des syllabes par simple coïncidence de découpage.
