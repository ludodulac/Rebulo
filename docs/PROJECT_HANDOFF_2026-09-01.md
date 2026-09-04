# REBULO — PASSATION ACTIVE / POINT D’ENTRÉE UNIQUE

**Dernière mise à jour : 4 septembre 2026, après fusion de la PR #106.**

Ce fichier est le point d’entrée prioritaire pour toute nouvelle conversation chargée de continuer Rebulo.

## Phrase de reprise

> **Continue Rebulo. Lis `docs/PROJECT_HANDOFF_2026-09-01.md`, vérifie le HEAD réel de `main`, puis reprends la prochaine brique utile avec une branche dédiée, tests, PR, CI verte, fusion et vérification Pages.**

Règles de travail : vérifier `main` avant toute écriture ; ne jamais écrire directement sur `main` ; préférer une brique cohérente à une vague de changements ; préserver toutes les fonctionnalités existantes ; ne jamais fabriquer de résultats humains, de validation clinique ou de statut `clinical_approved`.

---

# 1. Vision produit

Rebulo est d’abord un créateur général de rébus riche, ludique et intelligent. L’orthophonie est un usage exigeant du même moteur, pas un remplacement de cette ambition.

Principe produit :

> **Un créateur de rébus général riche et ludique, avec une couche Exact extrêmement rigoureuse.**

Le parcours `Écris un mot → Créer le rébus` reste central.

---

# 2. Invariant du mode Exact

La promesse stricte ne doit jamais être affaiblie :

**IMAGE ENTIÈRE → MOT CONVENTIONNEL ENTIER → PRONONCIATION ENTIÈRE.**

Une construction Exact n’est valide que si la concaténation exacte des prononciations entières correspond à la cible.

Interdits en strict : lecture partielle cachée, suppression arbitraire, consonne muette ressuscitée, liaison inventée, approximation orthographique ou assouplissement pour améliorer artificiellement la couverture.

`buildStrictConstruction` et `validateStrictRebus` sont des garde-fous à préserver. Les opérations générales ne doivent jamais obtenir `PHONETIC_STRICT` par raccourci.

---

# 3. Rébus général : opérations explicites actuellement disponibles

`src/rebus-construction.js` modélise :

- `whole_word` — strict-compatible ;
- `grapheme` — général seulement ;
- `spatial_relation` — général seulement ;
- `explicit_deletion` — général seulement ;
- `explicit_substitution` — général seulement ;
- `repetition` — général seulement.

Les opérations générales doivent être visibles dans le dessin, jamais cachées dans la lecture.

Exemples structurants :

- `souris = sous + riz` via relation spatiale explicite ;
- `yo` via demi-yo-yo visible, jamais via lecture cachée d’un yo-yo entier ;
- `parasol` conserve `pas + rat + sol` comme solution Exact prioritaire, avec variante générale `pas + chat (CH→R) + sol` ;
- `papa` et `pipi` peuvent proposer une répétition générale, mais leur construction stricte reste prioritaire.

La substitution est contrôlée sémantiquement : le fragment remplacé doit exister exactement une fois dans la lecture source et le remplacement doit réellement produire la lecture déclarée. Ne pas réautoriser les substitutions arbitraires.

---

# 4. État technique vérifié lors de cette passation

Dépôt : `ludodulac/Rebulo`.

HEAD de `main` après PR #106 :

`0173b235b909ed21463f71b1d9ed4e4474aab450`

Toujours re-vérifier ce SHA avant une nouvelle écriture.

PRs structurantes récentes :

- #84 `explicit_substitution` ;
- #85 `repetition` ;
- #86 rendu visuel réel des opérations générales ;
- #87 demi-yo-yo explicite ;
- #88 réutilisation du yo-yo Wave 2 existant ;
- #89 alternatives automatiques de répétition ;
- #90 variante substitution de `parasol` ;
- #91 garde sémantique des substitutions ;
- #92 comparaison humaine structurée pour `dos` ;
- #93 runner local de dénomination ;
- #94–#95 corrections d’intégrité du runner et des stimuli ;
- #96 garde de promotion depuis la banque de recherche ;
- #97 `pot` et `dos` passent à quatre stimuli ;
- #98 `raie` reçoit quatre stimuli de recherche ;
- #99 `tas` reçoit quatre stimuli ;
- #100 `terre` reçoit quatre stimuli ;
- #101 galerie visuelle des prototypes ;
- #102 blocage des réponses si l’image n’a pas chargé ;
- #103 tous les stimuli de dénomination sont servis localement ;
- #104 curation visuelle locale `garder / retravailler / écarter` avec export JSON ;
- #105 audit CI des SVG de recherche ;
- #106 aperçu sans indices de la galerie.

---

# 5. Recherche visuelle actuelle : 20 stimuli locaux

Le runner de dénomination et la galerie couvrent actuellement cinq concepts, quatre stimuli chacun :

- `pot /po/` ;
- `dos /do/` ;
- `raie /ʁɛ/` ;
- `tas /ta/` ;
- `terre /tɛʁ/`.

Soit **20 stimuli actifs dans la couche de recherche visuelle**.

Tous doivent rester `inactive_until_human_decision`. Aucun résultat de dénomination n’a été inventé. La curation visuelle n’est pas une donnée de dénomination et ne constitue pas une validation clinique.

`pot` et `dos` existent comme prototypes inactifs dans le lexique. `raie`, `tas` et `terre` restent volontairement hors du lexique : leur présence dans la galerie de recherche ne doit pas les créer ou les réactiver silencieusement.

---

# 6. Outils humains disponibles

## Runner de dénomination

Page : `naming-test.html`.

Comportement :

- session anonyme ;
- aucune donnée personnelle demandée ;
- première réponse spontanée uniquement ;
- ordre aléatoire / avant / arrière ;
- concept masqué pendant le stimulus ;
- aucune persistance navigateur ou serveur ;
- export JSON explicite ;
- impossible d’enregistrer une réponse tant que l’image n’est pas chargée.

La consigne reste : **« Qu’est-ce que c’est ? »** sans suggérer la cible.

## Galerie de curation

Page : `research-gallery.html`.

Elle affiche les 20 stimuli, leurs intentions, risques et provenances. Elle possède :

- curation locale `garder / retravailler / écarter` ;
- note de design facultative ;
- export JSON séparé des données de dénomination ;
- mode **Aperçu sans indices** qui masque concept, IPA, intention, risques, provenance et curation.

La curation reste uniquement en mémoire tant que l’utilisateur n’exporte pas.

---

# 7. Intégrité des stimuli

`tests/research-stimulus-integrity.test.mjs` impose pour les 20 stimuli :

- asset local ;
- SVG ;
- `viewBox` ;
- aucun `<text>` visible ;
- aucun script ou `foreignObject` ;
- aucune ressource distante ;
- aucune URL exécutable ;
- identifiants uniques.

Ne pas contourner ce test pour rendre une image « plus pratique ». Les stimuli doivent rester autonomes et sans indice lexical visible.

---

# 8. Statut des prototypes et décisions humaines

Aucune des comparaisons visuelles ne doit déclencher automatiquement :

- `active:true` ;
- `clinical_approved` ;
- une promotion dans le mode Exact ;
- une entrée de lexique pour `raie`, `tas` ou `terre`.

Les données humaines réelles, lorsqu’elles arriveront, doivent être résumées descriptivement : fréquence des réponses cibles, confusions, hésitations et absence de réponse. La décision de promotion reste humaine et séparée.

---

# 9. Bibliothèque d’images et principes de sourcing

Réutiliser les pictogrammes libres existants lorsqu’ils conviennent. Le yo-yo existe déjà dans `src/open-pictogram-library-wave2.js` : ne pas créer un second module yo-yo.

Les illustrations protégées peuvent servir à étudier les conventions, pas à être recopiées dans le produit.

Éviter les vagues de centaines de pictogrammes. L’expansion doit partir d’opportunités utiles et de visuels réellement compréhensibles.

---

# 10. Prochaine direction recommandée

La priorité n’est plus d’ajouter encore des concepts. Le pipeline de recherche est désormais assez riche pour commencer à **améliorer la qualité des 20 stimuli existants**.

Ordre recommandé :

1. vérifier le déploiement Pages de la dernière PR ;
2. utiliser la galerie et l’aperçu sans indices pour identifier les visuels manifestement faibles ;
3. améliorer en priorité les candidats `rework`, sans modifier les statuts de lexique ;
4. conserver quatre variantes distinctes par concept tant qu’aucune donnée humaine ne justifie une réduction ;
5. quand de vraies passations sont disponibles, analyser les JSON sans fabriquer d’inférence clinique ;
6. seulement après décision humaine explicite, envisager une promotion contrôlée d’un prototype.

Briques techniques possibles en attendant des données humaines : zoom/lightbox dans la galerie, comparaison côte à côte plus forte, import/relecture d’un export de curation, synthèse automatique descriptive des fichiers de passation, ou raffinements visuels ciblés des 20 SVG.

---

# 11. Choses à ne pas faire

Ne pas :

- réactiver automatiquement `pot`, `dos`, `tas`, `raie` ou `terre` ;
- transformer une décision de design en validation de dénomination ;
- inventer des participants ou des pourcentages ;
- affaiblir le mode Exact ;
- réintroduire des lectures partielles cachées ;
- généraliser une découpe arbitraire comme `tonton` ;
- recréer un pictogramme yo-yo déjà présent ;
- remplacer des stimuli locaux par des URLs distantes sans raison forte ;
- supprimer un garde-fou CI pour faire passer un prototype.

---

# 12. Résumé de reprise

**Continuer Rebulo comme créateur général de rébus, préserver l’invariant Exact, maintenir les opérations générales explicitement visibles, garder les prototypes de recherche inactifs, et concentrer la prochaine phase sur la qualité et l’évaluation humaine réelle des 20 stimuli locaux plutôt que sur une nouvelle expansion quantitative.**
