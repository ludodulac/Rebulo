# REBULO — Fondation de reprise du 1er septembre 2026

Ce document versionne dans le dépôt les décisions opérationnelles prioritaires du dossier de passation `REBULO_PASSATION_COMPLETE_2026-09-01` utilisé pour reprendre le projet.

## Règle absolue

IMAGE ENTIÈRE → MOT CONVENTIONNEL ENTIER → PRONONCIATION ENTIÈRE.

Une décomposition n'est acceptée par défaut que si la concaténation phonémique est exacte. Aucune suppression arbitraire, consonne muette ressuscitée, liaison inventée ou proximité orthographique ne doit être utilisée pour fabriquer une solution.

Exemple valide : `mer /mɛʁ/ + scie /si/ → merci /mɛʁsi/`.

Exemple invalide : `riz /ʁi/ + bus /bys/ ≠ rébus /ʁebys/`.

## Positionnement V1

Rebulo est d'abord un outil de création de matériel pour orthophonistes. Le rébus phonétiquement strict est son mécanisme différenciant. La complexité scientifique appartient au moteur ; l'interface doit rester simple, tactile, enfantine et lisible.

Parcours prioritaire :

`Écris un mot → Créer le rébus → cartes illustrées → modification → impression / téléchargement`.

Le logiciel doit refuser clairement lorsqu'aucune solution exacte n'est disponible.

## Doctrine d'interface

La philosophie visuelle de Rebulo s'inspire de la manière dont des jeux mobiles comme Clash Royale organisent l'attention et le toucher, sans reprendre leur identité graphique, leurs personnages, leurs textures ni leurs mécanismes de stimulation.

Objectif : **la profondeur d'un logiciel professionnel avec la manipulabilité d'un jeu pour enfant**.

Principes de conception :

1. **Une seule scène principale.** Le produit doit se comporter comme une application plein écran et non comme une longue page web. Le rébus est l'objet central ; les réglages secondaires apparaissent temporairement par-dessus ou depuis les bords.
2. **Une géographie stable.** L'utilisateur doit apprendre les emplacements par répétition : état et création en haut, contenu au centre, actions et navigation en bas. Les fonctions majeures ne changent pas arbitrairement de place.
3. **Une action dominante.** À chaque état, une action doit être immédiatement compréhensible. Les fonctions secondaires ne doivent pas rivaliser visuellement avec elle.
4. **Des contrôles courts et physiques.** Gros boutons, grandes cibles tactiles, contours et profondeur suffisants pour distinguer ce qui est manipulable. Un bouton ne doit pas être un paragraphe ou une consigne longue.
5. **Le contenu avant les menus.** Les images du rébus doivent occuper davantage d'attention que les réglages, preuves IPA, métadonnées ou commandes professionnelles.
6. **Divulgation progressive.** IPA, provenance, validation d'image, métadonnées de séance et options PDF restent accessibles mais ne sont exposées qu'au moment utile, notamment en mode professionnel.
7. **Feedback immédiat.** Créer, ajouter, déplacer, valider ou exporter doit produire une réaction visuelle claire. L'animation sert à confirmer l'action et à guider l'attention, jamais à distraire.
8. **Toucher d'abord.** L'interface est conçue d'abord pour le doigt, puis pour la souris. Elle doit rester utilisable par un jeune enfant, un lecteur fragile ou une personne dont la précision motrice est limitée.
9. **Codes visuels constants.** Les mêmes formes, emplacements et catégories de couleurs doivent conserver le même sens. Aucun état critique ne doit dépendre uniquement de la couleur.
10. **Cartes cohérentes.** Une pièce de rébus suit une grammaire visuelle stable : image dominante, puis uniquement les informations adaptées au mode courant.
11. **Interface calme.** Rebulo reprend du jeu mobile sa lisibilité, sa hiérarchie et sa sensation de manipulation, mais pas la multiplication des notifications, récompenses ou sollicitations concurrentes.
12. **Pas de bouton automatique pour une nouvelle fonction.** Toute fonctionnalité nouvelle doit d'abord trouver sa place dans la hiérarchie existante. Si elle est secondaire, elle rejoint un panneau ou un contexte approprié au lieu d'allonger l'écran principal.

### Critère de revue UX

Avant de fusionner une évolution visible, vérifier au minimum :
- tient-elle dans la scène principale ou dans un panneau temporaire sans créer de page à rallonge ?
- le rébus reste-t-il visuellement prioritaire ?
- peut-on comprendre l'action principale sans lire une longue explication ?
- les cibles tactiles restent-elles suffisamment grandes et séparées ?
- le changement conserve-t-il les emplacements appris et les fonctions existantes ?
- l'information avancée est-elle cachée tant qu'elle n'est pas nécessaire ?

Si plusieurs réponses sont négatives, l'évolution doit être repensée avant d'ajouter des contrôles visibles.

## Architecture

Le concept linguistique et l'illustration restent séparés. Un concept porte notamment un label et une IPA ; une illustration peut être remplacée sans modifier la logique phonétique. Les statistiques de dénomination appartiendront au couple concept + illustration.

Une seule banque graphique doit être visible en V1. Les licences et attributions doivent rester traçables.

## Ordre de construction

1. Reconnexion et sauvegarde.
2. Mini prototype interface.
3. Noyau linguistique : IPA, segmentation exacte, refus des approximations, tests.
4. Petit corpus de 10–20 concepts.
5. Génération de fiches et PDF.
6. Mode orthophoniste.
7. Validation visuelle.
8. Infrastructure seulement lorsque le parcours principal est validé.
9. Bibliothèque graphique originale ensuite.

## Garde-fous

- Ne pas toucher à un projet Supabase qui n'est pas explicitement Rebulo.
- Ne pas transformer Rebulo en outil de diagnostic automatique.
- Ne pas privilégier le rendement lexical au détriment de la clarté visuelle.
- Refuser plutôt que fabriquer une fausse solution.
- Préserver les fonctions existantes sauf décision explicite de remplacement.
- Prouver d'abord la chaîne complète sur un petit corpus avant d'industrialiser.
- Ne pas laisser l'accumulation de fonctionnalités transformer l'écran principal en formulaire ou tableau de bord dense.

## État de reprise

La connexion au dépôt `ludodulac/Rebulo` a été confirmée le 1er septembre 2026. Le travail initial de reprise a été effectué sur la branche `handoff-mini-prototype`, puis les évolutions validées ont été fusionnées dans `main`. Le mini créateur a été ajouté sans supprimer le prototype jeu historique, puis raccordé au moteur `src/phonetic-engine.js`, à `data/lexicon-seed.json` et à `data/corpus-pilot.json`.
