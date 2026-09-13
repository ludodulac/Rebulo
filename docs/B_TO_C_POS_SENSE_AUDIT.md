# Audit POS / lemme / sens — tranche B → C 2 000

## Cause technique exacte

Le générateur initial utilisait une clé `norm(form)|ipa` où `norm()` supprimait les diacritiques, puis stockait une seule entrée avec `Map.set(...)`.

Deux effets étaient confondus :

1. **collision d'identité orthographique** : `mur` et `mûr`, `coté` et `côté`, etc. pouvaient partager la même clé alors que la graphie exacte diffère ;
2. **écrasement potentiel** : si plusieurs lignes aboutissaient à cette clé, la dernière remplaçait les précédentes.

Sur les 2 000 relations, 67 lignes sont exposées à une collision créée par le folding des accents. Après passage à une identité NFC conservant les diacritiques, aucune des 2 000 relations ne possède plusieurs entrées Lexique uniques POS/lemme pour le même couple graphie exacte + IPA. Le multimap reste néanmoins la représentation sûre pour l'avenir.

Un troisième problème est indépendant de `Map.set` : certains sens usuels ne sont simplement pas présents dans le miroir Lexique utilisé. C'est le cas des sens nominaux examinés ici pour `basse` (instrument), `enceinte` (haut-parleur) et `portable` (téléphone). `rature` possède déjà le bon POS/sens lexical ; son faux négatif venait du proxy de fréquence.

## Distinctions retenues

- **Homographes avec POS différents** : conservés comme entrées lexicales distinctes seulement si la graphie exacte + IPA est identique. Aucun cas de ce type dans cette tranche après correction de l'identité orthographique.
- **Polysémie dans un même POS** : non inférée automatiquement depuis Lexique, qui n'est pas un inventaire de sens. Un sens supplémentaire n'est créé que s'il est explicitement revu.
- **Variantes / flexions / lignes techniques** : repliées par identité exacte `lemme + POS`; elles ne créent pas d'unité conceptuelle.
- **Concepts visuels distincts** : `basse` instrument, `enceinte` haut-parleur et `portable` téléphone ajoutent chacun une unité conceptuelle revue. `rature` est une requalification du même concept et n'est donc pas dupliquée.

## Mesure sur les mêmes 2 000 relations

- relations exposées à l'ancienne clé accent-folded : **67** ;
- relations avec plusieurs entrées POS/lemme uniques sous graphie exacte + IPA : **0** ;
- relations changeant de classe quand on réinterprète les mêmes 2 000 lignes avec graphie exacte : **13** ;
- faux négatifs potentiels corrigés par l'identité exacte : **4** ;
- faux positifs potentiels détectés : **2** ;
- concepts visuels supplémentaires explicitement retrouvés : **3** ;
- requalification éditoriale du même concept : **1** (`rature`).

La distribution relationnelle automatique de #291 reste l'archive de baseline : **7 / 675 / 818 / 500**. Sur les mêmes 2 000 IDs, la réinterprétation à graphie exacte donne **7 / 677 / 822 / 494**. Après ajout des trois sens visuels distincts revus et requalification de `rature` sans duplication, la vue conceptuelle contient **2 003 unités** : **7 A / 681 B / 821 C / 494 D**.

Ces chiffres ne sont pas une nouvelle tranche et ne proviennent d'aucune modification des poids ou garde-fous #290.

## Cas ciblés

- `basse` : Lexique ne fournit ici que `ADJ bas`; le sens nominal instrument est ajouté par revue de sens comme unité distincte B.
- `enceinte` : Lexique ne fournit ici que l'adjectif; le sens nominal haut-parleur est ajouté comme unité distincte B.
- `portable` : Lexique ne fournit ici que l'adjectif; le sens nominal téléphone est ajouté comme unité distincte B.
- `rature` : Lexique fournit bien `NOM rature`; aucune unité supplémentaire. Le même concept passe de C à B dans la revue éditoriale à cause de la sous-estimation de familiarité/fréquence.

## Échantillon de changements

Faux positifs potentiels dus à l'ancienne identité accent-folded :
- `gouts` : B → C ; l'ancienne clé récupérait `goût`.
- `la` : B → C ; l'ancienne clé récupérait `là`.

Faux négatifs potentiels corrigés par identité exacte :
- `marché` : C → B ;
- `nait` : C → B ;
- `cale` : C → B ;
- `trés` : D → B.

Les formes lexicales rares ou discutables de ce petit échantillon confirment qu'une classe automatique reste une estimation éditoriale et non une validation humaine.

## Représentation implémentée

`data/b-to-c-industrial-sample-2000-pos-sense-preserved.jsonl` conserve pour chaque relation :

- une clé d'identité graphie exacte + IPA ;
- `lexicalEntries[]` avec les couples lemme/POS uniques ;
- le nombre de lignes source repliées ;
- l'interprétation de baseline ;
- l'interprétation corrigée à graphie exacte ;
- `conceptUnits[]`, où plusieurs unités ne sont créées que pour des sens visuels explicitement distincts ;
- `humanNamingEvidence = none` partout.

La polysémie même-POS reste explicitement `not_observable_from_lexique_without_sense_inventory` afin de ne pas fabriquer de faux concepts.

## Recommandation

La correction est suffisamment claire pour fusionner #291 : **OUI**, à condition de considérer la nouvelle vue POS/sens comme la structure de référence pour la suite de C, et de conserver la baseline 2 000 initiale uniquement comme mesure historique reproductible. Ne pas étendre encore aux 135 140 relations avant d'utiliser cette identité lexicale exacte et une vraie couche de sens explicites dans la prochaine tranche contrôlée.
