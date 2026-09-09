# Rebulo — index documentaire sélectif

Ce fichier route vers la documentation utile. **Ne pas lire tout `docs/` par défaut.** Commencer par `AI_START_HERE.md`, puis venir ici seulement pour le domaine concerné.

## Produit / garanties

- [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) — règles constitutives du produit et niveau de garantie attendu.
- [GUARANTEE_MODEL.md](GUARANTEE_MODEL.md) — distinguer validité phonologique, représentation et niveaux de validation.
- [CREATOR_STATES.md](CREATOR_STATES.md) — états du créateur et comportement associé.

## Lexique / phonologie

- [LEXICAL_ENGINE.md](LEXICAL_ENGINE.md) — moteur lexical et responsabilités.
- [LEXICAL_PIPELINE.md](LEXICAL_PIPELINE.md) — chaîne de préparation/exploitation lexicale.
- [PHONETIC_BRICK_MAP.md](PHONETIC_BRICK_MAP.md) — couverture des briques phonétiques.
- [REBUS_SOUND_CATALOG.md](REBUS_SOUND_CATALOG.md) — emplacement canonique et méthode pour les fenêtres sonores 1–2 syllabes, les découpages glissants, les représentations visuelles, conventions et approximations.
- [COVERAGE_ANALYSIS.md](COVERAGE_ANALYSIS.md) et [GENERAL_COVERAGE_ANALYSIS.md](GENERAL_COVERAGE_ANALYSIS.md) — analyses de couverture ; à lire pour les questions de corpus, pas pour une modification UI.
- [HARD_SEGMENT_WORD_ROUTES.md](HARD_SEGMENT_WORD_ROUTES.md) — document volumineux sur les segments difficiles ; ne l'ouvrir que si le problème porte réellement sur ces routes.

## Images / nommabilité

- [VISUAL_WORK_HANDOFF.md](VISUAL_WORK_HANDOFF.md) — mémoire des illustrations/prototypes déjà travaillés et règle de reprise avant toute génération ou substitution d'asset.
- [OPEN_PICTOGRAM_LIBRARY.md](OPEN_PICTOGRAM_LIBRARY.md) — bibliothèque de pictogrammes et stratégie d'assets.
- [CLINICAL_PICTOGRAM_PLAN.md](CLINICAL_PICTOGRAM_PLAN.md) — réflexion clinique autour des pictogrammes ; ne pas confondre avec validation clinique acquise.
- [NAMING_TEST_RUNNER.md](NAMING_TEST_RUNNER.md) — protocole/outillage pour tester la nommabilité.

## Recherche / orthophonie

- [ORTHOPHONIE_RESEARCH.md](ORTHOPHONIE_RESEARCH.md) — recherche métier ; contexte, pas preuve de validation clinique du produit.

## Dépendances / expansion

- [ACTIVE_DEPENDENCIES.md](ACTIVE_DEPENDENCIES.md) — dépendances réellement actives.
- [EXPANSION_SIMULATION.md](EXPANSION_SIMULATION.md) — simulation d'expansion ; à consulter uniquement pour ce sujet.

## Routage rapide

- Mot phonologiquement correct mais humainement ambigu → `GUARANTEE_MODEL` → `LEXICAL_ENGINE` → documents de nommabilité si nécessaire.
- Inventaire de sons, fenêtres 1–2 syllabes, découpages traversant les mots, lettres/chiffres ou petite approximation → `REBUS_SOUND_CATALOG` → `PHONETIC_BRICK_MAP` → données/tests concernés.
- Image/pictogramme absent ou mal exploité → `VISUAL_WORK_HANDOFF` → `OPEN_PICTOGRAM_LIBRARY` → `NAMING_TEST_RUNNER`.
- Couverture insuffisante → analyses de couverture → pipeline lexical.
- Problème d'interface créateur → `CREATOR_STATES` puis code réel.

Le code, les données, les tests et l'état déployé restent prioritaires sur cet index.
