# REBULO — PROGRESSION

**Dernière mise à jour : 5 septembre 2026.**

Ce fichier résume l'avancement produit et recherche. Il complète `docs/PROJECT_HANDOFF_2026-09-01.md`, qui reste le point d'entrée technique détaillé.

## Cap produit

Rebulo vise un créateur général de rébus riche et ludique, avec une couche **Exact** extrêmement rigoureuse.

Invariant Exact :

> **IMAGE ENTIÈRE → MOT CONVENTIONNEL ENTIER → PRONONCIATION ENTIÈRE.**

Les conventions générales (lettres, relations spatiales, suppression/substitution explicite, répétition, découpe réellement visible) restent séparées de la preuve phonétique stricte.

## État au 5 septembre 2026

- PR #114 fusionnée sur `main` ; tests produit et déploiement Pages verts.
- Un premier corpus de **25 rébus français attestés** est enregistré dans `data/attested-rebus-corpus.json` avec ses sources.
- Principe désormais prioritaire : apprendre d'abord les conventions de rébus réellement utilisées avant d'inventer de nouveaux pictogrammes.
- L'attestation d'une convention n'active jamais automatiquement un pictogramme, ne constitue pas une validation clinique et ne donne pas automatiquement accès au mode Exact.
- `pot` est attesté comme brique dans `chapeau`, `drapeau`, `poney`.
- `dos` est attesté comme brique dans `rideau`, `domino`, mais la représentation visuelle exacte doit encore être étudiée dans les sources.
- `Terre` est attestée dans `solitaire`, avec la planète comme piste visuelle forte.
- `tas`, `raie` et `do` ne sont pas encore considérés comme attestés par le corpus initial : il faut continuer la recherche iconographique.

## Première passation humaine réelle reçue

Le 5 septembre 2026, une première personne a réalisé une session pour chacun des cinq concepts de recherche. Ces observations restent descriptives et ne validentent aucun pictogramme à elles seules.

### raie — `raie-v1`

- `raie-rebulo-swimming` → « raie »
- `raie-rebulo-spotted` → « raie »
- `raie-rebulo-silhouette` → « raie »
- `raie-rebulo-outline` → « éléphant (si c'était la première fois mais il a eu juste pour les autres) »

Lecture descriptive : 3 réponses cibles sur 4 dans cette session. La dernière observation est potentiellement influencée par l'ordre/contexte ; ne pas la transformer en conclusion de validation.

### pot — `pot-v3`

- `pot-rebulo-empty-saucer` → « vase de poterie »
- `pot-rebulo-empty-cylinder` → « tasse de poterie »
- `pot-openmoji-1fab4` → « pot de plante »
- `pot-rebulo-empty-tapered` → « pot »

Lecture descriptive : `empty-tapered` a produit exactement « pot » lors de cette session ; les autres réponses restent proches sémantiquement mais ne sont pas la cible exacte.

### terre — `terre-v1`

- `terre-rebulo-clods` → « roche »
- `terre-rebulo-mound` → « terre »
- `terre-rebulo-patch` → « coukie »
- `terre-rebulo-cross-section` → « jardin »

Lecture descriptive : `mound` a produit exactement « terre » lors de cette session. La recherche externe suggère aussi de tester la convention « planète Terre », déjà attestée dans un rébus publié.

### tas — `tas-v1`

- `tas-rebulo-stones` → « cailloux »
- `tas-rebulo-dirt` → « caca »
- `tas-rebulo-blocks` → « briques »
- `tas-rebulo-mixed-objects` → « formes géométriques »

Lecture descriptive : aucune réponse « tas ». Ne pas multiplier les variantes abstraites actuelles ; rechercher d'abord des conventions existantes (par exemple contexte d'usage) avant un nouveau test.

### dos — `dos-v3`

- `dos-rebulo-rear-silhouette` → « bonome »
- `dos-openmoji-backache-e321` → « douleur »
- `dos-rebulo-highlighted-back` → « gant d'attrapeur »
- `dos-rebulo-back-outline` → « personne forte »

Lecture descriptive : aucune réponse « dos ». Le corpus atteste néanmoins la lecture `dos` dans des rébus existants ; la prochaine étape est donc d'inspecter comment les sources la représentent réellement, et d'étudier séparément la piste conventionnelle de la note `do` sans la déclarer attestée avant preuve.

## Décision de méthode après cette passation

La passation a rempli son rôle : elle a montré que fabriquer plusieurs dessins plausibles n'est pas une bonne stratégie d'expansion par défaut.

Nouvel ordre de travail :

1. collecter des rébus français réellement publiés ;
2. analyser leurs images et extraire les briques visuelles utilisées ;
3. enregistrer source, lecture, contexte, ambiguïtés et répétition d'usage ;
4. privilégier les représentations déjà conventionnelles et légalement réutilisables/adaptables ;
5. utiliser les passations humaines pour départager les cas incertains, pas pour inventer à l'aveugle ;
6. garder toute activation lexicale et toute décision clinique séparées et explicitement humaines.

## Prochaine passation utile

Ne pas refaire immédiatement les 20 anciens stimuli en masse. La prochaine vraie passation doit porter sur une **nouvelle comparaison sourcée**, après recherche iconographique :

- `pot` : pot de fleur vide, silhouette canonique ;
- `/do/` : comparer une convention musicale correctement représentée à la convention `dos` réellement observée dans des rébus publiés ;
- `Terre` : comparer la planète Terre attestée à la meilleure représentation de matière ;
- `tas` : seulement après avoir retrouvé une représentation de rébus existante ou un contexte visuel suffisamment conventionnel ;
- `raie` : conserver la piste poisson comme prometteuse, mais chercher d'abord des attestations supplémentaires.

## Garde-fous

- Aucun résultat humain inventé.
- Une seule personne ne suffit pas à valider un pictogramme.
- Aucune promotion automatique vers `active:true` ou `clinical_approved`.
- Aucun affaiblissement de `buildStrictConstruction` ou `validateStrictRebus`.
- Une convention attestée dans un rébus général n'est pas automatiquement une preuve Exact.
- Les images protégées servent à étudier les conventions ; elles ne sont pas recopiées dans le produit sans droit de réutilisation.

## Prochaine brique produit

Construire le **vocabulaire visuel attesté de Rebulo** : corpus plus large → preuves iconographiques par brique → classement de confiance → intégration contrôlée au générateur → mesure de couverture réelle des mots et phrases français.
