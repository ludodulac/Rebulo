# Sélection finale — 72 concepts pour validation visuelle humaine

Base : `e4b9b448aff139f12a1ac3cc41aadf9e427704e1`.

Cette livraison clôt le chantier « mots » pour ce jalon. Elle prépare uniquement un lot borné de concepts avant production d'images et validation humaine. Elle ne modifie ni B ni la formule #290, ne produit aucune image, n'active rien au runtime et ne revendique aucune validation humaine ou orthophonique.

## Composition

Le manifest contient exactement **72 concepts** :
- 18 `physical_object`
- 10 `animal`
- 8 `food`
- 8 `body_part`
- 8 `tool`
- 6 `vehicle`
- 6 `place`
- 8 `other_concrete`

Il contient exactement **18 contrôles positifs historiques supposés évidents** et **54 concepts frais**. Les contrôles ne sont pas « validés humainement » ; toutes les entrées conservent `humanNamingEvidence: "none"`.

## Contrôles historiques

`porte`, `livre`, `lit`, `nid`, `table`, `chien`, `chat`, `cheval`, `pie`, `pomme`, `œil`, `pied`, `scie`, `train`, `voiture`, `mer`, `route`, `soleil`.

## Sélection par catégorie

- **physical_object (18)** : `porte`, `livre`, `lit`, `nid`, `table`, `bureau`, `but`, `dossier`, `journal`, `papier`, `bâton`, `tasse`, `balle`, `photo`, `puits`, `four`, `disque`, `anneau`.
- **animal (10)** : `chien`, `chat`, `cheval`, `pie`, `loup`, `coq`, `renne`, `oie`, `oiseau`, `rat`.
- **food (8)** : `pomme`, `radis`, `chou`, `pois`, `noix`, `café`, `sucre`, `olive`.
- **body_part (8)** : `œil`, `pied`, `visage`, `cerveau`, `os`, `doigt`, `crâne`, `poing`.
- **tool (8)** : `scie`, `pelle`, `lance`, `louche`, `piège`, `clé`, `aiguille`, `couteau`.
- **vehicle (6)** : `train`, `voiture`, `vaisseau`, `char`, `vélo`, `bateau`.
- **place (6)** : `mer`, `route`, `prison`, `village`, `phare`, `champ`.
- **other_concrete (8)** : `soleil`, `gant`, `manteau`, `carré`, `planète`, `goutte`, `ciel`, `pull`.

## Risque de nommage anticipé

- `low` : **40**
- `medium` : **32**
- `high` : **0**

La sélection exclut volontairement les concepts abstraits, les scènes narratives complexes, les stimuli dépendant de texte et les distinctions lexicales trop fines. Le niveau `medium` signale une concurrence lexicale à mesurer, pas une preuve d'échec.

## Briefs visuels

Les briefs décrivent uniquement le contenu à représenter. Ils demandent explicitement l'absence de texte, légende, lettre-indice, pictogramme textuel, rébus secondaire ou autre indice artificiel quand cela est pertinent.

Exemples :
- `porte` : panneau fermé dans un encadrement simple, poignée visible, sans numéro ni texte ;
- `chien` : animal domestique adulte entier, sans collier ni décor ;
- `pomme` : fruit entier isolé, sans étiquette ;
- `œil` : un œil humain ouvert en gros plan, sans visage complet ;
- `scie` : outil à main, poignée et lame dentée visibles, sans bois ni texte ;
- `vélo` : véhicule entier de profil, sans cycliste ;
- `village` : petit groupe de maisons, sans panneau de localité ;
- `goutte` : une seule goutte d'eau réaliste, sans symbole.

## Provenance et preuve

Chaque entrée conserve :
- l'identité B `GRAPHIE EXACTE + IPA EXACT` ;
- une source de concept déjà établie dans le dépôt ;
- un `senseId` et un `stableId` propres au manifest ;
- les alternatives anticipées et le risque de nommage ;
- `humanNamingEvidence: "none"`.

Aucune donnée de ce manifest ne doit être interprétée comme une validation de dénomination. Le lot est **prêt à être transmis au développement/design pour produire puis geler les futurs stimuli**, après validation de Grand-père.
