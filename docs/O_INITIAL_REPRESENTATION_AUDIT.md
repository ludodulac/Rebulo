# Audit ciblé de la zone phonétique /o…/

La mesure précédente `0/62` concernait les **hypothèses visuelles curatées**, pas l'absence absolue de toute représentation dans la banque.

## Résultat utile immédiat

Le son strict `/o/` dispose déjà d'une convention visible correcte : la lettre **O**, dont le nom français stocké dans `data/rebus-visible-conventions.json` est `/o/`. Cette route est une convention explicite; elle ne doit jamais être confondue avec une image.

Le même son possède aussi un candidat lexical concret très utile : **eau**, face notamment à `au`, `aux`, `haut`, `oh`. La banque contient déjà `assets/research/eau-openmoji-drop-1f4a7.svg`, mais l'inspection graphique conclut **à retravailler** : une goutte isolée peut être nommée « goutte » plutôt que « eau ».

Wave 6 promeut donc le **concept eau** comme hypothèse éditoriale, tout en gardant le SVG existant au niveau recherche et en conservant **O** comme route conventionnelle stricte séparée.

## Cas à ne pas forcer

`/otɑ̃/` (`autan / autant / ôtant`) reste différé. Une image de vent ne garantit toujours pas « autan » et n'est pas rendue stricte par le simple fait que le concept existe.

Les routes approximatives éventuelles restent hors de cet audit strict. Aucune lettre, note, chiffre ou image n'est autorisée à recevoir une lecture phonétique différente de sa lecture stockée pour améliorer artificiellement la couverture.

## Conséquence produit

Le trou /o…/ se scinde désormais en deux questions distinctes :

- `/o/` a une route conventionnelle stricte déjà disponible et une hypothèse pictographique `eau` nouvellement curatée mais graphiquement non validée;
- les autres sons commençant par /o/ restent un réservoir à explorer sans extrapoler la lettre O à des séquences plus longues.

Aucune donnée humaine n'a été créée pendant cet audit.
