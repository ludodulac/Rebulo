# REBULO — Catalogue maître des représentations visuelles

HEAD source : `b08f020832db7b94320f162a302394cbe6bb9429`.

## Sources
- `data/rebus-sound-catalog.json`
- `data/rebus-fragment-representation-ideas.json`
- `data/rebus-productive-bank-wave1.json`
- `data/rebus-productive-bank-wave2.json`
- `data/rebus-productive-bank-wave3.json`
- `data/rebus-productive-bank-wave4.json`
- `data/rebus-productive-bank-wave5.json`
- `data/human-visual-validation-manifest-72.json`
- `data/rebulo-visual-asset-evidence-72.json`
- `data/lexicon-seed.json`

## Règles
- Modèle : **SON → MOT(S) exact(s) → REPRÉSENTATION(S)**.
- Les homophones exacts sont tous conservés.
- IMAGE = route exacte déjà retenue éditorialement avec type visuel concret explicite. Les cas ambigus vont en REVIEW au lieu d’être forcés.
- Les conventions lettre/chiffre/convention restent distinctes des IMAGE.
- Le manifest 72 est un noyau pilote de couverture visuelle, jamais la taille cible.
- Priorité : `researchPriorityScore` canonique, découpé en quartiles calculés sur les IMAGE retenues.
  - P0 : score >= 452.832
  - P1 : 334.028 <= score < 452.832
  - P2 : 0 <= score < 334.028
  - P3 : score < 0

## Résultats
- Relations exactes examinées : **2384**.
- Lignes candidates totales (exactes + conventions) : **2402**.
- Représentations IMAGE retenues : **461**.
- IMAGE déjà couvertes par une preuve d’asset : **54**.
- **TOTAL IMAGE À PRODUIRE = 407**.
- REVIEW : **1921**.
- Répartition IMAGE : P0=116, P1=115, P2=230, P3=0.

## Limites
- `humanNamingEvidence` reste `none` lorsqu’aucune expérience humaine n’existe.
- Un asset runtime historique/OpenMoji peut être noté existant sans être considéré comme un asset REBULO PIXEL validé.
- Le snapshot Drive des 72 est horodaté ; toute évolution du registre doit entraîner sa régénération avant un nouvel audit de couverture.
- Les relations lexicales sans route visuelle retenue restent dans le catalogue et ne sont pas silencieusement supprimées.
