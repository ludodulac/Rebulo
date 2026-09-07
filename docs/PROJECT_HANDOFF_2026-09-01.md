# REBULO — PASSATION ACTIVE / POINT D’ENTRÉE UNIQUE

**Dernière mise à jour : 8 septembre 2026, après fusion de la PR #155.**

Ce fichier est le point d’entrée prioritaire pour continuer Rebulo. Le journal lisible d’avancement est `docs/PROGRESSION.md`. Les principes stables restent dans `docs/PRODUCT_PRINCIPLES.md` : ne pas les recopier ici sauf si une règle durable change réellement.

## Phrase de reprise

> **Continue Rebulo. Vérifie le HEAD réel de `main`, lis `docs/PRODUCT_PRINCIPLES.md`, puis utilise le chemin rapide ci-dessous pour ne charger que la partie concernée. Travaille sur une branche dédiée, avec les validations proportionnées au risque.**

Règles : vérifier `main` avant toute écriture ; ne jamais écrire directement sur `main` ; préserver les fonctionnalités ; ne jamais fabriquer de résultats humains, de validation clinique ou de statut `clinical_approved`.

---

# 0. Chemin rapide de reprise

## Toujours lire d’abord

1. `docs/PRODUCT_PRINCIPLES.md` — invariants produit et niveaux d’exigence.
2. Ce fichier — état courant, risques connus et aiguillage.
3. Le HEAD réel de `main`, les PR/commits récents et les tests de la zone touchée.

Ne relire `docs/PROGRESSION.md` en détail que si le lot concerne la recherche visuelle, les passations ou l’historique des décisions humaines.

## Aiguillage par type d’intervention

### Moteur strict / générateur
Lire :
- `src/phonetic-engine.js`
- `src/rebus-construction.js`
- `src/creator-runtime.js`
- `tests/phonetic-engine.test.mjs`
- `tests/rebus-construction.test.mjs`
- `tests/creator-runtime.test.mjs`

Garantie : une construction stricte n’utilise que des mots entiers et leurs prononciations entières ; la concaténation doit être exactement la cible. Le scoring (`decompositionScore` / `rankDecompositions`) ne s’applique qu’aux décompositions déjà générées par la segmentation phonétique stricte.

Validation :
- `npm run test:fast` pour une itération locale courte ;
- `npm run test:targeted:phonetic` pour toute modification touchant moteur, construction ou runtime du créateur ;
- `npm run test:full` avant fusion d’une modification phonétique importante.

### Corpus / couverture / lexique
Lire :
- `docs/LEXICAL_PIPELINE.md`
- `data/lexicon-seed.json`
- `data/corpus-pilot.json`
- `scripts/import-lexique.mjs`
- `scripts/analyze-coverage.mjs`
- tests de la source/génération concernée.

Sources et artefacts : `data/lexicon-seed.json` est une source structurante du lexique de pictogrammes ; `data/coverage-report.json` est un rapport généré et ne doit pas être corrigé à la main. Corriger la source ou le générateur, puis régénérer.

Validation : `npm run test:targeted:data`, puis le script de génération concerné si ses entrées ont changé. La couverture est une mesure, jamais une raison d’affaiblir Exact.

### Assets / dénomination / maturité
Lire :
- `docs/GUARANTEE_MODEL.md`
- `data/asset-sources.json`
- `data/production-naming-reviews.json`
- `data/pictogram-prototype-comparisons.json`
- `src/pictogram-guarantee.js`
- `src/asset-audit.js`

Garantie : ne pas confondre `general_illustration`, `phonetic_structured`, observation humaine et validation clinique. Une ambiguïté de dénomination est une donnée, pas une raison de forcer un mapping universel.

Validation : `npm run test:targeted:data`, `npm run audit:assets` et/ou `npm run audit:pictogram-guarantees` selon le lot. Les audits n’inventent jamais une validation humaine.

### UI / séance / impression
Lire uniquement le composant ou workflow concerné et ses tests UX. Si aucune logique phonétique/canonique n’est touchée, commencer par `npm run test:fast`, puis les tests ciblés de la zone. L’écran principal doit rester simple et les fonctions existantes accessibles.

## Invariants sentinelles

- **Exactitude stricte** — `validateStrictRebus` dans `src/phonetic-engine.js`; protégée par `tests/phonetic-engine.test.mjs`.
- **Pas d’opération cachée en strict** — `src/rebus-construction.js`; protégée par `tests/rebus-construction.test.mjs`.
- **Validité avant qualité** — segmentation stricte puis `decompositionScore` / `rankDecompositions`; protégée par `tests/phonetic-engine.test.mjs` et les tests du runtime créateur.
- **Aucune solution exacte est acceptable** — cas négatifs stables dans `tests/phonetic-engine.test.mjs` et refus `null` de `buildStrictConstruction`.
- **Maturité ≠ exactitude ≠ clinique** — `docs/GUARANTEE_MODEL.md`, `src/pictogram-guarantee.js`, tests `pictogram-guarantee*`.
- **Provenance des assets** — `data/asset-sources.json`, `src/asset-audit.js`, tests d’audit/inventaire. Une licence ou provenance inconnue nécessite un jugement/document humain ; elle ne doit pas être inventée.

## Niveaux de validation

- **FAST** — `npm run test:fast`. Syntaxe d’entrée + sentinelles strictes/construction/runtime + garanties pictogrammes/assets.
- **TARGETED** — utiliser `npm run test:targeted:phonetic` ou `npm run test:targeted:data`, puis ajouter les tests spécifiques du workflow modifié.
- **FULL** — `npm run test:full`. À utiliser avant fusion pour moteur phonétique, opérations, données canoniques, génération, ou lot transversal significatif.

Un lot est terminé lorsque la modification est minimale, les tests proportionnés au risque passent, aucune garantie n’a été affaiblie, les artefacts générés sont régénérés depuis leur source si nécessaire, et toute décision humaine restante est explicitement laissée ouverte.

---

# 1. Vision produit

Rebulo est un créateur général de rébus riche, ludique et intelligent, avec une couche Exact extrêmement rigoureuse. L’orthophonie est un usage exigeant du même moteur.

Parcours central : `Écris un mot → Créer le rébus`.

# 2. Invariant Exact

**IMAGE ENTIÈRE → MOT CONVENTIONNEL ENTIER → PRONONCIATION ENTIÈRE.**

Interdits en strict : lecture partielle cachée, suppression arbitraire, consonne muette ressuscitée, liaison inventée, approximation orthographique ou assouplissement destiné à gonfler la couverture.

`buildStrictConstruction` et `validateStrictRebus` restent des garde-fous. `grapheme`, `spatial_relation`, `explicit_deletion`, `explicit_substitution` et `repetition` sont des conventions générales seulement et doivent être visuellement explicites.

# 3. État technique

Dépôt : `ludodulac/Rebulo`.

Au démarrage du lot d’accélération du 8 septembre 2026, `main` était `3a892970609f703137d839696e5cb6673b0fdeed`, merge de la PR #155. Toujours re-vérifier le HEAD avant une écriture : ce SHA n’est pas une référence permanente.

Évolutions récentes déjà intégrées à ne pas redévelopper :
- catalogue strict réellement exposé au mode Jouer ;
- pratique de phrases et recommandation selon couverture visuelle ;
- suivi des révisions exactes de stimuli et files de migration visuelle ;
- opérations générales explicites séparées du strict ;
- profils/difficulté et outils de séance existants ;
- modèle explicite de garanties des pictogrammes et ambiguïtés de dénomination (`docs/GUARANTEE_MODEL.md`, PR #155).

# 4. Changement de méthode majeur

Ne plus créer des vagues de pictogrammes plausibles à l’aveugle. Priorité : collecter de vrais rébus français publiés, analyser leurs images, extraire les briques réellement utilisées, conserver lecture/source/contexte/ambiguïtés, puis chercher un asset libre ou produire une adaptation originale conforme à la convention. Les passations servent ensuite à départager les cas incertains.

`data/attested-rebus-corpus.json` conserve le corpus attesté et ses sources. Une attestation prouve un usage de convention dans un rébus ; elle ne constitue ni validation clinique, ni activation lexicale automatique, ni éligibilité automatique au mode Exact.

# 5. Première passation humaine réelle

Le 5 septembre 2026, une première personne a réalisé les cinq sessions historiques. Les réponses verbatim sont consignées dans `docs/PROGRESSION.md`.

Une personne ne valide aucun pictogramme. Cette passation sert surtout à réorienter la recherche visuelle.

# 6. Conséquences iconographiques

Les décisions détaillées et observations historiques restent dans `docs/PROGRESSION.md`. Ne pas les recopier dans de nouveaux documents. Les prototypes de recherche ne doivent jamais être réactivés automatiquement ni confondus avec les assets de production.

# 7. Outils humains

`naming-test.html` : passation simple, anonyme, code et ordre aléatoire automatiques, question « Qu’est-ce que c’est ? », export JSON local.

`naming-review.html` : imports multiples liés à la révision exacte, comptages descriptifs et miniatures, aucune activation automatique.

`research-gallery.html` : galerie, aperçu sans indices, zoom/navigation, curation locale et ré-import strict.

# 8. Statut recherche

Les comparaisons et prototypes restent gouvernés par leurs fichiers canoniques et leur statut explicite. Ne pas fabriquer d’agrégat humain, de validation clinique ou de promotion à partir d’un test planifié, d’une attestation, d’un score de couverture ou d’une décision produit.

# 9. Direction

Construire et améliorer le vocabulaire visuel attesté de Rebulo : corpus → preuve iconographique → ambiguïtés/provenance → asset → intégration contrôlée → mesure de couverture → observation humaine quand nécessaire.

La priorité d’ingénierie est désormais aussi de rendre chaque petit lot plus rapide à reprendre et plus facile à valider sans créer d’exceptions ni de documentation parallèle.

# 10. Garde-fous

Ne pas inventer participants ou observations ; ne pas déclarer `clinical_approved` automatiquement ; ne pas affaiblir Exact ; ne pas réintroduire de lecture partielle cachée ; ne pas recopier des illustrations protégées ; ne pas réactiver silencieusement les prototypes ; ne pas confondre attestation dans un rébus, reconnaissance spontanée d’une image et validation clinique.

Lorsqu’un exemple échoue, chercher d’abord si l’absence de solution est correcte, si la donnée est incomplète/incorrecte ou si une opération générique explicite manque. Ne jamais ajouter une exception phonétique pour sauver un mot particulier.

# 11. Résumé de reprise

**Vérifier `main`, lire les principes, choisir la zone via le chemin rapide, travailler par petit lot, lancer FAST puis TARGETED/FULL selon le risque, et préserver strictement la séparation entre exactitude phonétique, qualité visuelle et validation humaine/clinique.**
