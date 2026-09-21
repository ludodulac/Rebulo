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
