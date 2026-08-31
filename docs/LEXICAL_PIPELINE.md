# Pipeline lexical et phonétique Rebulo Orthophonie

## But

Construire une banque de rébus utile en orthophonie sans approximation phonétique implicite. Le moteur travaille d'abord sur les formes sonores, puis les associe à des pictogrammes dont la dénomination complète est stable et reconnaissable.

## Pipeline

1. Importer Lexique 4 et conserver `Mot`, `Phono_IPA`, `Lemme`, `Cgram` et une mesure de fréquence.
2. Normaliser les formes phonétiques sans modifier les phonèmes.
3. Chercher les mots entièrement segmentables avec le lexique de pictogrammes actif.
4. Pour les mots non segmentables, chercher ceux auxquels il ne manque qu'un seul segment phonétique continu.
5. Agréger ces segments manquants en pondérant davantage les mots fréquents.
6. Examiner les segments les mieux classés et chercher une dénomination française entière pouvant les représenter exactement.
7. Refuser le segment si sa représentation exige une coupe cachée, une consonne muette ressuscitée, une voyelle modifiée ou un synonyme improbable.
8. Dessiner le pictogramme seulement après validation linguistique.
9. Recalculer la couverture et mesurer le gain réel.
10. Un item n'entre dans une séance clinique qu'après revue humaine et statut `validated`.

## Deux scores distincts

Le moteur doit toujours séparer :

- **rendement phonétique** : nombre et fréquence des mots débloqués par une nouvelle brique sonore ;
- **qualité clinique/visuelle** : stabilité de la dénomination, reconnaissance de l'image, adéquation à l'âge et absence d'ambiguïté problématique.

Un rendement élevé ne suffit jamais à autoriser une image.

## Exemple de rejet

`vache /vaʃ/` ne peut pas représenter `/va/`. Le fait que `/va/` soit un segment très utile ne change pas cette règle. Il faut trouver une autre représentation entière de `/va/`, utiliser une opération visuelle explicite à un niveau avancé, ou accepter que ce son ne dispose pas encore de pictogramme.

## Commandes

```bash
npm test
npm run import:lexique -- chemin/vers/Lexique4.tsv data/lexique4.compact.json
npm run analyze:coverage -- data/lexique4.compact.json data/lexicon-seed.json data/coverage-report.json
```

Le rapport de couverture contient les mots strictement constructibles et les segments manquants classés par gain potentiel. Ces résultats sont des candidats de recherche, pas du matériel clinique automatiquement validé.
