# Migration progressive vers des pictogrammes individuels

## But

Remplacer progressivement les anciens visuels de REBULO sans modifier le moteur phonétique, les décompositions ni les contenus thérapeutiques.

## Contrat

L'identité phonétique reste portée par le concept (par exemple `rat`, `/ʁa/`).
Le visuel est une ressource interchangeable.

Le registre `REBULO_INDIVIDUAL_VISUALS` dans `src/rebulo-individual-visuals.js` est le point de routage graphique dédié :

- si un concept possède un fichier individuel, REBULO utilise ce fichier ;
- sinon il conserve automatiquement la case correspondante de `assets/visible-batch1/sprite.svg`.

Cela permet une migration pictogramme par pictogramme.

## Pilote historique

La migration a d'abord été prouvée avec RAT puis CHAT afin de vérifier que le mécanisme était générique et non un cas spécial. Le registre a ensuite été étendu progressivement. L'état courant fait foi dans la section « État du batch visible » ci-dessous.

## Conditions techniques avant activation d'un dessin

1. sujet unique et identité conceptuelle certaine ;
2. fichier individuel, jamais une découpe opportuniste d'une planche composite ;
3. PNG réel ;
4. RGBA (type couleur PNG 6) et transparence adaptée ;
5. cadrage lisible à petite taille ;
6. absence de texte/décor parasite sauf cas explicitement prévu ;
7. fichier ajouté dans `assets/visible-batch1/individual/` ;
8. concept ajouté à `REBULO_INDIVIDUAL_VISUALS` ;
9. tests unitaires verts ;
10. contrôle navigateur mobile réel vert.

## Rendu

Pour un fichier individuel, le runtime impose `object-fit: contain`, fond transparent, aucune ombre rectangulaire et aucun arrondi de boîte. Pour un asset non migré, le comportement sprite historique est conservé.

## Interdictions

- Ne pas modifier l'IPA pour changer un dessin.
- Ne pas dupliquer les règles phonétiques dans le registre graphique.
- Ne pas considérer un JPEG renommé `.png` comme un PNG.
- Ne pas promouvoir une planche composite comme original individuel.
- Ne pas remplacer plusieurs visuels simultanément avant validation du pipeline pilote.

## Extension après validation du pilote RAT + CHAT

Une migration supplémentaire se réduit maintenant à deux opérations fonctionnelles : ajouter le PNG individuel et ajouter l'association `concept -> chemin` dans le registre graphique dédié. Les tests doivent ensuite prouver que les autres concepts conservent leur fallback sprite.


## État du batch visible — 2026-09-22

Le registre individuel couvre désormais 18 concepts sur 23 : banc, chat, cheval, chien, couteau, lit, livre, nid, pie, pied, pomme, porte, rat, route, soleil, table, train, voiture.

Le navigateur mobile contrôle maintenant automatiquement toutes les entrées du registre, et non plus seulement RAT/CHAT.

Cinq concepts restent volontairement sur le sprite tant qu'un original individuel de provenance sûre n'est pas disponible : bébé, œil, mer, scie, nez.

Provenance connue des blocages :
- œil et scie : source existante, extraction individuelle bloquée ;
- mer : individuel historique prouvé mais actuellement inaccessible ; un composite historique de récupération a été retrouvé, mais il reste une preuve de provenance et ne doit pas être traité comme original individuel ;
- bébé : identifié historiquement comme à extraire depuis une source ;
- nez : une planche historique contenant le concept a été retrouvée, mais aucun original individuel sûr n'est disponible ; la planche n'est pas découpée pour simuler un original.

BANC est une récupération historique prouvée par la passation et reste distingué des fichiers déjà présents dans le dossier canonique actuel.


## Critères de fusion vers main

La branche prototype ne doit être fusionnée qu'après vérification simultanée des points suivants :

1. tests produit verts ;
2. preuve Chromium du registre individuel verte ;
3. parcours réels du créateur verts en mobile et desktop ;
4. coexistence démontrée entre PNG individuels et fallback sprite ;
5. aucun changement dans les fichiers phonétiques/corpus `data/*`, ni dans `app.js` ou `index.html` pour cette migration ;
6. provenance documentée de chaque PNG individuel ;
7. les concepts sans original individuel sûr restent sur le sprite ;
8. revue visuelle des captures de preuve ;
9. fusion explicite seulement après accord humain.

État actuel : 18/23 concepts du batch visible utilisent un PNG individuel ; bébé, œil, mer, scie et nez restent volontairement sur le sprite.


## Preuve de parcours utilisateur

Le workflow navigateur dédié exécute désormais deux niveaux de preuve :
- contrôle exhaustif de toutes les entrées du registre individuel dans Chromium mobile ;
- scénarios réels du créateur REBULO en mobile et desktop.

Scénarios mixtes explicitement couverts :
- `pili` : PIE + LIT en PNG individuels ;
- `Le chien regarde le train` : CHIEN + TRAIN en PNG individuels ;
- `Le bébé ouvre la porte` : BÉBÉ reste sur le sprite tandis que PORTE utilise son PNG individuel ;
- `merci` : MER + SCIE restent tous deux sur le sprite.

Cette matrice démontre que la migration est progressive et que l'absence d'un PNG individuel ne casse pas le rendu existant.


## Revue visuelle de la planche exhaustive

La planche Chromium exhaustive des 18 entrées du registre a été contrôlée visuellement après exécution verte.

Résultat :
- 17 assets présentent une lisibilité cohérente à l'échelle de contrôle ;
- BANC fonctionne correctement dans le pipeline, mais sa source historique n'est que de 60 × 46 px et apparaît sensiblement plus floue que le reste du lot.

Conséquence :
- BANC reste autorisé comme migration fonctionnelle, car sa provenance est prouvée et son rendu est correct ;
- BANC porte une dette graphique explicite : remplacer ultérieurement cette source par un meilleur original individuel sûr, sans modifier son identité phonétique ;
- une migration techniquement verte ne doit pas être confondue avec une homogénéité graphique parfaite.


## Preuve finale de transparence et parcours — 2026-09-22

La preuve Chromium finale de la PR #302 confirme pour les 18 PNG individuels :
- chargement réel de chaque fichier dans le navigateur ;
- dimensions naturelles non nulles et rendu à 88 × 88 px dans la sonde mobile ;
- `object-fit: contain`, aucun fond sprite, aucune ombre de boîte, rayon de boîte nul ;
- présence effective de pixels totalement transparents (`alphaMin = 0`) et de pixels visibles (`alphaMax > 0`).

Les parcours réels mobile et desktop restent verts après ce durcissement, notamment les scénarios mixtes BÉBÉ+PORTE et MER+SCIE. Les tests produit, phrases, catalogue de sons et file d'expansion de représentations sont également verts sur la même révision de PR.

Cette preuve clôt la phase de validation technique du pilote. Toute évolution suivante doit répondre à un besoin produit ou à une dette graphique documentée, et non ajouter une nouvelle couche expérimentale.
