# REBULO — PASSATION ACTIVE / POINT D’ENTRÉE UNIQUE

**Dernière mise à jour : 2 septembre 2026, après fusion de la PR #48 et rafraîchissement automatique des analyses.**

Ce fichier est le **point d’entrée prioritaire et unique pour toute nouvelle conversation chargée de continuer Rebulo**.

## Phrase exacte à donner dans une nouvelle conversation

> **Continue Rebulo. Lis intégralement `docs/PROJECT_HANDOFF_2026-09-01.md`, vérifie le HEAD actuel de `main`, puis reprends exactement à la prochaine brique recommandée dans cette passation. Avance de façon autonome avec une branche dédiée, tests, PR, CI verte et fusion, sans retirer de fonctionnalité existante.**

C’est normalement tout ce que l’utilisateur doit avoir à écrire.

La nouvelle conversation doit ensuite :
1. lire ce fichier intégralement ;
2. vérifier le HEAD réel de `main` avant toute écriture ;
3. ouvrir seulement les fichiers cités ici qui sont nécessaires à la brique choisie ;
4. ne pas repartir de zéro ni redéfinir le produit ;
5. travailler en une ou deux briques cohérentes maximum ;
6. créer une branche **avant toute écriture** ;
7. préserver toutes les fonctions existantes lorsqu’il s’agit d’un ajout ;
8. lancer les tests pertinents, vérifier la CI, ouvrir une PR et fusionner seulement si l’état est propre ;
9. ne jamais fabriquer de validation clinique, de résultats de participants ou de statut `clinical_approved`.

---

# 1. Vision produit à préserver absolument

Rebulo est d’abord un **créateur de rébus riche, ludique et intelligent**, proche dans l’esprit des rébus de magazines/Mickey : l’utilisateur tape quelque chose et Rebulo produit un rébus jouable.

L’orthophonie est un **usage exigeant du même moteur**, pas un remplacement de l’ambition générale. Ne pas transformer Rebulo en « application d’orthophonie avec quelques rébus ».

Formulation de référence :

> **Rebulo doit être un créateur de rébus général riche et ludique. Sa rigueur linguistique permet des usages pédagogiques et orthophoniques fiables.**

Architecture conceptuelle :
- moteur de rébus général ;
- création libre/ludique ;
- constructions rigoureuses ;
- filtres et outils orthophoniques quand nécessaire.

Le parcours historique **`Écris un mot → Créer le rébus`** reste central.

---

# 2. Principe phonétique strict

Le mode strict conserve une promesse forte :

**IMAGE ENTIÈRE → MOT CONVENTIONNEL ENTIER → PRONONCIATION ENTIÈRE.**

Une décomposition stricte est valide uniquement si la concaténation exacte des prononciations entières correspond à l’IPA cible.

Interdits en strict :
- suppression arbitraire ;
- consonne muette ressuscitée ;
- liaison inventée ;
- lecture partielle cachée d’un pictogramme ;
- approximation orthographique ;
- assouplissement pour augmenter artificiellement la couverture.

Valides :
- `mer + scie → merci` ;
- `scie + nez + mât → cinéma` ;
- `pas + rat + pluie → parapluie` ;
- `pas + rat + sol → parasol`.

Refus stricts importants :
- `riz + bus → rébus` ;
- `tour + nez + sol → tournesol` ;
- `pie + rat + mie + dé → pyramide` ;
- `main + taux → manteau`.

**« Aucune solution exacte » est préférable à un faux rébus.**

Le badge `✓ Exact` est une promesse produit : Rebulo ne triche pas avec les sons.

---

# 3. Opérations générales explicites déjà modélisées

Le strict n’est pas une prison : un rébus classique peut utiliser des opérations non strictes à condition qu’elles soient **explicites, visibles et modélisées**.

`src/rebus-construction.js` définit notamment :
- `whole_word` ;
- `grapheme` ;
- `spatial_relation` ;
- `explicit_deletion` ;
- `explicit_substitution` ;
- `repetition`.

État actuel :
- `whole_word` : implémenté, compatible strict ;
- `grapheme` : implémenté, général seulement ;
- `spatial_relation` : implémenté, général seulement ;
- suppression, substitution, répétition : encore non implémentées.

Relation spatiale contrôlée actuelle :
- `under → sous → /su/`.

Exemples généraux :
- `cité = scie + T` ;
- `souris = sous + riz`.

Ne pas présenter ces constructions comme `phonetic_strict`.

---

# 4. État technique courant

Dépôt : `ludodulac/Rebulo`

Branche de référence : `main`.

HEAD observé au moment de cette mise à jour :

`b19866ab292ac62567fb143b3b9afaf8cfdb21d8`

Ce commit est un rafraîchissement automatique des analyses, enfant de la fusion PR #48. **Toujours re-vérifier `main` au début d’une nouvelle conversation.**

PRs structurantes récentes déjà fusionnées :
- #36 : clarification des couches produit général / strict / clinique ;
- #37 : modèle explicite des capacités de construction ;
- #38 : opération `grapheme` ;
- #39 : premier pilote mixte `cité = scie + T` ;
- #40 : génération automatique image + lettre à partir des gaps du rapport ;
- #41 : mesure du gain grapheme ;
- #42 : premier pilote spatial `souris` ;
- #43 : classement automatique des candidats au démarrage ;
- #44 : conservation des alternatives classées et bouton `↻ Autre rébus` conditionnel ;
- #45 : génération automatique de la relation spatiale `sous` ;
- #46 : classement des candidats d’expansion de pictogrammes ;
- #47 : enregistrement de `pot` et `dos` comme prototypes inactifs ;
- #48 : simulation de leur impact strict réel.

---

# 5. Créateur automatique actuel

Le créateur n’est plus uniquement une liste de cas manuels.

Au chargement, Rebulo combine :
- corpus manuel, qui reste autoritaire ;
- cibles strictes générées depuis `data/coverage-report.json` ;
- cibles générales image + lettre ;
- cibles générales utilisant la relation `sous` quand elles sont rendables.

Règles de classement :
- strict prioritaire sur général ;
- constructions plus courtes préférées ;
- fréquence utilisée en départage ;
- décisions manuelles prioritaires ;
- refus manuel jamais contourné par un candidat automatique.

Le runtime peut conserver plusieurs alternatives. Le bouton `↻ Autre rébus` n’est visible que si plusieurs constructions distinctes et rendables existent.

À la dernière mesure, le corpus réel ne produisait encore aucune paire d’alternatives automatiques distinctes pour un même mot ; l’infrastructure est néanmoins prête.

Exemple automatique testé de bout en bout :
- `raté = rat + T`.

Exemples spatiaux automatiques :
- `souci = sous + scie` ;
- `souris = sous + riz` ;
- `sous-sol = sous + sol`.

Les constructions générales restent actuellement hors orthophonie, séance et PDF unitaire.

---

# 6. Couverture actuelle et enseignements

Base strict actuelle :
- 189 832 entrées analysées ;
- 16 pictogrammes actifs ;
- 452 entrées strictement constructibles ;
- 376 formes orthographiques uniques strictement constructibles ;
- 339 entrées en vrais rébus de 2+ pièces ;
- 291 mots uniques en vrais rébus de 2+ pièces.

Le grapheme exact a ajouté :
- +88 formes orthographiques générales ;
- soit +30,24 % par rapport aux 291 vrais rébus stricts uniques ;
- 73 constructions à seulement 2 opérations ;
- répartition préfixe/suffixe presque équilibrée.

Ne pas interpréter ces 88 formes comme 88 concepts distincts.

Leçon produit : les opérations explicites ont un rendement élevé ; il ne faut pas uniquement essayer d’ajouter des centaines d’images au hasard.

---

# 7. Bibliothèque de pictogrammes : modèle à trois niveaux

Ne pas exiger une validation clinique avant qu’une image puisse exister pour le jeu général.

Modèle cible :
1. **illustration générale** ;
2. **concept phonétique structuré** ;
3. **concept cliniquement revu**.

Une image peut progresser d’un niveau au suivant.

`active:true` ne signifie pas automatiquement `clinical_approved`.

Banque active actuelle : 16 pictogrammes.

Prototypes inactifs importants :
- `thé /te/` : `naming_test_required` ;
- `eau /o/` : `naming_test_required` ;
- `pot /po/` : `active:false`, `prototypeStatus:"asset_available"`, asset OpenMoji `1FAB4` disponible mais dénomination ambiguë ;
- `dos /do/` : `active:false`, `prototypeStatus:"asset_pending"`, aucun asset suffisamment spécifique retenu.

Pour `pot`, risque : image possiblement nommée « plante », « plante en pot » ou « pot de fleurs » plutôt que « pot ».

Pour `dos`, risque : silhouette possiblement nommée « personne », « homme », « femme », « derrière », etc.

Ne jamais inventer de résultats de test de dénomination pour débloquer un prototype.

---

# 8. Pipeline d’expansion des pictogrammes

`src/pictogram-expansion.js`, `data/pictogram-expansion-shortlist.json`, `docs/PICTOGRAM_EXPANSION.md` et les rapports associés séparent désormais :
- opportunité phonétique ;
- candidat pictogramme ;
- prototype de recherche ;
- asset disponible ou en attente ;
- activation éventuelle plus tard.

Shortlist de recherche initiale :
- `tas /ta/` ;
- `raie /ʁɛ/` ;
- `terre /tɛʁ/` ;
- `pot /po/` ;
- `dos /do/`.

Le classement brut peut produire des artefacts lexicaux (`t`, `cé`, abréviations, formes ponctuées). Ne pas convertir automatiquement un bon score phonétique en concept illustré.

---

# 9. Résultat décisif de la PR #48 : simulation `pot` / `dos`

La simulation utilise le Lexique 4 complet et ajoute les prototypes **virtuellement**, sans les activer.

Résultats isolés :

## `pot /po/`
- +27 vrais rébus stricts uniques de 2+ pièces ;
- +33 formes strictement constructibles ;
- exemples :
  - `chapeau = chat + pot` ;
  - `dépôt = dé + pot` ;
  - `poli = pot + lit` ;
  - `pipeau = pie + pot`.

## `dos /do/`
- +23 vrais rébus stricts uniques de 2+ pièces ;
- +25 formes strictement constructibles ;
- exemples :
  - `donner = dos + nez` ;
  - `donné = dos + nez` ;
  - `rideau = riz + dos` ;
  - `dodo = dos + dos` ;
  - `dominer = dos + mie + nez`.

## `pot + dos`
- +50 vrais rébus stricts uniques ;
- +58 formes constructibles.

Conclusion : leurs gains sont pratiquement complémentaires. `pot` reste prioritaire opérationnellement car son asset existe déjà ; `dos` demande d’abord un meilleur visuel.

Le rapport complet est dans :
- `data/expansion-simulation.json` ;
- `docs/EXPANSION_SIMULATION.md`.

---

# 10. Prochaine brique recommandée

**Faire progresser `pot` vers une activation générale contrôlée, sans l’activer automatiquement.**

Objectif : traiter le problème de dénomination du visuel de `pot` parce que son rendement réel est désormais démontré (+27 vrais rébus stricts).

Approche recommandée :
1. inspecter le protocole existant de dénomination ;
2. vérifier si le projet possède déjà une mécanique de comparaison/itération de prototypes visuels ;
3. améliorer ou proposer un visuel de `pot` qui minimise la lecture « plante » ;
4. garder `active:false` tant qu’aucune décision humaine/validation requise n’est disponible ;
5. si un meilleur asset peut être sourcé ou créé comme prototype général sans prétention clinique, l’intégrer avec provenance et statut explicite ;
6. tester qu’aucun pictogramme existant, parcours strict, général, séance ou PDF n’est retiré ou rendu moins accessible.

Ne pas passer directement à `active:true` seulement parce que la simulation est bonne.

Si cette brique bloque sur une décision humaine réelle, le plan B technique utile est de rendre le pipeline de comparaison de prototypes de dénomination plus structuré, sans fabriquer de données participante.

---

# 11. Orthophonie : position et limites actuelles

L’orthophonie est un profil exigeant du moteur général.

Ne pas implémenter mécaniquement toutes les activités déclarées dans `data/therapy-targets.json` simplement parce qu’elles existent.

Activités actuellement implémentées connues :
- denomination ;
- lexical-access ;
- phoneme-initial ;
- phoneme-final ;
- phoneme-segmentation ;
- phoneme-blending ;
- syllable-count ;
- syllable-blending ;
- oral-to-written.

Attention : ne jamais compter les pièces du rébus pour déduire naïvement des syllabes orales.

À laisser pour plus tard sauf besoin produit clair :
- rhyme-judgment ;
- rhyme-matching ;
- phoneme-deletion ;
- phoneme-substitution ;
- minimal-pairs ;
- phrase mode.

Suppression/substitution nécessitent des opérations explicites et visibles.

---

# 12. UX doctrine

Objectif : **la profondeur d’un logiciel professionnel, avec la manipulabilité d’un jeu pour enfant**.

Repères :
- une scène principale ;
- rébus central ;
- une action dominante par état ;
- navigation stable ;
- gros contrôles tactiles ;
- détails avancés en panneaux temporaires ;
- IPA, licences, provenance et données cliniques cachées tant qu’elles ne sont pas utiles ;
- feedback calme ;
- pas de mascottes/confettis pour fabriquer artificiellement du « ludique » ;
- le plaisir vient de la manipulation : toucher, écouter, déplacer, révéler, choisir, réordonner.

Une nouvelle fonction ne mérite pas automatiquement un nouveau bouton permanent.

Le mode enfant doit tendre vers une vraie présentation patient, très simple.

---

# 13. Fonctions existantes à ne pas casser

Le projet possède déjà notamment :
- créateur mot → rébus ;
- strict automatique ;
- général image + lettre ;
- relation spatiale `sous` ;
- alternatives classées ;
- mode enfant/pro ;
- activités orthophoniques implémentées ;
- file de séance ;
- export PDF enfant/pro ;
- layouts PDF 1/2/4 ;
- ordre professionnel ;
- audit d’assets ;
- états de refus/absence ;
- corpus manuel prioritaire.

**Quand la demande est un ajout, ne supprimer aucune fonction existante. Toujours vérifier explicitement ce point avant fusion.**

---

# 14. Fichiers à lire avant de coder selon la brique

Toujours lire d’abord :
- `docs/PRODUCT_PRINCIPLES.md` ;
- ce fichier de passation ;
- `README.md` si la décision touche la définition publique du produit.

Pour le moteur général :
- `src/rebus-construction.js` ;
- `src/creator-catalog.js` ;
- `src/creator-runtime.js` ;
- `src/app-bootstrap.js` ;
- `app.js`.

Pour la couverture/expansion :
- `scripts/analyze-coverage.mjs` ;
- `scripts/simulate-expansion.mjs` ;
- `src/pictogram-expansion.js` ;
- `data/coverage-report.json` ;
- `data/expansion-simulation.json` ;
- `data/pictogram-expansion-shortlist.json` ;
- `docs/PICTOGRAM_EXPANSION.md` ;
- `docs/EXPANSION_SIMULATION.md`.

Pour `pot` / `dos` et validation visuelle :
- `data/lexicon-seed.json` ;
- `data/asset-sources.json` ;
- `docs/PICTOGRAM_NAMING_TEST_PROTOCOL.md` ;
- `docs/PICTOGRAM_VALIDATION_LOG.md` ;
- `data/pictogram-naming-tests.schema.json` ;
- `data/pictogram-naming-tests.json`.

Pour orthophonie :
- `docs/ORTHOPHONIE_RESEARCH.md` ;
- `data/therapy-targets.json` ;
- `src/therapy-activities.js`.

Pour séance/PDF :
- `src/session-plan.js` ;
- `src/pdf-export.js` ;
- tests associés.

---

# 15. Méthode de développement attendue

Pour chaque brique :

1. vérifier HEAD de `main` ;
2. créer une branche dédiée **avant toute écriture** ;
3. faire une modification ciblée ;
4. ajouter/mettre à jour les tests ;
5. vérifier syntaxe et tests produit ;
6. vérifier CI ;
7. ouvrir une PR ;
8. vérifier `mergeable:true` ;
9. fusionner avec le HEAD attendu ;
10. vérifier le nouveau `main` ;
11. rapporter brièvement ce qui a été fait et la prochaine brique logique.

Éviter les gros refactorings opportunistes, les réécritures visuelles globales et les reformatages massifs sans nécessité.

Le workflow de couverture peut pousser automatiquement un commit d’analyse sur `main` après certaines fusions ; toujours re-vérifier `main` après la fusion.

---

# 16. Questions de garde-fou avant une PR

Avant fusion, vérifier :
1. Cela aide-t-il concrètement la création/résolution ou un usage professionnel réel ?
2. La rigueur est-elle explicite et testable ?
3. La complexité reste-t-elle cachée jusqu’à ce qu’elle soit utile ?
4. Les données cliniques sont-elles distinguées des données générales ?
5. L’écran principal reste-t-il au moins aussi simple ?
6. Une fonction existante a-t-elle été supprimée ou rendue moins accessible sans décision explicite ?

Si la réponse à 6 est oui, ne pas fusionner comme simple « ajout ».

---

# 17. Résumé de reprise en une phrase

**Reprendre Rebulo comme un créateur général de rébus, préserver la garantie stricte, continuer à rendre l’intelligence du moteur invisible, et attaquer maintenant la maturation contrôlée du prototype `pot` parce que son rendement réel (+27 vrais rébus stricts) est démontré sans encore justifier son activation.**
