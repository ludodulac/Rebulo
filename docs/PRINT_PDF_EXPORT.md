# Rebulo — impression et export PDF

## Objectif Phase 4

La sortie imprimable doit produire deux supports distincts à partir de la même décomposition phonétique stricte :

- **Fiche enfant** : images seules, consigne simple et ligne de réponse ; aucune correction phonétique visible.
- **Correction pro** : mot cible, dénominations conventionnelles complètes et preuve IPA de la concaténation exacte.

Le choix de fiche ne modifie jamais la décomposition calculée par le moteur.

## Flux actuel

1. L'utilisateur saisit une cible présente dans `data/corpus-pilot.json`.
2. `src/phonetic-engine.js` cherche une segmentation exacte avec les concepts actifs.
3. La solution est revalidée avant affichage.
4. `app.js` présente le même résultat en mode `child` ou `pro`.
5. **Imprimer la fiche** utilise les styles `@media print` et le mode courant.
6. **Télécharger le PDF** appelle `src/pdf-export.js` et génère un vrai fichier A4 dans le navigateur.

## Génération PDF

`src/pdf-export.js` charge jsPDF au moment de l'export depuis jsDelivr. Les SVG du rébus sont rasterisés localement dans un canvas puis incorporés au PDF ; aucun contenu de séance n'est envoyé à un backend Rebulo.

La preuve IPA de la fiche professionnelle est elle aussi rasterisée via canvas afin d'éviter la perte de glyphes IPA (`ɛ`, `ʁ`, `ɥ`, etc.) dans les polices PDF standard.

Si le module PDF distant est indisponible, Rebulo affiche une erreur d'export et conserve la fonction d'impression navigateur.

## Garde-fous

- Le mode enfant ne doit jamais révéler la réponse dans le titre, les labels ou la preuve IPA.
- Le mode professionnel doit afficher la cible et la preuve phonétique exacte.
- Le changement de mode ne doit jamais modifier les pièces sélectionnées.
- Le PDF ne doit jamais fabriquer une solution qui n'a pas déjà passé `validateStrictRebus()`.
- L'export reste un traitement local côté navigateur ; aucun backend n'est requis pour la Phase 4.

## Tests

`tests/pdf-export.test.mjs` vérifie au minimum :

- la séparation des contenus enfant / pro ;
- la présence de la ligne de réponse en mode enfant ;
- l'absence de correction visible en mode enfant ;
- la preuve IPA attendue en mode pro ;
- la normalisation du nom de fichier PDF.

Le rendu graphique complet doit encore faire l'objet d'un test navigateur réel sur mobile et desktop avant une diffusion clinique.
