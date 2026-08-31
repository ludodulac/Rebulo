# Rebulo Orthophonie — recherche et spécification initiale

Version : 0.1 — 31 août 2026

## Positionnement

Rebulo Orthophonie n'est pas conçu comme un dispositif médical ni comme un substitut au jugement clinique. Le produit visé est un outil de création et de conduite d'exercices langagiers paramétrables par l'orthophoniste.

Le champ professionnel français couvre notamment l'évaluation et la prise en charge des troubles de la voix, de l'articulation, de la parole et des troubles associés à la compréhension et à l'expression du langage oral et écrit. Référence : Code de la santé publique, articles R4341-1 à R4341-4.

## Ce que la recherche justifie

La conscience phonologique correspond à la capacité de percevoir, segmenter et manipuler les unités sonores. Une progression clinique courante va des unités larges vers les unités fines : syllabe, rime, phonème.

Les supports destinés à l'orthophonie utilisent déjà le rébus pour travailler la conscience phonologique, la discrimination phonologique et le lexique. Des matériels professionnels proposent aussi jugement de rimes, appariement de rimes, identification syllabique, comptage syllabique et suppression syllabique.

Une revue systématique et méta-analyse publiée en 2026 dans l'International Journal of Language & Communication Disorders rapporte, sur 22 études, des améliorations significatives de la conscience phonologique après des interventions de langage oral chez des enfants/adolescents présentant des troubles développementaux de la parole et/ou du langage. Cela soutient la pertinence du domaine d'exercice mais ne constitue pas une validation clinique de Rebulo.

## Sources de travail

- Code de la santé publique : https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006190630
- Orthophonie.fr — conscience phonologique : https://orthophonie.fr/conscience-phonologique/
- Exemple de matériel rébus pour orthophonie : https://www.ortho-ia.com/jeux/boite-a-mots-rebus-oiseau-magique
- Exemple de matériel conscience phonologique : https://www.espace-orthophonie.fr/phonologie/696-gare-au-minet-3760284550666.html
- Article sur le rébus, fusion syllabique et langage : https://stm.cairn.info/revue-developpements-2009-2-page-35?lang=fr
- Lexique 4 : https://www.lexique.org/
- OpenLexicon : https://www.lexique.org/django/openlexicon/
- Revue systématique 2026 : https://consensus.app/papers/intervention-effects-on-phonological-processing-in-laasonen-sanduvete%E2%80%90chaves/dfd6f389ec715027b0e34cbedb161284/

## Principe produit

Le moteur part d'un objectif thérapeutique, puis cherche du matériel linguistique compatible. Il ne part pas d'une image amusante pour inventer ensuite un son.

Pipeline cible :

1. L'orthophoniste choisit une compétence.
2. Il peut préciser âge/niveau, unité linguistique, phonème, structure syllabique et difficulté.
3. Rebulo interroge le lexique phonologique.
4. Le moteur sélectionne des mots fréquents, imageables et adaptés.
5. Le moteur cherche des décompositions visuelles strictes.
6. Chaque candidat est validé phonétiquement.
7. Seuls les items validés sont proposés dans une séance.
8. Les réponses et aides sont enregistrées au niveau de la séance, sans prétendre poser un diagnostic.

## Règle phonétique fondamentale

Un pictogramme fournit sa dénomination complète.

Exemple :

- `vache` = /vaʃ/
- `vache` ne peut pas être utilisée silencieusement comme /va/

Si une partie doit être supprimée, découpée ou substituée, l'opération doit être visible et explicite. Ces opérations seront réservées aux exercices avancés.

## Contrôle à plusieurs étages

Un rébus clinique doit passer au minimum les contrôles suivants :

1. Dénomination visuelle non ambiguë.
2. Prononciation de chaque composant vérifiée dans une ressource lexicale française.
3. Prononciation du mot cible vérifiée séparément.
4. Concaténation ou transformation calculée phonétiquement.
5. Comparaison entre résultat et cible.
6. Relecture humaine avant statut `clinical-approved`.

Le moteur ne doit jamais déduire la validité d'une ressemblance orthographique.

Exemples de rejets :

- riz + bus -> /ʁibys/ != rébus /ʁebys/
- tour + nez + sol n'est pas une concaténation stricte de la prononciation usuelle de tournesol
- pie + rat + mie + dé ne donne pas la finale phonétique de pyramide
- pas + rat + dé ajoute une voyelle finale absente de parade

## Compétences à couvrir dans la V1 orthophonie

### Niveau mot / lexique

- dénomination
- évocation et accès lexical
- catégorisation future

### Niveau syllabique

- comptage syllabique
- segmentation syllabique
- fusion syllabique
- identification initiale/médiane/finale
- suppression syllabique avec opérateur explicite

### Niveau rime

- jugement de rimes
- appariement de rimes
- recherche d'intrus

### Niveau phonémique

- phonème initial
- phonème final
- segmentation phonémique
- fusion phonémique
- discrimination de contrastes
- suppression/substitution avec opérateur explicite

### Passerelle oral-écrit

- reconstruire oralement puis écrire le mot
- choix parmi graphies à développer ultérieurement

## Base lexicale recommandée

Pour industrialiser le corpus, Rebulo doit s'appuyer sur des ressources lexicales au lieu d'une liste écrite manuellement.

Lexique 4 fournit environ 190 000 formes françaises avec notamment représentations phonologiques, fréquence, lemmes et structure morphologique. Pour le vocabulaire enfant, OpenLexicon expose également Manulex et des bases d'âge d'acquisition. Ces données doivent servir à filtrer les cibles selon fréquence, familiarité, âge et phonologie.

## Architecture de données proposée

Chaque pictogramme devra posséder :

- `id`
- `label_fr`
- `ipa`
- `aliases_allowed`
- `aliases_forbidden`
- `imageability`
- `visual_ambiguity`
- `min_age`
- `asset`
- `clinical_status`
- `source_phonology`
- `reviewed_by`

Chaque mot cible devra posséder :

- orthographe
- lemme
- IPA
- syllabation
- fréquence
- âge d'acquisition si disponible
- structures phonémiques/syllabiques
- décomposition Rebulo candidate
- score de fidélité phonétique
- score d'ambiguïté visuelle
- compétences thérapeutiques associées
- statut de validation

## Statuts de validation

- `research-candidate` : généré ou proposé, pas utilisable en clinique.
- `phonetic-checked` : forme sonore vérifiée automatiquement/manuellement.
- `visual-checked` : dénominations des images jugées suffisamment stables.
- `clinical-reviewed` : relu par un orthophoniste partenaire.
- `clinical-approved` : autorisé dans les séances de production.
- `rejected` : conservé avec la raison du rejet pour éviter sa réintroduction.

## Ordre de construction

1. Stabiliser les règles.
2. Importer/adapter le lexique phonologique français.
3. Définir les objectifs thérapeutiques.
4. Générer un premier corpus de 100 à 300 cibles candidates.
5. Sélectionner les composants visuels nécessaires.
6. Créer les pictogrammes manquants.
7. Faire relire le corpus par un ou plusieurs orthophonistes.
8. Brancher le moteur de génération de séances sur les seuls items approuvés.
9. Étendre aux phrases après validation du niveau mot.

## Ce qui n'est pas encore fait

La V0 actuelle reste un prototype de jeu. Les fichiers `therapy-targets.json`, `phonetic-rules.json` et `corpus-pilot.json` posent la nouvelle architecture, mais le moteur de filtrage clinique, l'import Lexique 4 et l'interface praticien ne sont pas encore implémentés.
