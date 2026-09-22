# Migration progressive vers des pictogrammes individuels

## But

Remplacer progressivement les anciens visuels de REBULO sans modifier le moteur phonétique, les décompositions ni les contenus thérapeutiques.

## Contrat

L'identité phonétique reste portée par le concept (par exemple `rat`, `/ʁa/`).
Le visuel est une ressource interchangeable.

La table `INDIVIDUAL_IMAGES` dans `src/rebulo-visible-batch1-assets.js` est le point de routage temporaire :

- si un concept possède un fichier individuel, REBULO utilise ce fichier ;
- sinon il conserve automatiquement la case correspondante de `assets/visible-batch1/sprite.svg`.

Cela permet une migration pictogramme par pictogramme.

## Prototype de référence

`rat` et `chat` utilisent désormais leurs PNG individuels :

- `assets/visible-batch1/individual/rat.png`
- `assets/visible-batch1/individual/chat.png`

Les 21 autres éléments du batch visible continuent d'utiliser le sprite. Le deuxième asset CHAT a servi à prouver que la migration est pilotée par le registre et n'est pas un cas spécial RAT.

## Conditions techniques avant activation d'un dessin

1. sujet unique et identité conceptuelle certaine ;
2. fichier individuel, jamais une découpe opportuniste d'une planche composite ;
3. PNG réel ;
4. RGBA (type couleur PNG 6) et transparence adaptée ;
5. cadrage lisible à petite taille ;
6. absence de texte/décor parasite sauf cas explicitement prévu ;
7. fichier ajouté dans `assets/visible-batch1/individual/` ;
8. concept ajouté à `INDIVIDUAL_IMAGES` ;
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

Une migration supplémentaire se réduit maintenant à deux opérations fonctionnelles : ajouter le PNG individuel et ajouter l'association `concept -> chemin`. Les tests doivent ensuite prouver que les autres concepts conservent leur fallback sprite.

Le registre pourra être extrait ultérieurement dans un fichier de données dédié lorsque le nombre d'assets individuels justifiera cette séparation. Le prototype évite volontairement une refonte prématurée.


## État du batch visible — 2026-09-22

Le registre individuel couvre désormais 18 concepts sur 23 : banc, chat, cheval, chien, couteau, lit, livre, nid, pie, pied, pomme, porte, rat, route, soleil, table, train, voiture.

Le navigateur mobile contrôle maintenant automatiquement toutes les entrées du registre, et non plus seulement RAT/CHAT.

Cinq concepts restent volontairement sur le sprite tant qu'un original individuel de provenance sûre n'est pas disponible : bébé, œil, mer, scie, nez.

Provenance connue des blocages :
- œil et scie : source existante, extraction individuelle bloquée ;
- mer : individuel historique prouvé mais actuellement inaccessible ;
- bébé : identifié historiquement comme à extraire depuis une source ;
- nez : aucun original individuel sûr retrouvé dans le dossier canonique lors de cette passe.

BANC est une récupération historique prouvée par la passation et reste distingué des fichiers déjà présents dans le dossier canonique actuel.
