# Principes produit Rebulo

Ce document fixe les principes stables du produit. Les chiffres de couverture, la liste exacte des activités implémentées et l'état courant de `main` doivent être vérifiés dans le code, les tests et les rapports générés plutôt que recopiés ici.

## Mission

Rebulo est un créateur de rébus riche, ludique et intelligent. Il doit retrouver le plaisir immédiat des rébus de magazines : on propose un mot, Rebulo cherche une manière concrète de le faire deviner, et le résultat reste simple à manipuler et à comprendre.

La rigueur linguistique de Rebulo permet en plus des usages pédagogiques et orthophoniques fiables. L'orthophonie n'est donc pas un remplacement de l'ambition généraliste : c'est un usage plus exigeant du même moteur.

Le parcours historique `saisir un mot → créer le rébus` reste un cœur du produit. Les parcours professionnels peuvent ensuite ajouter activité, séance, impression ou téléchargement sans rendre la création de base plus compliquée.

## Une architecture, plusieurs niveaux d'exigence

Rebulo ne doit pas devenir trois applications séparées. Une construction porte explicitement les capacités et opérations qui la rendent utilisable dans certains contextes.

### 1. Rébus général

Le produit peut à terme représenter les conventions compréhensibles d'un rébus classique : images, lettres ou graphèmes, relations spatiales, répétitions et transformations visibles.

Ces conventions ne doivent jamais être déguisées en concaténation phonétique stricte. Une opération non stricte doit être modélisée et montrée comme telle.

### 2. Rébus phonétiquement strict

Le niveau `strict` actuellement implémenté reste une garantie forte :

- une image représente un mot entier ;
- sa prononciation entière est utilisée ;
- la concaténation des prononciations est exactement celle de la cible ;
- aucune suppression cachée, consonne silencieuse ressuscitée, liaison inventée, lecture partielle implicite ou approximation orthographique n'est acceptée.

`Aucune solution exacte` est un résultat normal. La couverture ne doit jamais être augmentée en affaiblissant silencieusement cette garantie.

### 3. Usage orthophonique

L'usage orthophonique filtre les constructions selon l'objectif de séance, les opérations autorisées et la qualité des données disponibles. Il ajoute la profondeur professionnelle — activités, réponses attendues, séance, PDF, informations linguistiques — sans imposer cette complexité à l'écran principal.

Une construction phonétiquement exacte n'est pas automatiquement cliniquement validée. La dénomination spontanée et la reconnaissance des pictogrammes restent des questions distinctes qui nécessitent une validation humaine réelle.

## Les illustrations ont elles aussi plusieurs niveaux

La bibliothèque générale doit pouvoir devenir beaucoup plus grande que la seule banque clinique. Une illustration peut progresser sans que les niveaux soient confondus :

1. **illustration générale** — concept et asset disponibles pour les usages ludiques compatibles ;
2. **concept phonétique structuré** — dénomination et prononciation suffisamment renseignées pour participer à un calcul phonétique défini ;
3. **concept cliniquement revu** — dénomination, ambiguïté visuelle et adéquation au public revues selon le protocole prévu.

L'absence de validation clinique ne doit pas être présentée comme une validation, mais elle ne doit pas non plus empêcher par principe l'existence d'une grande bibliothèque ludique.

## Opérations de rébus

Le moteur doit pouvoir évoluer vers des opérations explicites plutôt que multiplier les exceptions. Exemples de familles possibles :

- `whole_word` : image → mot entier → prononciation entière ;
- `grapheme` : lettre ou groupe de lettres affiché explicitement ;
- `spatial_relation` : relation visuelle telle que dessus, dessous ou dans ;
- `explicit_deletion` : retrait montré à l'utilisateur ;
- `explicit_substitution` : remplacement montré à l'utilisateur ;
- `repetition` : répétition visuelle explicite.

Cette liste décrit une direction d'architecture, pas des fonctions déjà disponibles. Chaque nouvelle opération doit avoir une sémantique testable avant d'être utilisée par le générateur.

## Doctrine d'interface

Rebulo garde la profondeur d'un logiciel professionnel avec la manipulabilité d'un jeu pour enfant :

- une scène principale calme ;
- le rébus comme objet visuel dominant ;
- une action principale évidente par état ;
- gros contrôles tactiles et libellés courts ;
- géographie stable ;
- complexité révélée progressivement ;
- aucune nouvelle capacité n'obtient automatiquement un nouveau bouton d'accueil ;
- les fonctions professionnelles restent disponibles sans encombrer l'expérience de création et de résolution.

Le caractère ludique doit venir d'abord de la manipulation et de la résolution du rébus, pas d'une surcharge décorative ou d'une infantilisation de l'interface.

## Garde-fous pour les futures PR

Avant d'ajouter une fonction, vérifier :

1. Est-ce que cela améliore réellement la création, la résolution ou l'usage professionnel d'un rébus ?
2. Le niveau de rigueur de la construction reste-t-il explicite et testable ?
3. La nouvelle complexité peut-elle rester cachée jusqu'au moment où elle est utile ?
4. Les données cliniques sont-elles distinguées des données générales au lieu d'être inventées ou supposées ?
5. L'écran principal reste-t-il au moins aussi simple qu'avant ?
6. Une fonction existante a-t-elle été supprimée ou rendue moins accessible sans décision produit explicite ?

## Règle de développement

Faire évoluer Rebulo par petites briques vérifiables. Préserver les fonctions existantes lors des ajouts sauf décision produit explicite. Préférer un modèle de données clair et des tests à des exceptions ponctuelles destinées à augmenter artificiellement la couverture.
