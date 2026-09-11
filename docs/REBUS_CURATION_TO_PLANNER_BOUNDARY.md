# Rebulo — frontière curation → route planifiable

Cette note décrit le contrat **déjà présent dans le code**. Elle n'ajoute aucune règle de promotion.

## Ce qu'un `prototype_candidate` signifie

Un `prototype_candidate` est une décision éditoriale : le mot est phonétiquement exact pour le son ciblé et le concept paraît assez intéressant pour être matérialisé ou testé. Cela ne constitue ni une preuve de dénomination spontanée, ni une validation clinique, ni une activation automatique.

Tant qu'aucune observation humaine n'existe :

- `spontaneousNamingRisk = unknown` ;
- `humanNamingEvidence = none` ;
- `clinicalEvidence = none`.

## Ce que le planificateur consomme réellement

`src/rebus-representation-paths.js` construit ses options exactes à partir des `exactImages` / `exactImageRepresentations` de la banque et des conventions visibles explicites. Une image exacte utilisable doit donc avoir franchi la frontière de la banque elle-même.

Dans le catalogue, `src/rebus-sound-catalog.js` classe une représentation entière comme `exact_image_ready` seulement si :

1. son type est une image/pictogramme/scène de mot entier ;
2. son statut est `active` ;
3. un asset image est présent ;
4. l'IPA enregistrée correspond exactement au son représenté ;
5. `strictEligible` n'est pas `false` pour un usage strict.

Les lettres, nombres et notes suivent une autre route : ils doivent déjà exister comme conventions canoniques explicites, avec leur lecture stockée. Une approximation ne devient jamais stricte par curation ou par score.

## Ce qui ne suffit pas

Les éléments suivants ne franchissent pas cette frontière à eux seuls :

- une ligne `prototype_candidate` ;
- un SVG dans `assets/research` ;
- une forte plausibilité visuelle éditoriale ;
- un asset dont l'IPA enregistrée diffère du son ciblé ;
- la présence d'un homophone lexical exact ;
- une approximation ludique.

## Audit de la vague 8

La vague 8 sélectionne ses promotions dans les sons encore classés `exact_lexical_candidates_need_visual_evidence`. Aucun de ses nouveaux prototypes ne possède déjà, au moment de la sélection, une image entière active et phonétiquement exacte que le planificateur oublierait seulement d'intégrer.

Trois cas `/o…/` illustrent particulièrement la séparation :

- `/oʁɛj/ → oreille` a un concept OpenMoji voisin enregistré `/ɔʁɛj/` ;
- `/oʁɑ̃ʒ/ → orange` a un concept OpenMoji voisin enregistré `/ɔʁɑ̃ʒ/` ;
- `/omaʁ/ → homard` a un concept OpenMoji voisin enregistré `/ɔmaʁ/`.

Ces assets peuvent informer la conception visuelle, mais **leur IPA enregistrée ne permet pas une réutilisation stricte** pour les cibles en `/o…/`. La vague 8 ne modifie donc ni leur IPA, ni `strictEligible`, ni le planificateur.

Conclusion : `plannerReadyPromotionCount = 0` pour cette vague. C'est un résultat conservateur attendu, pas un défaut d'intégration.
