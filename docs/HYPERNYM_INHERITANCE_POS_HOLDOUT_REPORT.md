# Hyperonymie structurée, héritage sémantique et résolution POS — holdout scellé

## Statut

Analyse B→C bornée. **B inchangé. Formule #290 inchangée.** Aucun SVG, aucune image, aucune activation runtime/UI/CSS/planner/Phrase/Vague 6, aucun lot 10–15k, aucun traitement intégral des 135 140 relations.

Base stable après fusion de #296 et refresh automatique : `3ae27afa68d46922c1c18d0f0ae10908c3de02c0`.

Modèle final gelé avant ouverture du holdout : `structured-hypernym-inheritance-pos-v2`. Le holdout final n'a servi à aucun réglage.

## Protocole de corpus

Le corpus probant final contient **180 relations : 120 développement + 60 holdout**, dont **40 positifs en développement et 20 positifs dans le holdout**. Il a été sélectionné et annoté avant tout lookup sémantique, puis scellé avec `sourceLookedAt:false`.

Le réservoir est le paysage de représentation dérivé déjà présent dans le dépôt, pas un nouveau parcours exhaustif de B. Toutes les relations des corpus antérieurs #293–#296, les 15 FN historiques et deux préflights internes abandonnés ont été exclus de la sélection finale.

Deux préflights ont été rejetés **avant toute ouverture de leur holdout** : le premier avait des positifs dont le type attendu restait `other`; le second n'avait aucun positif en développement. Ils n'entrent dans aucune métrique finale et ont uniquement servi de garde méthodologique pour éviter un holdout non informatif.

Le gold final reste un **gold éditorial/proxy pré-source**, pas une validation humaine de nommage : `humanNamingEvidence` reste `none`.

## Trois niveaux séparés

1. `senseObserved` : le sens est attesté par French Wiktionary via Wiktextract/Kaikki.
2. `semanticType` : le sens reçoit un type déterministe et une confiance.
3. `visualEligibility` : décision distincte et conservatrice de promotion.

L'observation lexicale n'est jamais assimilée à une preuve visuelle.

## Taxonomie

Taxonomie #296 conservée :

`physical_object`, `animal`, `plant`, `food`, `body_part`, `person_role`, `vehicle`, `place`, `clothing`, `tool`, `material`, `event`, `action`, `abstract`, `relation`, `symbol`, `text`, `quantity`, `other`.

## A. Hyperonymie structurée

Le modèle lit uniquement la tête de définition (après éventuelle parenthèse d'usage) et recherche des patrons généraux. Chaque patron fournit un type et une confiance ; une absence de patron retombe vers POS/topics/fallback, jamais vers une vérité inventée.

Patrons principaux :

- `partie du corps`, `organe anatomique`, `doigt`, `os`, `muscle`, etc. → `body_part`, confiance 0,98 ;
- `personne`, `individu`, `ouvrier`, `officier`, etc. → `person_role`, 0,97 ;
- `lieu`, `endroit`, `bâtiment`, `terrain`, etc. → `place`, 0,97 ;
- `véhicule`, `voiture`, `bateau`, `train`, etc. → `vehicle`, 0,98 ;
- têtes animales → `animal`, 0,98 ;
- têtes végétales → `plant`, 0,97 ;
- alimentation/boisson → `food`, 0,94 ;
- vêtement → `clothing`, 0,97 ;
- `instrument`, `outil`, `machine`, `appareil`, etc. → `tool`, 0,96 ;
- `objet`, `récipient`, `meuble`, `bâton`, `case`, `compartiment`, etc. → `physical_object`, 0,92 ;
- matière/substance → `material`, 0,93 ; texte/document → `text`, 0,96 ; symbole/signe → `symbol`, 0,96 ; quantité/nombre → `quantity`, 0,95 ; événement générique → `event`, 0,88.

Des topics structurés (`zoology`, `botany`, `anatomy`) servent de fallback avec une confiance plus faible (0,82–0,84). Les définitions libres ne sont donc jamais converties sans niveau de confiance.

Pour les verbes, une petite grammaire **de prédicats sémantiques généraux**, ancrée au début de la définition (`prendre`, `mettre`, `tenir`, `ouvrir`, `fermer`, `frapper`, `couper`, `manger`, etc.), permet de distinguer des actions directement représentables des verbes seulement attestés. Ce ne sont pas des exceptions sur les mots B : la règle porte sur le texte de définition de n'importe quel sens.

## B. Héritage forme / variante

L'héritage ne modifie jamais l'identité B `GRAPHIE EXACTE + IPA EXACT`.

Le pipeline suit uniquement les liens structurés `form_of` et `alt_of` exposés par Wiktextract/Kaikki. Le sens lié est stocké séparément avec :

- `provenanceKind: inherited` ;
- `linkKind: form_of|alt_of` ;
- `linkWord` ;
- URL et identifiant du sens source.

Un sens hérité reçoit une pénalité de ranking et ne peut être promu que si son type a une confiance ≥ 0,94. L'héritage sert donc d'information sémantique traçable, jamais de remplacement de la relation exacte B.

Sur le holdout : **31/60 relations** ont au moins un sens hérité disponible. L'ablation montre cependant **0 correction et 0 détérioration** de décision finale, au niveau sense-aligned comme relation-level. L'héritage enrichit l'observation mais n'a pas encore changé les verts.

## C. Politique des conflits POS

Matrice déterministe :

- même famille POS → `compatible`, pénalité 0 ;
- lien `form_of/alt_of` avec même famille morphologique → `morphological_compatible`, pénalité 3 ;
- graphie exacte avec divergence nom/verbe/adjectif non marquée → `exact_graphy_cross_pos`, pénalité 8, **pas de blocage dur** ;
- forme explicitement marquée mais POS contradictoire → `contradictory_marked_form`, pénalité 28 et blocage dur ;
- autre contradiction → `contradictory`, pénalité 18 ;
- POS manquant → `unknown`, pénalité faible.

Sur les 60 sens top-ranked du holdout : 47 `compatible`, 8 `exact_graphy_cross_pos`, 4 `contradictory_marked_form`, 1 sans sens. L'ablation sans résolution POS produit les mêmes décisions finales : **0 correction / 0 détérioration mesurable** sur ce holdout. La politique évite le sur-blocage théorique, mais son bénéfice de décision n'est pas encore démontré ici.

## Développement final v2

120 relations, 40 positives / 80 négatives.

- couverture observed : 116/120 = **96,7 %** ;
- ambiguïté moyenne : **10,64 sens** ;
- top-1 / top-2 / top-3 type-compatible : **82,5 % / 85,0 % / 85,0 %** ;
- semanticType accuracy : **71,6 %** ;
- sense-aligned : TP 7, FP 0, TN 80, FN 33 → précision **100 %**, rappel **17,5 %**, F1 **29,8 %** ;
- relation-level : TP 7, FP 1, TN 79, FN 33 → précision **87,5 %**, rappel **17,5 %**, F1 **29,2 %**.

Ce résultat a déclenché le gel de v2. Aucun paramètre n'a ensuite été changé.

## Holdout scellé final

60 relations, **20 positives / 40 négatives**.

### Couverture et ranking

- relations avec au moins un sens observed : **59/60 = 98,3 %** ;
- ambiguïté moyenne : **12,25 sens** ;
- relations avec sens hérité : **31** ;
- sens typés par hyperonyme : **49** ;
- top-1 bon type : **15/20 = 75,0 %** ;
- top-2 : **16/20 = 80,0 %** ;
- top-3 : **16/20 = 80,0 %** ;
- semanticType accuracy top-ranked : **36/59 = 61,0 %**.

### Mesure principale — SENSE-ALIGNED

Un TP exige relation positive promue **et** type du sens sélectionné compatible avec le sens visuel attendu.

- TP **1**
- FP **0**
- TN **40**
- FN **19**
- précision **100 %**
- rappel **5,0 %**
- F1 **9,5 %**

### Mesure UX — RELATION-LEVEL BRUTE

- TP **1**
- FP **3**
- TN **37**
- FN **19**
- précision **25,0 %**
- rappel **5,0 %**
- F1 **8,3 %**

Il y a **4 verts automatiques** :

- `voir` : positif et sense-aligned ;
- `fouetter` : faux vert ;
- `rouvrir` : faux vert ;
- `bagnole` : faux vert.

Il n'y a **aucun vert sur relation positive avec mauvais type de sens** dans ce holdout (`wrongSenseGreens = 0`).

## Contribution isolée des mécanismes — holdout

### Hyperonymie

Sans hyperonymie : sense-aligned identique (1 TP, 0 FP), relation-level **1 TP / 2 FP**, précision 33,3 %.

Avec hyperonymie : relation-level **1 TP / 3 FP**, précision 25,0 %.

Contribution nette mesurée : **0 correction sense-aligned, 0 détérioration sense-aligned ; 0 correction relation-level, 1 détérioration relation-level**. Le mécanisme améliore le typage global mais, dans ce holdout, il ajoute un faux vert net.

### Héritage

Sans héritage : métriques finales identiques. Contribution : **0 correction / 0 détérioration** aux deux niveaux.

### Résolution POS

Sans politique POS : métriques finales identiques. Contribution : **0 correction / 0 détérioration** aux deux niveaux.

## Erreurs représentatives

FN :

- `pince` : le bon sens `tool` est rang 1 mais le score reste sous le seuil ;
- `conduire`, `servir`, `vendre` : bon type `action` observé/rang 1, mais la tête de définition ne satisfait pas la garde d'action concrète assez forte ;
- formes fléchies (`finis`, `monté`, `vont`, `dors`, `crois`, `excuse`) : le sens verbal est observed, mais la définition de forme reste morphologique et n'hérite pas encore d'un sens visuel suffisamment sûr pour être verte ;
- `rentrée` et `approche` : un sens nominal `event` devance le sens action attendu ;
- `arrière` : le type attendu `person_role` n'est pas récupéré ; un sens `place` est dominant.

FP :

- `fouetter` et `rouvrir` passent la règle générale d'action concrète alors que le gold pré-source les classe négatifs ;
- `bagnole` est correctement typé `vehicle`, mais le gold la bloque comme candidat sérieux : le typage sémantique ne suffit donc toujours pas à garantir la qualité visuelle/lexicale.

## Coût humain estimé

Le bon type est dans le top-3 pour **80 % des positifs**, et la couverture observed atteint **98,3 %** : le coût n'est plus principalement la recherche du sens.

Mais **19/20 positifs sérieux** restent non promus automatiquement sense-aligned, tandis que 3/4 verts bruts sont faux. Une revue éditoriale reste nécessaire pour la grande majorité des positifs et pour contrôler la voie verte. Ce coût n'est pas raisonnable pour un lot 10–15k automatisé.

## Anti-fuite

Le modèle ne lit ni le gold ni une whitelist/blacklist de mots B. Il ne contient aucun `editorial_added`. Les règles utilisent uniquement POS, liens structurés, topics/tags, ordre source comme prior lexicographique, et patrons généraux sur les têtes de définition. Le gold sert uniquement à la mesure dans l'évaluateur.

## Décision 10–15k

**NON.**

Le rappel reste > 0 sur un holdout réellement scellé, le ranking de type progresse nettement et les trois mécanismes sont traçables. Mais l'objectif prioritaire de la mission n'est pas atteint : la précision brute des verts passe de **60 % dans #296 à 25 % ici**. Il n'y a qu'un seul vert sense-aligned et trois faux verts. Aucun lot 10–15k ne doit être lancé à partir de ce pipeline.
