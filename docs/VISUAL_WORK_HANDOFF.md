# Rebulo — passation du travail visuel

Ce document évite qu'une future conversation ou passation confonde la bibliothèque phonologique, les pictogrammes externes et les illustrations Rebulo déjà travaillées. Il complète `AI_START_HERE.md` et `docs/PROJECT_HANDOFF_2026-09-01.md`; les données et le code restent la vérité courante.

## Intention produit

Rebulo doit choisir un mot que l'humain comprend et le représenter d'une manière qui lui fasse spontanément penser au bon mot. Une image disponible n'est donc pas automatiquement un bon stimulus.

Pour le travail visuel, viser : un concept unique et dominant, concret, lisible en petite carte, sans réponse écrite dans l'image, avec le moins possible de concurrents lexicaux évidents. La direction illustrée/BD déjà approuvée par le fondateur doit être préférée quand une illustration Rebulo dédiée est nécessaire.

## Ce qui existe réellement

Ne pas dire que Rebulo possède déjà « des centaines d'illustrations Rebulo générées ». Le projet possède :

- une mécanique phonologique et de couverture capable de produire beaucoup de combinaisons/cibles ;
- des bibliothèques de pictogrammes externes OpenMoji qui augmentent la couverture technique ;
- un noyau plus petit d'illustrations de production et de prototypes Rebulo, dont certaines ont déjà reçu une direction graphique explicite.

Les chiffres de couverture changent : les lire dans `data/coverage-report.json`, ne pas les recopier ici comme constantes.

## Illustrations Rebulo à ne pas oublier

`data/asset-sources.json` et `data/lexicon-seed.json` sont les registres canoniques. Au moment de cette passation, ils documentent notamment des directions/révisions Rebulo pour `thé`, `tas`, `eau`, `corps`, `pot`, `dos`, `raie`, `terre`, ainsi que d'autres créations originales antérieures comme `pie`, `mie`, `mât`, `sol`, `tour` et `mer`.

Exemples importants de la direction approuvée :

- `tas` : tas de terre/sable visuellement dominant, pelle seulement contextuelle ;
- `eau` : verre clairement rempli d'eau, avec risque explicite de réponse « verre » ;
- `corps` : personnage entier, avec risque corps/personne/homme/garçon ;
- `pot`, `dos`, `raie`, `terre`, `thé` : révisions/directions Rebulo déjà enregistrées dans les données de provenance.

Ne jamais remplacer silencieusement ces révisions par un pictogramme générique simplement parce qu'une bibliothèque externe en fournit un.

## Prototypes et observations

Les prototypes de recherche restent distincts des assets de production. Une observation sur une ancienne révision ne se transfère jamais à une nouvelle illustration.

La présence d'un asset, une approbation de direction graphique, un score technique, une CI verte ou une provenance correcte ne valent pas validation de dénomination, pédagogique ou clinique. Les premières réponses humaines spontanées doivent être conservées verbatim et liées à la révision exacte du stimulus.

## Priorisation des prochains visuels

Ne pas générer des centaines d'images aveuglément. Prioriser dans cet ordre :

1. vocabulaire réellement utile et compréhensible ;
2. brique phonétique qui débloque plusieurs bonnes cibles ;
3. candidat lexical concret et spontanément nommable ;
4. absence de concurrent lexical visuel trop fort ;
5. seulement ensuite production d'une illustration dédiée.

Toujours séparer `puissance phonologique` de `utilité humaine`. Une forme Lexique constructible peut être techniquement exacte tout en étant une mauvaise cible produit (formes rares, flexions ambiguës, etc.).

## Stockage des productions graphiques

Le dépôt GitHub reste la vérité technique : statut, chemin de production, révision, provenance, décisions et tests.

Le propriétaire du projet a indiqué disposer d'un dossier Google Drive nommé `REBULO` pour conserver des productions graphiques de travail. Si une future session génère des images qui doivent être conservées hors dépôt, elle peut utiliser ce dossier Drive, puis documenter dans GitHub ce qui y a été produit et son statut. Ne pas considérer une image présente sur Drive comme active dans le produit tant qu'elle n'a pas été explicitement intégrée et enregistrée dans les données canoniques.

## Règle de reprise

Pour toute tâche d'illustration :

`AI_START_HERE.md → ce document → data/asset-sources.json → data/lexicon-seed.json → reviews/prototypes concernés → asset exact`

Avant de générer ou remplacer une image, vérifier si une meilleure révision Rebulo existe déjà. Ne pas générer une image simplement parce que la conversation mentionne des images : la génération doit répondre à une étape de production graphique explicite.
