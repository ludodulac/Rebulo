# Rebulo — pilote de qualification éditoriale B → C

Référence main : `b149976043e089ce14f092ffb4825ae9be689431`

Statut : analyse uniquement. Aucun asset, aucune activation runtime, aucun changement UI/planner.

## Échantillon

- Cas évalués : **90**
- Contrôles positifs : **20**
- Faux négatifs historiques : **17**
- Autres cas diversifiés / V1–V5 / cas difficiles : **53**
- `humanNamingEvidence` : **none** pour 90/90
- `editorialReview` : **unreviewed** pour 90/90

## Distribution

| Classe | Nombre |
|---|---:|
| A | 44 |
| B | 31 |
| C | 6 |
| D | 9 |

## Calibration

- Contrôles positifs classés A : **20/20**
- Faux négatifs historiques retrouvés A/B : **17/17**
- Score agrégé recalculable à partir des 10 sous-scores : **90/90**
- Garde-fous de nommabilité/dessinabilité vérifiés par script.
- Aucune preuve humaine de nommage déclarée.

## Fichiers

- `data/b-to-c-editorial-pilot-90.json`
- `scripts/validate-b-to-c-editorial-pilot.mjs`
- `tests/b-to-c-editorial-pilot-calibration.test.mjs`
- `docs/B_TO_C_EDITORIAL_PILOT_REPORT.md`
