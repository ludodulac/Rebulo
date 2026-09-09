# Rebulo — catalogue canonique des sons de rébus

Ce document fixe **où ranger** les briques sonores et comment les retrouver sans repartir de zéro. Il ne remplace ni les données, ni les assets, ni les tests.

## Objectif

Construire un dictionnaire exploitable de type :

`segment sonore → représentations exactes → conventions visibles → approximations mesurées`

Le catalogue doit couvrir les fenêtres utiles d'**une à deux syllabes**, y compris les fenêtres qui traversent une frontière de mots dans une phrase. Il doit aussi permettre une exploration phonémique glissante pour retrouver des découpages décalés qui ne suivent pas les frontières syllabiques.

## Sources canoniques déjà existantes

Ne pas recopier ce qui existe déjà :

- `src/syllable-print-library.js` : briques courtes déjà illustrées, actives ou en recherche ;
- `src/pictogram-print-sheets.js` / `ALL_OPEN_PICTOGRAMS` : bibliothèque illustrée générale déjà disponible ;
- `data/phonetic-brick-candidates.json` : candidats lexicaux/visuels déjà curatés ;
- `docs/PHONETIC_BRICK_MAP.md` + `data/phonetic-brick-map.json` : couverture et priorités de recherche actuelles ;
- `src/phonology-atlas.js` : index des pictogrammes par sons/phonèmes ;
- `src/lexical-sound-index.js` : recherche lexicale par phonèmes ;
- `src/french-sound-search.js` : saisie intuitive de sons français ;
- `data/rebus-visible-conventions.json` : lettres, chiffres et autres conventions visibles ;
- `data/rebus-sound-research-seeds.json` : hypothèses concrètes à ne pas perdre avant validation complète.

Le fichier généré `data/rebus-sound-catalog.json` agrège ces sources ; il n'est pas une nouvelle source éditoriale concurrente. Toute image déjà présente dans la bibliothèque ouverte doit être retrouvée avant de proposer de la redessiner.

## Fenêtres à inventorier

### 1. Fenêtres syllabiques exactes

À partir des syllabifications Lexique validées `source_exact`, conserver toutes les fenêtres adjacentes de :

- 1 syllabe, y compris les mots monosyllabiques validés ;
- 2 syllabes.

Pour une phrase, la même logique doit traverser les mots. Exemple important : `cuit + hier` peut produire la fenêtre /kɥijɛʁ/, ce qui ouvre la représentation `cuillère`.

### 2. Fenêtres phonémiques glissantes

En parallèle, explorer la chaîne IPA continue avec des fenêtres qui démarrent à chaque phonème. Cela permet de trouver des rébus de magazine dont les coupures ne coïncident ni avec les mots ni avec les syllabes.

Cette exploration est une **recherche de route**, pas une validation phonologique automatique.

## Niveaux de représentation

1. **Image exacte prête** : mot entier, prononciation entière, asset déjà exploitable.
2. **Image exacte en recherche** : correspondance phonétique exacte mais nommabilité/visuel encore à tester.
3. **Convention visible** : lettre, chiffre, note de musique ou autre symbole explicitement montré.
4. **Approximation mesurée** : lecture source conservée, écart phonémique calculé et statut `research_only`.

Une approximation ne devient jamais stricte parce que son score est faible. Une image générale dont la dénomination n'est pas suffisamment stable peut exister dans la bibliothèque tout en restant hors garantie stricte/clinique.

## Candidats lexicaux automatiques

Le catalogue construit un index Lexique `prononciation entière → mots entiers attestés` une seule fois, puis l'utilise sur toutes les fenêtres. Ces candidats servent à répondre rapidement à la question : **« existe-t-il déjà un mot français exact que l'on pourrait représenter ? »**

Le filtrage automatique « dessinable » n'est qu'un tri grossier. Il ne prouve ni que l'image est évidente, ni que le mot sera nommé spontanément, ni que le stimulus convient à un âge ou à un usage orthophonique.

La priorité visuelle ne doit pas être pilotée par la fréquence brute de tout Lexique. Le catalogue conserve l'inventaire exhaustif, mais calcule séparément l'importance dans le **vocabulaire utile Rebulo**, avec la preuve de fréquence scolaire disponible. Un son très fréquent dans des formes marginales ne doit donc pas écraser un son qui débloque de nombreuses cibles utiles.

## Cas de départ préservés

Les premières hypothèses concrètes sont rangées dans `data/rebus-sound-research-seeds.json`, notamment : `aile`, `nœud`, `son`, `Pâques`, `8`, `patte`, `huile`, `cuillère`, `L`, `K`, `Q` et la note `la`.

Le cas `lait` pour /le/ est volontairement conservé comme **approximation** : la lecture /lɛ/ ne doit pas être silencieusement présentée comme exacte.

## Construction automatique

Lancer :

`npm run build:rebus-sound-catalog`

Le script produit :

- `data/rebus-sound-catalog.json` : inventaire exhaustif compact ;
- `docs/REBUS_SOUND_CATALOG_REPORT.md` : rapport lisible avec statistiques, priorités utiles, prototypes à revoir et nouvelles images à rechercher.

Le JSON généré utilise `formatVersion: 2`. Les 60 000+ lignes sonores sont stockées sous forme de tuples dans `soundRows`, avec l'ordre des colonnes décrit par `rowSchema`. Cela conserve **tous les sons** sans répéter des dizaines de noms de champs sur chaque entrée. Les files `visualResearchQueue`, `existingPrototypeReviewQueue` et `newImageResearchQueue` ne dupliquent pas les entrées : elles contiennent les IPA permettant de retrouver la ligne correspondante.

Le workflow `.github/workflows/rebus-sound-catalog.yml` reconstruit ce catalogue sur le Lexique complet, vérifie que les bibliothèques existantes sont bien consolidées et publie les deux fichiers comme artefact de recherche. Sur `main`, les sorties générées sont versionnées automatiquement.

## Ordre de travail visuel

Les files sont volontairement séparées :

- `existingPrototypeReviewQueue` : une image exacte/prototype existe déjà ; la priorité est de l'examiner ou la tester avant de redessiner ;
- `newImageResearchQueue` : aucun asset exact et aucune convention visible suffisante n'existent encore, mais un ou plusieurs noms entiers exacts peuvent être examinés ;
- `visualResearchQueue` : vue générale de toutes les routes non prêtes.

Le score automatique privilégie le vocabulaire utile Rebulo, la fréquence scolaire, le nombre de cibles utiles, l'intérêt des fenêtres de deux syllabes et les candidats lexicaux exacts. Une convention visible déjà utilisable réduit la priorité de fabrication d'une nouvelle image, sans interdire une future alternative imagée.

Cette file sert à choisir quoi examiner en premier ; elle ne choisit jamais automatiquement l'image finale. À qualité égale, conserver l'ordre produit :

`utilité corpus → fréquence du segment → nombre de cibles débloquées → évidence visuelle → stabilité de dénomination → âge/public → coût de production`

Ne pas générer une grande quantité d'images avant d'avoir vérifié que les sons choisis débloquent réellement des constructions utiles.

## Orthophonie

Conserver les niveaux séparés : exactitude phonétique, convention visible, approximation, nommabilité, compréhension, validation pédagogique et validation clinique. Un rébus ludique de magazine peut utiliser une approximation ; cela ne lui donne pas automatiquement le même statut qu'une construction destinée à un usage orthophonique contrôlé.
