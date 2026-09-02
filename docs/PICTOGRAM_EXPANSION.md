# Expansion de la bibliothèque de pictogrammes

Rebulo ne doit pas agrandir sa bibliothèque au hasard. Chaque nouveau concept coûte du dessin, de la documentation, de la vérification phonétique et, pour les usages cliniques, un contrôle humain supplémentaire.

## Deux niveaux à ne pas confondre

1. **Opportunité phonétique** : un segment manquant dont l'ajout pourrait débloquer de nombreux mots. Cette mesure vient du rapport de couverture et ne dit rien sur la possibilité de dessiner le segment.
2. **Candidat pictogramme** : un mot entier ayant exactement cette prononciation et pouvant être étudié comme concept illustrable. Il reste un candidat de recherche tant que l'imageabilité et la stabilité de dénomination n'ont pas été examinées.

Un bon score de couverture ne suffit donc jamais à activer un pictogramme.

## Pipeline

- mesurer les segments manquants avec `coverage-report.json` ;
- exclure les sons déjà représentés dans le lexique, y compris les prototypes volontairement inactifs ;
- rechercher des noms entiers homophones exacts ;
- éliminer les artefacts évidents comme lettres, abréviations et formes ponctuées ;
- classer par gain pondéré, nombre de formes potentiellement débloquées et fréquence du candidat ;
- effectuer une revue humaine d'imageabilité et de risque de dénomination ;
- seulement ensuite chercher ou produire un asset ;
- l'activation dans le moteur strict reste une décision séparée.

## Shortlist actuelle

`data/pictogram-expansion-shortlist.json` contient cinq concepts à étudier en priorité : `tas /ta/`, `raie /ʁɛ/`, `terre /tɛʁ/`, `pot /po/` et `dos /do/`.

Ils sont tous marqués `research_candidate` et `activation: not_ready`. Cette shortlist n'est ni une validation d'image, ni une validation clinique.

## Garde-fous

- ne jamais transformer automatiquement une opportunité phonétique en pictogramme actif ;
- ne jamais réactiver un prototype bloqué simplement parce que son rendement est élevé ;
- conserver la dénomination complète du pictogramme comme unité phonétique du mode strict ;
- mesurer à nouveau la couverture après chaque activation réelle afin de choisir la suivante sur des données actualisées.
