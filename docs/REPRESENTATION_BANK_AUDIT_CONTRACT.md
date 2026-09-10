# Rebulo — contrat de l’audit de banque de représentations

Ce contrat empêche la vue produit de confondre couverture phonétique et qualité visuelle.

## Dénominateur

Le catalogue sonore exhaustif reste la source des segments. La vue produit donne priorité aux lignes dont `usefulTargetCount > 0`. Un segment utile est un segment observé dans le vocabulaire utile Rebulo ; ce n’est pas une validation pédagogique ou clinique.

## Catégories A–I

Les catégories A–H peuvent se chevaucher.

- **A** : au moins un mot français de Lexique possède exactement la prononciation du segment.
- **B** : plusieurs mots exacts sont disponibles.
- **C** : un mot exact existe, mais aucune image exacte prête ni prototype visuel curaté n’est disponible. C signifie « travail visuel restant », pas « mauvais mot ».
- **D** : un asset de pictogramme exact est déjà prêt dans la banque. Cela ne signifie pas que sa dénomination humaine a été validée ; les métadonnées de nommabilité/validation restent distinctes.
- **E** : au moins une approximation classée `light` par le moteur existant est disponible. E ne donne jamais le statut strict.
- **F** : le segment peut être concaténé exactement à partir de 2–3 pictogrammes exacts prêts.
- **G** : une lettre peut représenter exactement le segment selon son nom conventionnel enregistré.
- **H** : un chiffre/nombre peut représenter exactement le segment selon son nom conventionnel enregistré.
- **I** : aucune route actuellement considérée raisonnable n’est disponible : pas d’image exacte prête, pas de composition exacte prête, pas de lettre/nombre/note visible, pas de prototype visuel curaté et pas de petite approximation réutilisant un asset existant.

Un candidat Lexique non revu ne suffit volontairement pas à sortir de I. Le but est d’éviter d’afficher un taux de couverture artificiellement élevé fondé sur des mots impossibles à illustrer ou à nommer.

## Nommabilité

Les axes suivants restent explicitement distincts :

`prononciation exacte ≠ mot attesté ≠ concept dessinable ≠ stimulus évident ≠ dénomination humaine stable ≠ validation clinique`.

L’audit peut compter un asset dans D parce qu’il existe et possède une lecture exacte, mais doit conserver son statut de curation/validation. Le rapport ne doit jamais transformer `visualConfidence`, `labelStability`, `prototype_candidate` ou `clinicalStatus: unreviewed` en preuve humaine.

## Compositions

Une route F ne peut utiliser que des pièces déjà classées `exact_image_ready`. Les prononciations des pièces doivent concaténer exactement le segment cible. Aucune suppression, substitution ou liaison inventée n’est permise dans F.

## Approximations

E réutilise le moteur `src/rebus-approximation.js`. Les niveaux `light`, `loose` et `too_far` restent inchangés. La vue produit ne promeut aucune approximation en strict et ne modifie pas les politiques orthophoniques.

## Frontière des images de production

Le runtime part de `data/lexicon-seed.json`, puis ajoute les vagues OpenMoji en évitant les doublons d’id ou de label. Une entrée du seed garde donc la priorité visuelle pour son concept. Les assets de `assets/research/` restent hors production tant qu’une migration explicite ne les promeut pas.

Cette règle doit rester visible dans l’audit afin qu’un nouveau pictogramme retrouvé ou ajouté ne soit jamais supposé actif simplement parce que son fichier existe.
