# Rebulo — niveaux de garantie des pictogrammes

Ce document rend explicites des distinctions déjà présentes dans les données de Rebulo. Il n'active aucun pictogramme et ne crée aucune validation clinique.

## Niveaux

1. `general_illustration` — un asset existe et peut illustrer un concept. Cela ne prouve pas sa dénomination spontanée.
2. `phonetic_structured` — l'asset est associé à une lecture phonétique structurée. Cela ne prouve ni la reconnaissabilité du dessin ni une validation clinique.
3. `naming_review_planned` — un protocole de dénomination est défini pour une révision exacte du stimulus. Les `namingRisks` restent des hypothèses pré-test.
4. `human_observed` — au moins un test de dénomination lié à cette révision est explicitement marqué `completed`. Un test `scheduled` ou une décision de recherche ne suffit pas.
5. `clinically_validated` — réservé à une validation clinique explicitement enregistrée. Rebulo ne l'infère jamais d'une activation, d'une attestation de rébus, d'un test de dénomination ou d'une décision produit.

Ces niveaux sont cumulatifs dans l'audit, mais ils décrivent des garanties différentes. Une construction strictement exacte peut utiliser un pictogramme dont la dénomination reste ambiguë ; l'exactitude phonétique de la construction et la maturité du stimulus ne doivent pas être confondues.

## Ambiguïtés de dénomination

Un stimulus n'est pas forcé dans un mapping visuel → mot unique. L'audit produit une liste de candidats :

- la cible déclarée (`declared_target`) ;
- les dénominations concurrentes déjà documentées comme risques (`declared_naming_risk`).

Tant qu'aucune donnée de population ou de contexte n'existe, les champs correspondants restent `unspecified`. On ne déduit pas qu'un enfant, un adulte ou une population clinique nommera l'image d'une manière particulière sans observations réelles.

## Audit reproductible

`npm run audit:pictogram-guarantees`

L'audit lit les sources existantes sans les modifier :

- `data/lexicon-seed.json`
- `data/production-naming-reviews.json`
- `data/pictogram-prototype-comparisons.json`

Il permet de voir la maturité déclarée et les ambiguïtés documentées sans changer la couverture Exact, les assets actifs ou les décisions humaines.
