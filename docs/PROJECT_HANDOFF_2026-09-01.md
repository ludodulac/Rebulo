# REBULO — PASSATION ACTIVE / POINT D’ENTRÉE UNIQUE

**Dernière mise à jour : 9 septembre 2026, après fusion des PR #192–#193 et préparation de la première vague de reviews de dénomination de production.**

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
- `data/pictogram-naming-test-plans.json`
- `src/pictogram-guarantee.js`
- `src/asset-audit.js`

Garantie : ne pas confondre `general_illustration`, `phonetic_structured`, observation humaine et validation clinique. Une ambiguïté de dénomination est une donnée, pas une raison de forcer un mapping universel.

Validation : `npm run test:targeted:data`, `npm run audit:assets` et/ou `npm run audit:pictogram-guarantees` selon le lot. Les audits n’inventent jamais une validation humaine.

État matériel courant après PR #192 :
- 24 SVG de production actifs dans l’inventaire ;
- 29 SVG de recherche au total ;
- 23 stimuli locaux actuellement disponibles dans les comparaisons de recherche actives ;
- les deux scènes `heure-scene-a-v1` et `heure-scene-b-v1` existent réellement et sont séparées, aveugles, sans réponse visible ;
- `heure-prototype-comparison-v1` est désormais `ready_for_human_naming_test`, sans aucune observation fabriquée.

Après PR #193, les faux manques de provenance pour `dé`, `mer`, `pie`, `mie`, `mât` sont réparés depuis l’historique Git, et les révisions des OpenMoji actifs `scie`, `nez`, `rat`, `pas`, `lit`, `riz`, `chat` sont figées dans `data/asset-sources.json`. Cela documente les stimuli ; cela ne valide pas leur dénomination.

### Opérations générales visibles
Lire :
- `src/rebus-construction.js`
- `src/general-operation-visual.js`
- `src/general-operation-readiness.js`
- `src/contextual-grapheme-operation.js`
- `data/general-operation-readiness.json`
- `data/general-operation-comprehension-tests.json`
- tests `general-operation-*` et `contextual-grapheme-operation.test.mjs`.

Garantie : toute opération générale reste visible, explicite, non stricte et non activée automatiquement. Les niveaux de maturité sont `research_only` → `semantics_defined` → `visual_cue_defined` → `comprehension_tested` → `authorized_general`. Une opération documentée n’est pas automatiquement utilisable.

État actuel :
- `grapheme` avec nom de lettre explicite : `authorized_general` selon le comportement général historique déjà testé ;
- `D→/d/`, `R→/ʁ/`, `L→/l/`, `N→/n/`, `GN→/ɲ/`, `Y→/j/` : `visual_cue_defined`, pas encore autorisés ;
- `TR→/tʁ/`, `MENT→/mɑ̃/`, `TION/SION→/sjɔ̃/` : `visual_cue_defined` avec preuve mot source + IPA exacte au bord du mot ; pas encore autorisés ;
- `IN/UN` : `research_only`, bloqués tant qu’un alignement graphème↔phonème fiable manque.

Le protocole canonique de compréhension est `data/general-operation-comprehension-tests.json`. Il planifie 10 opérations actuellement à `visual_cue_defined`, exige des verbatim humains, interdit la promotion automatique et ne contient aucun résultat tant qu’aucune passation réelle n’a eu lieu.

### UI / séance / impression
Lire uniquement le composant ou workflow concerné et ses tests UX. Si aucune logique phonétique/canonique n’est touchée, commencer par `npm run test:fast`, puis les tests ciblés de la zone. L’écran principal doit rester simple et les fonctions existantes accessibles.

## Invariants sentinelles

- **Exactitude stricte** — `validateStrictRebus` dans `src/phonetic-engine.js`; protégée par `tests/phonetic-engine.test.mjs`.
- **Pas d’opération cachée en strict** — `src/rebus-construction.js`; protégée par `tests/rebus-construction.test.mjs`.
- **Validité avant qualité** — segmentation stricte puis `decompositionScore` / `rankDecompositions`; protégée par `tests/phonetic-engine.test.mjs` et les tests du runtime créateur.
- **Aucune solution exacte est acceptable** — cas négatifs stables dans `tests/phonetic-engine.test.mjs` et refus `null` de `buildStrictConstruction`.
- **Maturité ≠ exactitude ≠ clinique** — `docs/GUARANTEE_MODEL.md`, `src/pictogram-guarantee.js`, tests `pictogram-guarantee*`.
- **Provenance des assets** — `data/asset-sources.json`, `src/asset-audit.js`, tests d’audit/inventaire. Une licence ou provenance inconnue nécessite un jugement/document humain ; elle ne doit pas être inventée.
- **Opération documentée ≠ autorisée** — `data/general-operation-readiness.json`; aucune opération à `research_only`, `semantics_defined` ou `visual_cue_defined` ne doit entrer automatiquement dans le générateur.
- **Compréhension humaine ≠ clinique** — `data/general-operation-comprehension-tests.json`; aucune passation de compréhension ne produit de statut clinique.

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

`buildStrictConstruction` et `validateStrictRebus` restent des garde-fous. Les opérations générales explicites restent séparées du strict et doivent être visuellement explicites.

# 3. État technique actuel

Dépôt : `ludodulac/Rebulo`.

Toujours re-vérifier le HEAD de `main` avant une écriture ; les SHA cités dans l’historique ne sont jamais des références permanentes.

Paquets récents importants :
- PR #181 : `grapheme_sound` explicite, IPA-ciblé et général-only ; distinction stricte avec le nom français de la lettre ;
- PR #182 : quatre compositions générales exactes de recherche (`/dite/`, `/mid/`, `/ɲal/`, `/jœʁ/`) ; la file hard-route est passée à 0 cible nécessitant une représentation entièrement nouvelle ;
- PR #183–#186 : tri visuel conservateur ; `heure /œʁ/` devient le seul prototype de scène prioritaire du dernier sous-lot et les pistes lexicales faibles sont fermées comme non-visuelles ;
- PR #187 : `heure` enregistré dans le pipeline de test avec garde-fou contre les planches révélant la réponse ;
- PR #188 : modèle de maturité des opérations générales ;
- PR #189 : sémantique exacte et conservatrice pour `MENT`, `TION`, `SION` ;
- PR #190 : sémantique conservatrice de `TR` au début du mot + modèle visuel générique montrant graphème, IPA cible, mot source et IPA source ;
- PR #191 : protocole canonique de compréhension humaine pour les 10 opérations `visual_cue_defined`, avec `results: []` tant qu’aucune vraie passation n’a lieu ;
- PR #192 : création et intégration des deux vrais stimuli aveugles `heure-scene-a-v1` et `heure-scene-b-v1`; passage du plan `heure` à `ready_for_human_naming_test`; 23 stimuli de comparaison disponibles ;
- PR #193 : réconciliation de provenance/révision des assets : `dé`, `mer`, `pie`, `mie`, `mât` ne sont plus faussement `undocumented`; révisions OpenMoji actives figées ; les scènes `heure` sont enregistrées comme prototypes de recherche.

Conséquence actuelle : le principal goulot n’est plus la découverte phonétique brute ni la création du prototype `heure`, mais la **passation de dénomination des stimuli existants** et la **compréhension humaine des opérations générales**. L’infrastructure technique doit être préparée au maximum avant ces gates humains.

# 4. Couverture et cartographie phonétique

Le travail Lexique/Éduscol distingue couverture linguistique globale et couverture utile Rebulo. Ne pas optimiser sur tous les types Lexique à poids égal.

Le dernier état consolidé de la file hard-route après PR #182 était : 117 cibles visuelles non résolues, dont 100 couvertes par une opération générale documentée, 17 par recherche pictogramme/scène, 0 nécessitant une représentation entièrement nouvelle. Les paquets suivants ont réduit la partie « pictogramme à prototyper » et ont transformé les opérations générales documentées en objets testables.

La dernière baseline technique conservée par `active-dependency-report.json` est de 24 pictogrammes actifs et 760 mots uniques stricts multi-pièces. Les PR #192–#193 n’ont pas activé ou retiré de pictogramme de production : elles ne doivent donc pas être présentées comme un gain artificiel de couverture stricte.

# 5. Recherche visuelle et dénomination

Ne plus créer des vagues de pictogrammes plausibles à l’aveugle. Avant dessin : exactitude phonétique du mot entier + probabilité de dénomination spontanée + simplicité visuelle + âge/utilité. Un objet simplement descriptible par le mot cible n’est pas suffisant.

Exemple sentinelle : `cuit /kɥi/` est phonétiquement exact mais un œuf cuit sera spontanément nommé « œuf » ; cette piste ne doit pas être activée ni redessinée comme si elle était valide.

`heure /œʁ/` reste une scène de recherche à haut risque de réponses `montre`, `horloge`, `temps`, mais le blocage matériel est levé :
- `assets/research/heure-scene-a-v1.svg` existe ;
- `assets/research/heure-scene-b-v1.svg` existe ;
- les deux stimuli sont séparés et ne contiennent ni mot cible, ni IPA, ni légende, ni nombres ;
- `heure-prototype-comparison-v1` est `ready_for_human_naming_test` ;
- `namingTestStatus` reste `not_run` et `humanDecision` reste `null`.

Ne pas fabriquer le résultat du test. Le prochain gate `heure` est humain.

# 6. Outils humains

`naming-test.html` : passation simple, anonyme, code et ordre aléatoire automatiques, question « Qu’est-ce que c’est ? », export JSON local. Le runner charge à la fois les comparaisons de prototypes et les reviews de production disponibles.

`naming-review.html` : imports multiples liés à la révision exacte, comptages descriptifs et miniatures, aucune activation automatique.

`research-gallery.html` : galerie, aperçu sans indices, zoom/navigation, curation locale et ré-import strict. Après PR #192, les deux stimuli `heure` disponibles peuvent entrer dans la galerie de recherche ; aucun stimulus `pending` ne doit être affiché comme disponible.

`data/production-naming-reviews.json` reste le registre de reviews des stimuli actifs. Après la première vague en cours, `mer`, `corps`, `chat`, `eau` et `pie` rejoignent `pluie`, `clé`, `sol` et `tour` comme reviews révisionnées prêtes à collecter de vraies observations. Ce statut ne constitue ni une observation humaine ni une validation clinique.

Le protocole d’opérations générales n’invente aucun résultat : il définit seulement quoi présenter et quoi capturer. Préparer une UI de passation dédiée ou réutiliser une infrastructure existante si cela reste simple et sans confusion avec la dénomination d’images.

# 7. Statut recherche / décisions humaines

Ne pas fabriquer participants ou observations ; ne pas déclarer `clinical_approved` automatiquement ; ne pas promouvoir `visual_cue_defined` vers `comprehension_tested` sans observations humaines réelles ; ne pas promouvoir `comprehension_tested` vers `authorized_general` sans décision produit humaine explicite.

Pour les opérations générales, le minimum planifié est 3 participants distincts anonymes, avec réponse spontanée verbatim, hésitation, absence de réponse et mauvaise lecture. Ce seuil ouvre une revue humaine ; il ne constitue pas à lui seul une autorisation.

Pour la dénomination visuelle, toute observation doit rester attachée à la révision exacte du stimulus. Une ancienne observation ne se transfère pas silencieusement à un dessin modifié.

# 8. Direction immédiate

1. Finaliser les reviews révisionnées des pictogrammes actifs dont la provenance et la révision sont désormais connues, par petits paquets à faible risque, sans modifier leurs dessins.
2. Utiliser `naming-test.html` pour les vraies passations seulement ; ne produire aucun faux résultat et conserver les registres d’observations vides tant qu’aucune passation réelle n’a eu lieu.
3. `heure /œʁ/` est techniquement prêt : le prochain pas est une vraie dénomination humaine des deux scènes, pas une nouvelle génération d’image.
4. Préparer techniquement la passation de compréhension des 10 opérations générales actuellement `visual_cue_defined`; ne promouvoir aucune opération sans observation et revue humaines.
5. Continuer le blocage propre de `IN/UN` jusqu’à disposer d’un alignement graphème↔phonème fiable ; ne pas bricoler une heuristique orthographique.
6. Une fois les reviews de production préparées, régénérer/recalculer les rapports de readiness et la couverture utile afin de distinguer clairement : assets présents, gates humains, opérations non autorisées et véritables absences de représentation.

# 9. Garde-fous

Ne pas inventer participants ou observations ; ne pas déclarer `clinical_approved` automatiquement ; ne pas affaiblir Exact ; ne pas réintroduire de lecture partielle cachée ; ne pas recopier des illustrations protégées ; ne pas réactiver silencieusement les prototypes ; ne pas confondre attestation dans un rébus, reconnaissance spontanée d’une image, compréhension d’une opération générale et validation clinique.

Lorsqu’un exemple échoue, chercher d’abord si l’absence de solution est correcte, si la donnée est incomplète/incorrecte ou si une opération générique explicite manque. Ne jamais ajouter une exception phonétique pour sauver un mot particulier.

# 10. Discipline de handoff

À chaque paquet important fusionné : mettre à jour ce fichier dans la même PR ou dans le paquet immédiatement suivant avec : état produit réel, invariants touchés, nouveaux fichiers canoniques, tests sentinelles, décisions encore humaines et prochain gate. Éviter de créer de nouveaux documents si ce handoff, `PROGRESSION.md`, `PRODUCT_PRINCIPLES.md`, `GUARANTEE_MODEL.md` ou `LEXICAL_PIPELINE.md` peuvent porter l’information.

# 11. Résumé de reprise

**Vérifier `main`, lire les principes et ce handoff, choisir la zone via le chemin rapide, travailler par petit lot, lancer FAST puis TARGETED/FULL selon le risque, et préserver strictement la séparation entre exactitude phonétique, qualité visuelle, compréhension des opérations générales et validation humaine/clinique.**

État de reprise après les paquets visuels récents : **les deux scènes `heure` existent et attendent une vraie passation ; la provenance des principaux assets historiquement “undocumented” est réparée ; la priorité technique est de terminer les reviews révisionnées des assets de production et de préparer les gates humains, pas de redessiner des candidats déjà rejetés.**
