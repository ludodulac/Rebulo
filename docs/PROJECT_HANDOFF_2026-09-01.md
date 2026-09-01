# REBULO — PASSATION ACTIVE / POINT D’ENTRÉE UNIQUE

**Dernière mise à jour : 1er septembre 2026, après fusion de la PR #24.**

Ce fichier est le **point d’entrée prioritaire pour toute nouvelle conversation chargée de continuer Rebulo**.

## Instruction de reprise pour la prochaine conversation

Si l’utilisateur dit de continuer Rebulo, commencer par lire **ce fichier intégralement**, puis vérifier l’état courant de `main` avant toute modification. Ensuite seulement, ouvrir les fichiers cités dans la section « Fichiers à lire avant de coder » selon la brique choisie.

Ne pas repartir de zéro, ne pas réinventer le produit et ne pas déduire qu’un objectif clinique est implémenté simplement parce qu’il existe dans `data/therapy-targets.json`.

La méthode de travail attendue est : **une ou deux briques cohérentes maximum → branche dédiée → modifications ciblées → tests → PR → CI verte → fusion dans `main` → compte rendu court**.

L’utilisateur souhaite que le chantier avance de manière autonome tant qu’aucune décision produit ou validation humaine réelle n’est nécessaire. Éviter de demander confirmation pour chaque étape technique normale. En revanche, ne jamais fabriquer une validation clinique, une donnée de participant ou une décision qui nécessite un orthophoniste.

---

# 1. Définition du produit

Rebulo est d’abord un **outil de création de matériel pour orthophonistes**, utilisable sur smartphone et pensé pour rester manipulable par un enfant, un lecteur fragile ou une personne avec déficience intellectuelle.

Le rébus phonétiquement strict est son mécanisme différenciant.

Parcours V1 prioritaire :

`Écris un mot → Créer le rébus → cartes illustrées → activité → séance → impression / téléchargement`

Doctrine centrale : **la profondeur d’un logiciel professionnel avec la manipulabilité d’un jeu pour enfant**.

L’interface ne doit pas demander à l’utilisateur de comprendre le moteur scientifique. La complexité appartient au moteur ; l’écran principal reste simple, tactile, stable et calme.

---

# 2. Règle phonétique absolue

**IMAGE ENTIÈRE → MOT CONVENTIONNEL ENTIER → PRONONCIATION ENTIÈRE.**

Une décomposition stricte est valide uniquement lorsque la concaténation des prononciations entières des concepts illustrés est exactement égale à l’IPA cible.

Interdits :
- suppression arbitraire d’un son ;
- consonne muette « ressuscitée » ;
- liaison inventée ;
- lecture partielle cachée d’un pictogramme ;
- approximation orthographique ;
- assouplissement de la règle pour augmenter artificiellement la couverture.

Valides :
- `mer /mɛʁ/ + scie /si/ → merci /mɛʁsi/` ;
- `chat /ʃa/ + taux /to/ → château /ʃato/` ;
- `riz /ʁi/ + dos /do/ → rideau /ʁido/`.

Invalides :
- `riz + bus → rébus` ;
- `chat + eau → château` ;
- `rat + dé + eau → radeau` ;
- `tour + nez + sol → tournesol` ;
- `pie + rat + mie + dé → pyramide` ;
- `main + taux → manteau`.

**« Aucune solution exacte » est un résultat normal et préférable à un faux rébus.**

---

# 3. Doctrine UX à préserver

La structure s’inspire de la lisibilité spatiale et tactile de jeux mobiles comme Clash Royale, **sans copier leur identité graphique ni leurs mécanismes de stimulation**.

Principes :
1. Une seule scène principale, pas une longue page web.
2. Une action dominante par état.
3. Le rébus reste visuellement central.
4. Géographie stable : état/création en haut, contenu au centre, actions/navigation en bas.
5. Gros boutons, cibles tactiles séparées, libellés courts.
6. Image avant métadonnées ; action avant explication ; reconnaissance avant mémorisation.
7. IPA, provenance, options PDF et informations professionnelles via divulgation progressive.
8. Toucher d’abord, souris ensuite.
9. Feedback immédiat mais calme.
10. Aucun état critique ne dépend uniquement de la couleur.
11. Une nouvelle fonction ne reçoit **pas automatiquement** un nouveau bouton sur l’accueil.
12. Préserver les emplacements appris et les fonctions existantes sauf décision explicite.

Avant une évolution visible, vérifier qu’elle n’augmente pas inutilement la charge cognitive.

---

# 4. État technique courant au moment de cette passation

Dépôt : `ludodulac/Rebulo`

Branche de référence : `main`

Commit de référence après PR #24 :

`18c5d98ec07ebe4bfd75341821c5c644b769359f`

PR #24 : **Add computed phoneme segmentation activity**.

Le commit de référence n’est pas une permission de travailler sur un état ancien : **toujours vérifier le HEAD de `main` au début d’une nouvelle conversation**.

Le créateur charge le corpus manuel puis lui ajoute les cibles strictes générées depuis `data/coverage-report.json` via `src/app-bootstrap.js` et `src/creator-catalog.js`. Les entrées manuelles restent prioritaires : une entrée manuelle refusée ou particulière ne doit pas être écrasée par une génération automatique portant le même mot.

Le moteur strict principal est `src/phonetic-engine.js`.

Fonctions importantes actuellement disponibles :
- `normalizeIPA()` ;
- `splitIPAUnits()` ;
- `firstIPAUnit()` ;
- `lastIPAUnit()` ;
- `concatenateIPA()` ;
- `validateStrictRebus()` ;
- `validateLabelPolicy()` ;
- `validateClinicalCandidate()` ;
- `segmentTargetWithLexicon()` ;
- classement déterministe des décompositions.

`splitIPAUnits()` a été ajouté pour ne pas traiter naïvement l’IPA caractère par caractère : les marques combinantes restent attachées à leur unité. Exemple testé : `/ɛ̃fɑ̃/` doit être manipulé comme `/ɛ̃/ + /f/ + /ɑ̃/`, pas comme des caractères indépendants.

Attention : cette primitive regroupe les caractères Unicode et leurs diacritiques. Ne lui attribuer aucune capacité linguistique supplémentaire sans tests et justification.

---

# 5. Objectifs orthophoniques : spécifiés ≠ implémentés

`data/therapy-targets.json` définit actuellement 16 objectifs :

1. `denomination`
2. `syllable-count`
3. `syllable-identification`
4. `syllable-segmentation`
5. `syllable-blending`
6. `rhyme-judgment`
7. `rhyme-matching`
8. `phoneme-initial`
9. `phoneme-final`
10. `phoneme-segmentation`
11. `phoneme-blending`
12. `phoneme-deletion`
13. `phoneme-substitution`
14. `minimal-pairs`
15. `oral-to-written`
16. `lexical-access`

Au commit de référence, **7 activités seulement sont réellement implémentées dans `src/therapy-activities.js`** :

- `denomination` ;
- `lexical-access` ;
- `phoneme-initial` ;
- `phoneme-final` ;
- `phoneme-segmentation` ;
- `syllable-blending` ;
- `oral-to-written`.

Ne jamais annoncer les 16 comme fonctionnelles.

Les cibles strictes générées par `src/creator-catalog.js` exposent actuellement ces 7 activités.

## Activités récemment ajoutées

### Dénomination — PR #20
Consigne enfant : nommer chaque image.

Consigne pro : dénomination spontanée, **sans indice phonémique**, avec relevé des réponses concurrentes.

### Accès lexical — PR #21
Distinct de la simple dénomination : retrouver le mot à partir du pictogramme sans fournir le label ; laisser un temps de recherche et relever les aides nécessaires.

### Phonème initial — PR #22
Calculé depuis `targetIpa`, jamais depuis l’orthographe. La réponse attendue utilise `firstIPAUnit()`.

### Phonème final — PR #23
Même principe, avec `lastIPAUnit()`.

### Segmentation phonémique — PR #24
Calculée depuis `targetIpa` avec `splitIPAUnits()`. Exemple : `merci /mɛʁsi/ → /m/ + /ɛ/ + /ʁ/ + /s/ + /i/`.

La consigne professionnelle doit rester sans appui orthographique.

---

# 6. Ce qu’il ne faut surtout pas faire pour les prochaines activités

## Syllabes

Ne pas confondre **pièces du rébus** et **syllabes orales**. Une pièce est un mot/concept entier et peut elle-même contenir plusieurs phonèmes ou syllabes.

Donc ne pas implémenter `syllable-count`, `syllable-identification` ou `syllable-segmentation` en comptant simplement `parts.length`.

Avant d’implémenter ces objectifs, rechercher si les données importées contiennent une syllabification orale exploitable et correctement documentée. Sinon, commencer par une brique de données/spécification plutôt que fabriquer un algorithme approximatif.

## Manipulations phonémiques

Ne pas activer `phoneme-deletion` ou `phoneme-substitution` avec une opération implicite ou inventée. Ces activités nécessitent une opération explicitement définie et une réponse attendue contrôlable.

## Rimes et paires minimales

Ne pas exposer `rhyme-judgment`, `rhyme-matching` ou `minimal-pairs` simplement parce qu’un seul mot cible possède une IPA. Ces activités demandent au moins une relation entre plusieurs formes et une définition opérationnelle claire.

## Phrase / sentence mode

Le niveau phrase n’est pas encore formellement spécifié dans le dépôt.

Ne pas le coder silencieusement comme une concaténation naïve de mots. Une future spécification devra notamment décider : tokenisation, ponctuation, mots sans solution, mots fonctionnels, sélection des mots illustrés, comportement aux frontières de mots et éventuelles liaisons. La règle stricte reste prioritaire.

---

# 7. Pictogrammes, validation et provenance

Une image n’est pas considérée comme cliniquement validée simplement parce qu’elle est active dans le prototype.

Lire :
- `docs/PICTOGRAM_NAMING_TEST_PROTOCOL.md`
- `docs/PICTOGRAM_VALIDATION_LOG.md`
- `data/asset-sources.json`
- `data/lexicon-seed.json`

Principe : **le rendement lexical ne prime jamais sur la dénomination.**

Statuts utilisés :
- `prototype_priority` ;
- `naming_test_required` ;
- `no_suitable_asset` ;
- `clinical_reviewed` ;
- `clinical_approved`.

`clinical_approved` ne doit jamais être inféré automatiquement d’un score.

Pictogrammes ajoutés récemment et actifs comme prototypes :
- `lit /li/` ;
- `riz /ʁi/` ;
- `chat /ʃa/` ;
- `clé /kle/`.

`thé /te/` et `eau /o/` restent inactifs / `naming_test_required`.

`dos` a été identifié comme `no_suitable_asset` dans le travail de validation existant.

Ne jamais inventer de résultats de participants pour faire progresser un statut clinique.

---

# 8. Protocole de dénomination des pictogrammes

Le protocole formalisé dans `docs/PICTOGRAM_NAMING_TEST_PROTOCOL.md` impose notamment :
- pictogramme présenté seul ;
- question simple « Qu’est-ce que c’est ? » ;
- première réponse spontanée enregistrée verbatim ;
- aucun premier son, choix multiple ou correction avant l’enregistrement de la première réponse ;
- hésitations, absences de réponse et réponses concurrentes conservées ;
- populations susceptibles de différer testées séparément.

Une prochaine brique sérieuse possible est de créer un **schéma structuré de résultats de tests de dénomination**, sans aucune donnée participante fabriquée, afin de rendre les statuts de validation traçables.

---

# 9. Couverture phonétique et banque active

Au dernier état de couverture explicitement relevé avant les activités phonologiques récentes :
- 16 pictogrammes actifs ;
- 452 entrées strictement constructibles ;
- 376 mots uniques strictement constructibles ;
- 339 entrées en vrais rébus de 2 pièces ou plus ;
- 291 mots uniques en vrais rébus de 2 pièces ou plus.

Ces chiffres peuvent être dépassés par un futur run de couverture : **vérifier `data/coverage-report.json` et `docs/COVERAGE_ANALYSIS.md` avant de les citer comme état actuel**.

Le dernier ajout lexical important était `clé /kle/` via OpenMoji KEY `1F511`, actif en `prototype_priority`. Il avait fait passer les mots uniques strictement constructibles de 358 à 376 et les vrais rébus uniques de 278 à 291.

Ne pas choisir un nouveau pictogramme uniquement parce qu’un son est rentable. La stabilité de dénomination et la clarté visuelle passent avant le rendement lexical.

---

# 10. Corpus manuel : garde-fous importants

`data/corpus-pilot.json` contient à la fois des cas stricts, refusés et particuliers.

Exemples stricts : `merci`, `cinéma`, `parapluie`, `parasol`, ainsi que plusieurs candidats dont les assets restent manquants.

Refus importants à préserver :
- `parade` : la proposition avec `dé /de/` ajoute une voyelle ;
- `manteau` : `main /mɛ̃/` ne correspond pas à `/mɑ̃/` ;
- `tournesol` ;
- `pyramide` ;
- `rébus`.

Cas particulier :
- `souris /suʁi/` est marqué `explicit_operation` avec `sous + riz` ; `sous` doit être représenté par une relation spatiale explicite, pas par un pictogramme ambigu. Ne pas le convertir automatiquement en cible stricte ordinaire.

Les entrées manuelles restent autoritaires face au catalogue généré.

---

# 11. PDF et séances

Le projet possède déjà :
- export PDF enfant/pro ;
- séries de rébus ;
- layouts 1/2/4 ;
- plan de séance ;
- ordre contrôlé par le professionnel ;
- même cible autorisée avec plusieurs activités ;
- file de séance limitée dans l’interface actuelle.

Fichiers principaux :
- `src/pdf-export.js`
- `src/session-plan.js`
- tests associés.

Ne pas casser ces fonctions en travaillant sur les activités.

La vérification automatique de la génération existe, mais ne prétendre à une validation visuelle complète des PDF sans inspection réelle du rendu.

---

# 12. Interface actuelle et dette UX connue

Le produit est déjà structuré en scène principale avec :
- barre de création en haut ;
- arène/rébus au centre ;
- modes `Enfant` / `Pro` ;
- actions et séance vers le bas ;
- navigation basse stable ;
- panneaux temporaires pour fonctions secondaires.

Petites dettes connues, à traiter séparément et sans gros refactor :
- le message d’échec pour une cible absente peut encore parler de « corpus pilote », alors que le créateur est désormais alimenté aussi par le catalogue généré ;
- du markup historique lié au panneau « Créer » peut être devenu redondant ;
- la redondance entre séance et navigation mérite une revue ultérieure ;
- les options doivent rester simples ;
- vérifier visuellement l’arène mobile après les évolutions importantes.

Une correction sûre et petite du message obsolète pourrait être : **« Aucun rébus exact disponible pour ce mot. »**

Ne pas traiter toutes ces dettes dans une seule PR.

---

# 13. Tests et CI

Workflow produit : `.github/workflows/tests.yml`.

Il utilise Node 22 et exécute notamment :
- `node --check app.js` ;
- `npm test` ;
- vérification de la dépendance navigateur jsPDF.

La chaîne `npm test` couvre actuellement le moteur phonétique, l’import Lexique, le PDF, les activités, les séances, l’audit des assets et le catalogue créateur.

La PR #24 a passé la CI avant fusion.

Ne fusionner une nouvelle brique fonctionnelle qu’après CI verte, sauf raison explicite et documentée.

Le workflow de couverture a déjà connu une course lors d’un push généré sur `main`. Il a été renforcé pour `fetch` + `rebase origin/main` avant son push automatique. Ne pas retirer ce garde-fou sans raison.

---

# 14. Historique récent utile

Les PR suivantes sont particulièrement importantes pour comprendre l’état actuel :

- #16 — connexion du catalogue strict généré au créateur ;
- #17 — simplification du langage visible (`Rébus créé.`, `Enfant`, `Pro`) ;
- #18 — ajout du pictogramme `clé /kle/` ;
- #19 — protocole compact de test de dénomination ;
- #20 — dénomination comme activité de première classe ;
- #21 — accès lexical ;
- #22 — phonème initial + primitive IPA ;
- #23 — phonème final ;
- #24 — segmentation phonémique calculée.

Historique UX antérieur :
- #5 interface accessible simplifiée ;
- #7 structure une-page de type application/jeu ;
- #8 doctrine UX ;
- #10 focus visuel de l’arène ;
- #11 feedback tactile calme ;
- #12 et #13 durcissement mobile ;
- #15 navigation directe « Créer ».

Il n’est généralement pas nécessaire de relire toutes ces PR : utiliser ce fichier comme synthèse, puis inspecter uniquement les fichiers/PR directement concernés par la prochaine brique.

---

# 15. Fichiers à lire avant de coder

Toujours commencer par ce fichier, puis sélectionner le minimum nécessaire :

## Pour une activité orthophonique
1. `data/therapy-targets.json`
2. `src/therapy-activities.js`
3. `src/phonetic-engine.js` si calcul phonologique
4. `src/creator-catalog.js`
5. `data/corpus-pilot.json`
6. `tests/therapy-activities.test.mjs`
7. `tests/creator-catalog.test.mjs`

## Pour un pictogramme / expansion lexicale
1. `data/lexicon-seed.json`
2. `data/asset-sources.json`
3. `docs/PICTOGRAM_NAMING_TEST_PROTOCOL.md`
4. `docs/PICTOGRAM_VALIDATION_LOG.md`
5. `docs/COVERAGE_ANALYSIS.md`
6. `data/coverage-report.json`

## Pour l’interface
1. `index.html`
2. `app.js`
3. feuilles CSS concernées
4. `src/ui-feedback.js`
5. `src/mobile-viewport.js`
6. ce document pour la doctrine UX

## Pour PDF / séance
1. `src/pdf-export.js`
2. `src/session-plan.js`
3. tests correspondants

---

# 16. Prochaines briques recommandées

Ne pas exécuter toute cette liste en une seule fois. Choisir **une ou deux briques cohérentes**.

## Option A — très sûre : vérité produit + traçabilité clinique
1. Corriger le message obsolète « corpus pilote » en « Aucun rébus exact disponible pour ce mot. » ou formulation équivalente courte.
2. Ajouter un schéma/template structuré pour enregistrer de futurs tests de dénomination, **sans inventer aucun résultat**.

## Option B — poursuivre la phonologie
`phoneme-blending` est désormais techniquement proche de `phoneme-segmentation`, mais il faut définir précisément la présentation de la séquence et s’assurer que l’activité n’est pas simplement une duplication mal nommée. Si elle est implémentée, la séquence source doit venir de `targetIpa` / `splitIPAUnits()` et non de l’orthographe.

## Option C — syllabes, mais seulement après vérification des données
Inspecter les données Lexique/import pour voir si une syllabification orale fiable existe. Si oui, formaliser son transport dans les données et la tester avant d’exposer `syllable-count` ou `syllable-segmentation`. Si non, ne pas simuler la syllabification avec les pièces du rébus.

## À éviter comme prochaine action par défaut
- ajouter des pictogrammes au hasard ;
- activer suppression/substitution phonémique sans modèle d’opération explicite ;
- coder le mode phrase sans spécification ;
- exposer les 16 objectifs juste parce qu’ils sont déclarés ;
- inventer des seuils de validation clinique ;
- refondre toute l’interface en même temps qu’une activité clinique.

---

# 17. Manière de travailler avec l’utilisateur

Le rythme qui fonctionne : avancer sérieusement, mais par petites unités vérifiables.

L’utilisateur a explicitement demandé de pouvoir laisser l’assistant fusionner et continuer lorsque c’est nécessaire, puis a demandé de rester sur **une ou deux briques à la fois**. Il attend surtout que le logiciel reste conforme à ce qui est écrit dans le dépôt et qu’on ne transforme pas le chantier en expérimentation décorative.

Pendant une séquence de travail :
- annoncer brièvement la brique choisie et pourquoi ;
- inspecter les sources réelles avant de modifier ;
- signaler les garde-fous importants ;
- créer une branche dédiée ;
- tester ;
- ouvrir une PR ;
- attendre la CI ;
- fusionner si verte ;
- faire un compte rendu concis ;
- s’arrêter après la ou les briques annoncées.

Si une manipulation accidentelle touche `main`, la corriger immédiatement et la signaler. Ne pas cacher l’erreur.

---

# 18. Infrastructure et limites

GitHub Pages a été configuré pour le prototype public. Ne pas affirmer qu’une modification récente est effectivement déployée tant que le déploiement correspondant n’a pas été vérifié.

Des projets Supabase non-Rebulo existent historiquement. **Ne jamais toucher à un autre projet Supabase pour Rebulo.**

L’infrastructure n’est pas la priorité tant que le parcours produit/clinique principal n’est pas suffisamment consolidé.

---

# 19. Prompt minimal à donner dans une nouvelle conversation

L’utilisateur peut simplement écrire :

> **Continue Rebulo. Ouvre le dépôt GitHub `ludodulac/Rebulo`, lis intégralement `docs/PROJECT_HANDOFF_2026-09-01.md`, vérifie le HEAD actuel de `main`, puis reprends le chantier en respectant cette passation. Travaille par une ou deux briques, teste, fais une PR et fusionne seulement si la CI est verte.**

Cette phrase doit suffire à remettre une nouvelle conversation sur les rails. La nouvelle conversation doit considérer **le dépôt courant comme source de vérité** et ce document comme carte de reprise, puis vérifier les fichiers concernés avant toute modification.

---

# 20. Résumé impératif

Si une seule chose doit être retenue :

**Rebulo n’est pas un générateur de jeux de mots approximatifs. C’est un outil orthophonique de création de matériel fondé sur des rébus phonétiquement stricts, avec une interface extrêmement simple. Continuer en renforçant les capacités cliniques déjà spécifiées, une brique vérifiable à la fois, sans inventer de données, sans affaiblir la phonétique et sans alourdir l’écran principal.**
