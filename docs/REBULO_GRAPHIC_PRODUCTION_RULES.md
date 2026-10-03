# REBULO — Canon de production graphique

## Règle REBULO-059 — interdiction des dessins programmatiques

Décision humaine issue du contrôle de `lot-002`.

Un candidat présenté comme **REBULO PIXEL v1** ne doit pas être fabriqué par assemblage de primitives géométriques programmatiques (PIL, SVG généré par code, Canvas ou procédé équivalent) dans le but d'imiter la charte graphique.

Cette méthode est **interdite pour toute nouvelle proposition graphique**.

Sont autorisés :

- une génération graphique réelle conforme à la charte REBULO PIXEL v1 ;
- une image humaine ou une source existante ;
- l'extraction fidèle d'une planche `SOURCE_DO_NOT_REGENERATE` ;
- une transformation déterministe explicitement demandée par l'humain ;
- un redimensionnement ou un changement de conteneur sans altération créative.

Une extraction fidèle doit conserver toutes les composantes utiles du dessin source, y compris les éléments détachés. Un contrôle « l'objet ne touche pas le bord » n'est pas une preuve suffisante d'intégrité.

Les candidats programmatiques de REBULO-058 suivants sont définitivement refusés sous cette forme et ne doivent pas être reproposés : BANC, LIT, CORPS, EAU, MÂT, MIE, POT, RAIE, SOL, TAS, TERRE, TOUR, COR et DO.

Le script historique `scripts/rebulo-058-build-lot002-assets.py` n'est conservé que pour la reproductibilité de l'historique REBULO-058. Il ne constitue plus une méthode de production autorisée pour de nouveaux candidats.
