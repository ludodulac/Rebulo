# Rebulo — AI start here

Ce fichier est un **routeur de contexte**, pas une encyclopédie. Il ne remplace ni le code, ni les données, ni les tests, ni `docs/PRODUCT_PRINCIPLES.md`.

**Ne lire que la documentation pertinente à la zone touchée. Ne pas relire tout Rebulo par défaut.**

## 1. Avant d'agir

Pour toute nouvelle conversation :
1. vérifier le HEAD réel de `main` ;
2. regarder commits récents, PR/issues ouvertes et CI pertinentes ;
3. si l'interface déployée est concernée, vérifier aussi GitHub Pages ;
4. inspecter le code, les données et les tests de la zone avant toute modification ;
5. travailler sur une branche dédiée, jamais directement sur `main`.

Ne pas recopier SHA, métriques de couverture ou nombres d'assets comme vérités durables. Lire ou régénérer les rapports de `data/` quand un chiffre courant est nécessaire.

## 2. Hiérarchie de vérité

1. **Comportement réel** — code + données + tests + état déployé pertinent.
2. **Principes durables** — `docs/PRODUCT_PRINCIPLES.md`.
3. **Contrats/modèles spécialisés** — par exemple `docs/GUARANTEE_MODEL.md`, `docs/LEXICAL_PIPELINE.md`, données canoniques et modules spécialisés.
4. **État opérationnel** — `docs/PROJECT_HANDOFF_2026-09-01.md`, seulement si la tâche nécessite l'état des travaux ou des gates humains.
5. **Historique** — `docs/PROGRESSION.md`, anciennes analyses, PR/issues et expériences datées.

Si une documentation contredit le comportement réel, vérifier laquelle est périmée et la remettre en cohérence ; ne pas choisir silencieusement.

## 3. Constitution à préserver

Les détails vivent dans `docs/PRODUCT_PRINCIPLES.md`. Minimum à retenir :
- Rebulo est un créateur de rébus riche, ludique et intelligent ;
- le cœur `strict` repose sur la phonétique, jamais sur la simple ressemblance orthographique ;
- une image stricte représente un mot entier et utilise sa prononciation entière ;
- la concaténation doit correspondre exactement à la prononciation cible ;
- `Aucune solution exacte` est un résultat normal ;
- toute convention non stricte doit être explicite, nommée et testable ;
- usage ludique, exactitude phonétique, plausibilité visuelle, adéquation à l'âge, observation humaine et validation clinique sont distincts ;
- une illustration disponible ou phonétiquement exploitable n'est jamais automatiquement cliniquement validée.

Ne pas recopier la constitution dans un nouveau document.

## 4. Routage par zone

### Moteur phonétique / strict
Lire : `docs/PRODUCT_PRINCIPLES.md`, `src/phonetic-engine.js`, puis `src/rebus-construction.js` et/ou `src/creator-runtime.js` si concernés, avec leurs tests `phonetic-engine`, `rebus-construction`, `creator-runtime`.

Ne pas charger la documentation clinique, la recherche visuelle ou les gros rapports lexicaux sans dépendance réelle.

### Corpus / prononciations / couverture
Lire : `docs/LEXICAL_PIPELINE.md`, les données corpus réellement consommées, `data/lexicon-seed.json`, puis les scripts concernés (`import-lexique`, `build-target-vocabulary`, `analyze-coverage`, `build-phonetic-brick-map`) et leurs tests.

Les rapports générés de `data/` sont des sorties à lire/régénérer, pas des sources à corriger manuellement.

Priorité produit :
`vocabulaire utile → âge / fréquence / commonness → prononciations → décompositions → chunks nécessaires → candidats lexicaux → candidats visuellement nommables → qualité → illustrations`.

Ne pas laisser un énorme lexique faire remonter artificiellement une brique marginale uniquement parce qu'elle existe ou débloque beaucoup de formes rares. Ne charger `docs/HARD_SEGMENT_WORD_ROUTES.md` ou les grandes analyses que pour une tâche qui les concerne.

### Illustrations / bibliothèque visuelle / dénomination
Lire : `docs/GUARANTEE_MODEL.md`, `data/asset-sources.json`, `data/lexicon-seed.json`, puis `data/production-naming-reviews.json` et/ou `data/pictogram-prototype-comparisons.json` si la dénomination est concernée. Pour les audits : `src/asset-audit.js`, `src/pictogram-guarantee.js` et leurs tests.

Toujours distinguer :
`illustration disponible → phonologiquement exploitable → visuellement plausible → spontanément nommable → adaptée à l'âge → humainement observée/validée selon le protocole → éventuellement cliniquement revue`.

Provenance/licence et validation humaine sont différentes. Ne jamais transférer silencieusement une observation vers une autre révision. Ne charger `docs/OPEN_PICTOGRAM_LIBRARY.md`, `docs/CLINICAL_PICTOGRAM_PLAN.md` ou les historiques de prototypes que si nécessaire.

### UX / mode Jouer / mobile
Commencer par `docs/PRODUCT_PRINCIPLES.md`, `index.html`, `styles.css` et les CSS réellement impliqués, puis `app.js`, `src/app-bootstrap.js`, `src/creator-runtime.js` selon le flux. Utiliser les tests UX ciblés, notamment `tests/play-game.test.mjs` et `tests/mobile-ux-regression.test.mjs` quand pertinents.

Préserver : scène principale claire, rébus visuellement dominant, interactions tactiles, complexité avancée cachée lorsqu'elle n'est pas utile, interface calme et lisible.

### Opérations générales non strictes
Lire : `src/rebus-construction.js`, `src/general-operation-visual.js`, `src/general-operation-readiness.js`, `src/contextual-grapheme-operation.js` si concerné, `data/general-operation-readiness.json`, `data/general-operation-comprehension-tests.json` et les tests associés.

Une opération documentée ou visuellement définie n'est pas automatiquement autorisée et ne doit jamais contaminer le mode strict.

### Usage clinique / orthophonique
Ne charger cette couche que si la tâche touche réellement l'usage clinique, les séances, activités, publics ou niveaux de validation. Selon le besoin : `docs/GUARANTEE_MODEL.md`, `docs/ORTHOPHONIE_RESEARCH.md`, `docs/CLINICAL_PICTOGRAM_PLAN.md`, modules d'activités/séances et tests associés.

Ne jamais présenter exactitude phonétique, illustration plausible, fréquence lexicale, CI verte ou observation de dénomination comme validation clinique.

## 5. Validation proportionnée

Depuis `package.json` :
- documentation seule : vérifier chemins, cohérence des sources et diff ; pas de grosse suite métier par réflexe ;
- itération produit : `npm run test:fast` ;
- phonétique / construction / runtime : `npm run test:targeted:phonetic` + tests spécifiques ;
- données / corpus / assets : `npm run test:targeted:data` + générateur/audit concerné ;
- lot transversal ou risqué : `npm run test:full`.

Avant fusion : vérifier que les artefacts générés viennent de leurs sources, qu'aucun invariant n'est affaibli et que les gates humains restent explicitement humains.

## 6. Passation entre conversations

Ne pas créer un nouveau handoff concurrent. `docs/PROJECT_HANDOFF_2026-09-01.md` conserve uniquement :
- ce qui a réellement été modifié et vérifié ;
- ce qui reste hypothétique ou humainement non testé ;
- les blocages réels ;
- la prochaine priorité utile ;
- les sources à relire pour reprendre.

Ne pas y recopier chronologie complète, rapports ou principes stables. `docs/PROGRESSION.md` est historique : ne le lire que si l'historique d'une décision est nécessaire.

## Reprise minimale

`AI_START_HERE.md → état réel de main/CI/PR → PRODUCT_PRINCIPLES.md → fichiers de la zone → tests de la zone`

Tout le reste est chargé seulement si la tâche l'exige.
