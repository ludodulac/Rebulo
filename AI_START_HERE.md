# Rebulo — AI start here

Ce fichier est un **routeur de contexte**. Il ne remplace ni le code, ni les données, ni les tests, ni `docs/PRODUCT_PRINCIPLES.md`.

**Règle principale : ne lis que la documentation pertinente à la zone touchée. Ne relis pas tout Rebulo par défaut.**

## 1. Avant d'agir : vérifier le dépôt réel

Pour toute nouvelle conversation :

1. vérifier le HEAD réel de `main` ;
2. regarder les commits récents et les PR/issues ouvertes qui touchent la tâche ;
3. vérifier la CI et, si la tâche concerne l'interface déployée, le workflow GitHub Pages pertinent ;
4. inspecter le code, les données et les tests réellement concernés avant de modifier quoi que ce soit ;
5. travailler sur une branche dédiée, jamais directement sur `main`.

Ne copie pas de SHA, de métrique de couverture ou de nombre d'assets dans un document comme s'il s'agissait d'une vérité durable. Pour les chiffres courants, lis ou régénère les rapports de `data/` et les scripts qui les produisent.

## 2. Hiérarchie de vérité

En cas de doute, utiliser cet ordre :

1. **comportement réel** — code + données + tests + état déployé pertinent ;
2. **principes durables** — `docs/PRODUCT_PRINCIPLES.md` ;
3. **contrats/modèles spécialisés** — par exemple `docs/GUARANTEE_MODEL.md`, `docs/LEXICAL_PIPELINE.md`, fichiers de données canoniques et modules spécialisés ;
4. **état opérationnel / passation** — `docs/PROJECT_HANDOFF_2026-09-01.md`, seulement si la tâche nécessite l'état des travaux ou des gates humains ;
5. **historique / anciennes expériences** — `docs/PROGRESSION.md`, anciennes analyses, anciennes PR/issues et documents de recherche datés.

Si une documentation contredit le comportement réel, ne choisis pas silencieusement. Vérifie laquelle est périmée, puis remets la documentation utile en cohérence avec le code, les données et les tests.

## 3. Constitution à préserver

Lire `docs/PRODUCT_PRINCIPLES.md` pour les détails. Le minimum à garder en tête :

- Rebulo est un créateur de rébus riche, ludique et intelligent ;
- le cœur `strict` repose sur la **phonétique**, jamais sur la simple ressemblance orthographique ;
- une image stricte représente **un mot entier** et utilise **sa prononciation entière** ;
- la concaténation doit correspondre **exactement** à la prononciation cible ;
- `Aucune solution exacte` est un résultat normal ;
- toute convention non stricte doit être explicite, nommée et testable ;
- usage ludique, exactitude phonétique, plausibilité visuelle, adéquation à l'âge, observation humaine et validation clinique sont des niveaux distincts ;
- une illustration disponible ou phonétiquement exploitable n'est jamais automatiquement cliniquement validée.

Ne duplique pas la constitution dans un nouveau document : pointe vers `docs/PRODUCT_PRINCIPLES.md`.

## 4. Routage par zone

### Moteur phonétique / strict

Lire :
- `docs/PRODUCT_PRINCIPLES.md` ;
- `src/phonetic-engine.js` ;
- `src/rebus-construction.js` si la tâche touche les opérations/constructions ;
- `src/creator-runtime.js` si elle touche le chemin créateur ;
- `tests/phonetic-engine.test.mjs`, `tests/rebus-construction.test.mjs`, `tests/creator-runtime.test.mjs` selon la zone.

Ne pas charger les documents cliniques, les journaux de recherche visuelle ou les gros rapports lexicaux sauf si la tâche les touche réellement.

### Corpus / prononciations / couverture

Lire :
- `docs/LEXICAL_PIPELINE.md` ;
- `data/lexicon-seed.json` et les données corpus réellement consommées par la tâche ;
- `scripts/import-lexique.mjs` ;
- `scripts/build-target-vocabulary.mjs` ;
- `scripts/analyze-coverage.mjs`, `scripts/build-phonetic-brick-map.mjs` ou le générateur concerné ;
- les tests `target-vocabulary`, `syllable-coverage`, `phonetic-brick-*` ou de couverture concernés.

Les rapports générés de `data/` sont des **sorties à lire/régénérer**, pas des sources à corriger manuellement.

La priorité produit n'est pas de maximiser un énorme lexique. Le pipeline de décision doit tendre vers :

`vocabulaire utile → âge / fréquence / commonness → prononciations → décompositions → chunks nécessaires → candidats lexicaux → candidats visuellement nommables → qualité → illustrations`.

Un lexique global ne doit pas faire remonter artificiellement une brique marginale uniquement parce qu'elle existe ou débloque beaucoup de formes rares.

Ne charge `docs/HARD_SEGMENT_WORD_ROUTES.md`, les analyses de couverture anciennes ou les grandes tables de recherche que si la tâche porte précisément sur ces routes.

### Illustrations / bibliothèque visuelle / dénomination

Lire uniquement :
- `docs/GUARANTEE_MODEL.md` ;
- `data/asset-sources.json` ;
- `data/lexicon-seed.json` ;
- `data/production-naming-reviews.json` et/ou `data/pictogram-prototype-comparisons.json` si la tâche touche la dénomination ;
- `src/asset-audit.js`, `src/pictogram-guarantee.js` et leurs tests si l'audit/maturité est concerné.

Distinguer toujours :

`illustration disponible → phonologiquement exploitable → visuellement plausible → spontanément nommable → adaptée à l'âge → humainement observée/validée selon le protocole → éventuellement cliniquement revue`.

La provenance/licence et la validation humaine sont deux questions différentes. Ne transfère pas une observation d'une ancienne révision vers un dessin modifié.

Ne lis `docs/OPEN_PICTOGRAM_LIBRARY.md`, `docs/CLINICAL_PICTOGRAM_PLAN.md` ou les historiques de prototypes que si la tâche les nécessite.

### UX / mode Jouer / expérience mobile

Commencer par :
- `docs/PRODUCT_PRINCIPLES.md` — doctrine d'interface ;
- `index.html` ;
- `styles.css` et les CSS spécifiques réellement impliqués ;
- `app.js`, `src/app-bootstrap.js`, `src/creator-runtime.js` selon le flux ;
- les tests UX ciblés, notamment `tests/play-game.test.mjs` et `tests/mobile-ux-regression.test.mjs` quand pertinents.

Préserver : scène principale claire, rébus visuellement dominant, interactions tactiles, complexité avancée cachée lorsqu'elle n'est pas utile, interface calme et lisible.

Ne charge pas le pipeline Lexique ou les documents cliniques pour une modification purement visuelle/UX, sauf dépendance réelle.

### Opérations générales non strictes

Lire :
- `src/rebus-construction.js` ;
- `src/general-operation-visual.js` ;
- `src/general-operation-readiness.js` ;
- `src/contextual-grapheme-operation.js` si concerné ;
- `data/general-operation-readiness.json` ;
- `data/general-operation-comprehension-tests.json` ;
- les tests `general-operation-*` / `contextual-grapheme-operation.test.mjs` pertinents.

Une opération documentée ou visuellement définie n'est pas automatiquement autorisée. Ne la laisse jamais contaminer le mode strict.

### Usage clinique / orthophonique

Ne charger cette couche que si la tâche touche réellement l'usage clinique, les séances, activités, publics ou niveaux de validation.

Selon la tâche, consulter `docs/GUARANTEE_MODEL.md`, `docs/ORTHOPHONIE_RESEARCH.md`, `docs/CLINICAL_PICTOGRAM_PLAN.md`, les modules d'activités/séances et leurs tests.

Ne jamais présenter une exactitude phonétique, une illustration plausible, une fréquence lexicale, une CI verte ou une observation de dénomination comme une validation clinique.

## 5. Validation d'une modification

Choisir la validation proportionnée au risque depuis `package.json` :

- **documentation seule** : vérifier chemins, cohérence avec les sources et diff ; pas de grosse suite métier par réflexe ;
- **itération produit locale** : `npm run test:fast` ;
- **phonétique / construction / runtime** : `npm run test:targeted:phonetic` + tests spécifiques ;
- **données / corpus / assets** : `npm run test:targeted:data` + générateur/audit concerné ;
- **lot transversal ou modification à fort risque** : `npm run test:full`.

Avant fusion : vérifier que les artefacts générés viennent de leurs sources, qu'aucun invariant n'a été affaibli et que les gates humains restent explicitement humains.

## 6. Passation entre conversations

Ne crée pas un nouveau handoff concurrent. Utilise `docs/PROJECT_HANDOFF_2026-09-01.md` pour l'**état opérationnel utile seulement**.

Après une session importante, y conserver de façon concise :
- ce qui a réellement été modifié et fusionné ;
- ce qui a été vérifié ;
- ce qui reste hypothétique ou humainement non testé ;
- les blocages réels ;
- la prochaine priorité utile ;
- les sources de vérité à relire pour reprendre.

Ne recopier ni la chronologie complète, ni des tableaux déjà générés, ni les principes stables. `docs/PROGRESSION.md` est un journal/historique : ne le lire que si l'historique d'une décision est nécessaire.

## Reprise minimale

Pour une tâche ciblée, une nouvelle conversation doit pouvoir faire :

`AI_START_HERE.md → état réel de main/CI/PR → PRODUCT_PRINCIPLES.md → fichiers de la zone → tests de la zone`.

Tout le reste est chargé seulement si la tâche l'exige.
