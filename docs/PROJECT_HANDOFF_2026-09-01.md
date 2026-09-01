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

## État de reprise

La connexion au dépôt `ludodulac/Rebulo` a été confirmée le 1er septembre 2026. Le travail de reprise est effectué sur la branche `handoff-mini-prototype`. Le mini créateur a été ajouté sans supprimer le prototype jeu historique, puis raccordé au moteur `src/phonetic-engine.js`, à `data/lexicon-seed.json` et à `data/corpus-pilot.json`.
