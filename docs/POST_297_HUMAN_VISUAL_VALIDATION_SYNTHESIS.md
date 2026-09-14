# Synthèse après #290–#297 — passage à la validation visuelle humaine

Base de synthèse : `e4b9b448aff139f12a1ac3cc41aadf9e427704e1`.

Cette note clôt le cycle d'optimisation sémantique heuristique engagé jusqu'à #297 et prépare uniquement le prochain jalon produit : un premier lot borné de concepts destinés à une validation visuelle humaine. Elle ne modifie ni B ni la formule #290, ne crée aucune image, ne revendique aucune validation humaine ou orthophonique et ne lance ni 10–15k ni nouvelle vague sémantique.

## A. Ce qui est résolu

- **A — fragments phonétiques** : l'inventaire phonétique de travail est établi et exploitable.
- **B — relations exactes SON → MOT** : B reste la référence lexicale, fondée sur `GRAPHIE EXACTE + IPA EXACT`, sans modification dans ce chantier.
- **MOT → SENS structuré** : Kaikki/Wiktextract fournit désormais une couverture presque complète sur les derniers holdouts ; #297 observe 59/60 relations, soit 98,3 %.
- **Séparation des niveaux de preuve** : relation lexicale, sens observé, type sémantique, concept visuel, éligibilité et preuve humaine sont distingués. `humanNamingEvidence` reste `none` tant qu'aucun test humain réel n'a été conduit.

## B. Ce qui est partiellement résolu

- **Ranking du sens** : il est suffisamment informatif pour amener un sens compatible dans le top-3 pour une large majorité des positifs du dernier holdout ; #297 atteint 80 % top-3.
- **Typage sémantique** : utile pour organiser les candidats et produire des briefs, mais encore imparfait ; #297 atteint 61 % de `semanticType accuracy` sur les relations observées.
- Ces mécanismes sont donc adaptés à la **préparation éditoriale d'un lot test**, mais pas à une voie verte automatique industrielle.

## C. Ce qui n'est pas résolu

Le verrou produit se situe désormais après la sémantique :

1. **choisir la représentation visuelle réellement pertinente pour un sens donné** ;
2. **produire une image effectivement comprise comme prévu** ;
3. **obtenir spontanément le mot attendu chez un humain** ;
4. **mesurer les synonymes, alternatives, mauvaises lectures et absences de réponse** ;
5. **établir une preuve humaine traçable**.

Un mot phonétiquement exact n'implique pas que son image soit comprise, et une image comprise n'implique pas qu'elle soit spontanément nommée par le mot attendu.

## D. Pourquoi poursuivre seulement l'optimisation sémantique est à rendement décroissant

Les derniers travaux ont déplacé le goulot d'étranglement sans résoudre la qualité des promotions : couverture MOT→SENS proche de 98 %, ranking top-3 à 80 % sur les positifs de #297, mais seulement 1 vrai vert sense-aligned et 3 faux verts relation-level sur le holdout final. Les ablations de #297 montrent en outre 0 correction nette de décision par l'héritage, 0 par la politique POS et aucune correction nette par l'hyperonymie, qui ajoute au contraire un faux vert relation-level sur ce holdout.

Continuer à ajouter des micro-règles sémantiques chercherait donc à optimiser un intermédiaire déjà suffisamment bon pour préparer des stimuli, alors que la variable décisive pour le produit — la nommabilité spontanée de l'image — n'a encore aucune donnée humaine.

## E. Prochaine étape produit recommandée

Préparer un **premier lot de 72 concepts** pour validation visuelle humaine, sans produire les images dans le chantier « mots ».

### Composition recommandée du lot

- 18 objets physiques courants ;
- 10 animaux ;
- 8 aliments ;
- 8 parties du corps ;
- 8 outils ;
- 6 véhicules ;
- 6 lieux très concrets ;
- 8 autres concepts concrets à forte probabilité de nommabilité.

Total : **72 concepts**.

Pour garder un repère interne, viser environ **18 contrôles positifs historiques** déjà considérés très évidents dans les couches antérieures et **54 concepts frais** issus des couches établies. Les contrôles servent seulement à vérifier que le protocole et les stimuli ne sont pas globalement défaillants ; ils ne doivent pas être présentés comme déjà « validés humainement ».

### Critères de sélection

Chaque concept retenu doit :

- conserver `ipa` exact et `exactWord` exact de B ;
- avoir un sens choisi explicite et une provenance traçable ;
- correspondre à un concept visuel autonome, concret et simple ;
- présenter une bonne drawability et une bonne visualSimplicity selon #290 ;
- avoir une lexicalFamiliarity suffisante ;
- avoir un risque de nom alternatif documenté `low` ou `medium` ;
- éviter les concepts nécessitant du texte, un symbole arbitraire, un contexte narratif complexe ou une distinction trop fine entre synonymes ;
- ne recevoir aucune mention de validation humaine avant le test.

### Fiche à transmettre pour chaque concept

Conserver au minimum :

- `ipa`
- `exactWord`
- `senseId` / sens choisi
- `conceptLabel`
- `conceptDescription`
- `provenance`
- `conceptCategory`
- `anticipatedAlternativeNames[]`
- `anticipatedNamingRisk`
- `visualBrief`
- `humanNamingEvidence: none`

Le `visualBrief` doit décrire le contenu visuel attendu sans imposer le mot cible dans le stimulus et sans incorporer de texte lisible dans l'image.

## Protocole humain proposé

### Plan pilote

- 72 images maximum pour ce premier lot.
- **12 réponses indépendantes par image** comme cible pilote, soit 864 observations.
- Organisation pratique recommandée : **24 participants × 36 images**, avec répartition équilibrée pour que chaque image reçoive 12 réponses.
- Ordre des images randomisé par participant.
- Une image donnée n'est montrée qu'une fois à un participant.
- Aucun IPA, mot cible, catégorie, liste de choix ou indice lexical n'est montré avant la réponse spontanée.

### Recueil par image

1. Montrer l'image seule.
2. Question neutre : « Qu'est-ce que c'est ? » ou équivalent sans suggestion lexicale.
3. Enregistrer **verbatim la première réponse spontanée**.
4. Permettre explicitement « je ne sais pas » / absence de réponse.
5. Après la première réponse seulement, demander si nécessaire : « Est-ce qu'un autre mot vous vient ? » et enregistrer les alternatives sans proposer de liste.

### Codage à conserver

Pour chaque réponse :

- `spontaneousResponse`
- `primaryResponse`
- `alternativeResponses[]`
- `exactTargetName` : booléen
- `acceptedSynonym` : booléen
- `wrongReading` : booléen
- `noResponse` : booléen
- éventuelle note de compréhension de l'image

Le codage des synonymes acceptables doit être défini **avant** le calcul des résultats d'une image, sur la base du sens/concept attendu, afin d'éviter de déplacer la cible après observation.

### Mesures par image

Calculer au minimum :

- **taux de nom exact** = réponses premières exactement égales au mot cible / réponses totales ;
- **taux de synonyme** = réponses premières correspondant à un synonyme accepté / réponses totales ;
- **taux de mauvaise lecture** = réponses premières incompatibles avec le concept attendu / réponses totales ;
- **taux d'absence de réponse** = aucune réponse exploitable / réponses totales ;
- distribution des alternatives ;
- concentration de la réponse principale.

Conserver séparément :

- exactitude phonétique de la relation B ;
- compréhension du concept représenté ;
- nomination spontanée par le mot attendu.

### Décision après pilote

Ne pas activer automatiquement une représentation sur la seule base d'une image « comprise ». Une future règle d'activation devra être décidée après observation réelle des distributions de réponses. Le pilote doit d'abord montrer quelles catégories et quels briefs produisent une nomination spontanée suffisamment stable.

## Transmission au chantier développement / design

### À transmettre au développement

- le manifest des 72 concepts et leurs identifiants stables ;
- le schéma des réponses et métriques ci-dessus ;
- la règle « stimulus aveugle » : aucun mot cible/IPA/catégorie avant réponse ;
- randomisation, équilibrage des expositions et export brut des réponses ;
- conservation de `humanNamingEvidence:none` jusqu'à ingestion d'un test réellement effectué ;
- aucune activation runtime automatique dans cette étape.

### À transmettre au design

- uniquement les fiches `visualBrief` des concepts retenus ;
- consigne de produire une représentation unique, simple, sans texte et sans indice artificiel ;
- signaler avant production tout concept dont le brief impose une scène complexe, un contexte culturel fort ou une ambiguïté visuelle importante ;
- ne pas optimiser l'image en regardant les réponses humaines avant qu'une version de stimulus ne soit gelée pour le test concerné.

## Décision de chantier

À ce stade : **STOP hyperonymie / ranking sémantique / nouvelles heuristiques de voie verte / 10–15k**.

La prochaine preuve attendue n'est pas une nouvelle métrique sémantique. C'est une première mesure réelle de **nommabilité visuelle humaine** sur un lot borné, traçable et méthodologiquement propre.
