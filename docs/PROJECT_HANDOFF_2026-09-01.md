# REBULO — PASSATION ACTIVE / POINT D’ENTRÉE UNIQUE

**Dernière mise à jour : 5 septembre 2026, après fusion de la PR #114 et première passation humaine réelle.**

Ce fichier est le point d’entrée prioritaire pour continuer Rebulo. Le journal lisible d’avancement est `docs/PROGRESSION.md`.

## Phrase de reprise

> **Continue Rebulo. Lis `docs/PROJECT_HANDOFF_2026-09-01.md` et `docs/PROGRESSION.md`, vérifie le HEAD réel de `main`, puis reprends la prochaine brique utile avec une branche dédiée, tests, PR, CI verte, fusion et vérification Pages.**

Règles : vérifier `main` avant toute écriture ; ne jamais écrire directement sur `main` ; préserver les fonctionnalités ; ne jamais fabriquer de résultats humains, de validation clinique ou de statut `clinical_approved`.

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

Après PR #114, `main` était `25f160c9988658ed768130443d91b44ecd6b3fc2`. Toujours re-vérifier le HEAD avant une écriture.

PRs récentes : #107 handoff ; #108 zoom galerie ; #109 ré-import strict de curation ; #110 revue descriptive ; #111 miniatures ; #112 révisions de comparaison ; #113 passation simplifiée ; #114 corpus de rébus attestés. Les tests et Pages de #114 ont réussi.

# 4. Changement de méthode majeur

Ne plus créer des vagues de pictogrammes plausibles à l’aveugle. Priorité : collecter de vrais rébus français publiés, analyser leurs images, extraire les briques réellement utilisées, conserver lecture/source/contexte/ambiguïtés, puis chercher un asset libre ou produire une adaptation originale conforme à la convention. Les passations servent ensuite à départager les cas incertains.

`data/attested-rebus-corpus.json` contient 25 compositions attestées issues de quatre sources initiales, dont `chat + pot → chapeau`, `pain + seau → pinceau`, `scie + reine → sirène`, `riz + dos → rideau`, `dos + mie + N + os → domino`, `seau + lit + Terre → solitaire`.

Une attestation prouve un usage de convention dans un rébus ; elle ne constitue ni validation clinique, ni activation lexicale automatique, ni éligibilité automatique au mode Exact.

# 5. Première passation humaine réelle

Le 5 septembre 2026, une première personne a réalisé les cinq sessions historiques. Les réponses verbatim sont consignées dans `docs/PROGRESSION.md`.

Résumé descriptif :

- `raie-v1` : 3/4 réponses « raie » ; quatrième « éléphant » avec remarque de possible effet de contexte ;
- `pot-v3` : `empty-tapered` → « pot » ; autres réponses « vase de poterie », « tasse de poterie », « pot de plante » ;
- `terre-v1` : `mound` → « terre » ; autres « roche », « coukie », « jardin » ;
- `tas-v1` : aucune réponse « tas » ; « cailloux », « caca », « briques », « formes géométriques » ;
- `dos-v3` : aucune réponse « dos » ; « bonome », « douleur », « gant d'attrapeur », « personne forte ».

Une personne ne valide aucun pictogramme. Cette passation sert surtout à réorienter la recherche visuelle.

# 6. Conséquences iconographiques

- `pot` : brique fortement attestée ; étudier le pot de fleur vide canonique plutôt que des décorations dominantes.
- `dos` : lecture attestée dans `rideau` et `domino`, mais inspecter les images sources. Étudier séparément la note `do` sans la déclarer attestée avant preuve.
- `Terre` : planète Terre, piste forte attestée dans `solitaire`; à comparer à la matière terrestre.
- `tas` : les quatre prototypes abstraits ont échoué dans cette première session ; rechercher une convention existante ou un contexte d’usage avant de redessiner.
- `raie` : poisson prometteur dans cette session ; continuer la recherche d’attestations avant promotion.

Un outil peut aider à reconnaître une matière ou une situation, mais il ne doit jamais devenir une lecture phonétique cachée en Exact.

# 7. Outils humains

`naming-test.html` : passation simple, anonyme, code et ordre aléatoire automatiques, question « Qu’est-ce que c’est ? », export JSON local.

`naming-review.html` : imports multiples liés à la révision exacte, comptages descriptifs et miniatures, aucune activation automatique.

`research-gallery.html` : galerie, aperçu sans indices, zoom/navigation, curation locale et ré-import strict.

# 8. Statut recherche

Les comparaisons `pot`, `dos`, `raie`, `tas`, `terre` restent `inactive_until_human_decision`. Ne pas les réactiver automatiquement.

`data/pictogram-naming-tests.json` reste vide : ne pas fabriquer un agrégat ou une validation à partir d’une seule personne. Les exports bruts réels restent des observations anonymes liées à leur `comparisonRevision`.

# 9. Prochaine direction

Construire le **vocabulaire visuel attesté de Rebulo** : agrandir le corpus → enregistrer la preuve iconographique réelle par brique → classer convention forte / plausible / non établie → identifier des assets libres → intégrer au moteur général sans toucher aux garanties Exact → mesurer la couverture → préparer une nouvelle comparaison sourcée → seulement alors refaire une passation.

Ne pas refaire immédiatement les 20 anciens stimuli : `dos` et `tas` doivent d’abord être retravaillés selon les conventions réelles observées.

# 10. Garde-fous

Ne pas inventer participants ou observations ; ne pas déclarer `clinical_approved` automatiquement ; ne pas affaiblir Exact ; ne pas réintroduire de lecture partielle cachée ; ne pas recopier des illustrations protégées ; ne pas réactiver silencieusement les prototypes ; ne pas confondre attestation dans un rébus, reconnaissance spontanée d’une image et validation clinique.

# 11. Résumé de reprise

**Continuer Rebulo en apprenant d’abord le langage visuel des vrais rébus français. Le corpus attesté devient la base de l’expansion. Les premières observations humaines indiquent que `dos` et `tas` doivent être repensés, tandis que `raie`, un pot vide canonique et certaines représentations de terre méritent d’être approfondis. Préserver strictement l’invariant Exact et ne promouvoir aucune brique sans le niveau de preuve correspondant.**
