# Atlas phonologique Rebulo

## Pourquoi cette refonte

La quantité d’images n’est pas une mesure de la qualité d’un moteur de rébus. Rebulo sépare désormais explicitement :

1. la **banque générale de dessins** ;
2. les **pièces phonétiques de rébus**, où image entière → mot entier → prononciation entière ;
3. les **unités de travail orthophonique** : phonème, syllabe documentée, rime, mot, puis phrase/conversation selon l’objectif.

Une voiture, un vélo ou une moto peuvent rester des illustrations utiles, mais ne sont pas prioritaires comme pièces de rébus simplement parce qu’ils sont faciles à dessiner.

## Fondements de la recherche

La conscience phonologique ne se réduit pas aux syllabes. Les références consultées décrivent l’analyse et la manipulation de la structure sonore à plusieurs niveaux : mot, attaque-rime, syllabe et phonème, notamment par segmentation et fusion. Les interventions sur les troubles des sons de la parole peuvent ensuite généraliser la production de cibles à des niveaux de difficulté croissants : syllabes, mots, phrases/énoncés puis parole conversationnelle.

Sources de cadrage :
- ASHA, *Speech Sound Disorders: Articulation and Phonology*: https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/
- ASHA, *Phonological Processing*: https://www.asha.org/practice-portal/clinical-topics/written-language-disorders/phonological-processing/
- Brosseau-Lapré & Roepke (2022), intervention perception de la parole et conscience phonologique chez les enfants avec troubles des sons de la parole: https://pubs.asha.org/doi/10.1044/2022_LSHSS-21-00117

Ces références servent à organiser les dimensions du logiciel. Elles ne constituent pas une validation clinique de Rebulo ni de ses pictogrammes.

## Règle centrale

Pour le mode strict :

**IMAGE ENTIÈRE → MOT CONVENTIONNEL ENTIER → PRONONCIATION ENTIÈRE.**

Le moteur ne transforme jamais `voiture /vwatyʁ/` en `/vwa/`, ni un autre mot en une lecture partielle cachée.

## Phonème, bloc sonore et syllabe

`src/phonology-atlas.js` indexe les phonèmes réellement présents dans l’IPA des mots-images et permet de rechercher un phonème :
- partout ;
- en position initiale ;
- en position médiane ;
- en position finale.

L’atlas regroupe aussi les images par **prononciation entière identique**. Cela permet de repérer plusieurs dessins correspondant réellement au même bloc sonore.

Rebulo ne déduit pas actuellement les frontières syllabiques depuis une simple chaîne IPA. Quand aucune donnée lexicale de syllabation n’est disponible, l’interface dit **bloc sonore entier** et non syllabe. `scripts/import-lexique.mjs` sait déjà importer un nombre de syllabes quand Lexique 4 le fournit ; une prochaine brique pourra exploiter ces données et, si une source fournit les frontières, construire un vrai index syllabique.

## Usage orthophonique visé

Le nouvel atlas prépare une recherche professionnelle du type :

`/ʃ/ → initiale → pièces strictes` ou `/s/ → finale → pièces strictes`.

Cela complète les activités déjà définies dans Rebulo : phonème initial/final, segmentation et fusion phonémique, comptage/fusion syllabique, dénomination et accès lexical. Les activités de rime, suppression et substitution restent distinctes et ne doivent pas être activées par simple analogie.

## Impression et dessin

La page publique `phonology-atlas.html` produit, pour le filtre courant, des cartes en noir et blanc avec :
- ID stable `RBL-*` ;
- nom ;
- IPA entière ;
- image ;
- statut strict/général ;
- nature de l’unité (`bloc sonore entier` ou, seulement si documenté, `syllabe`).

À l’impression, chaque groupe possède une copie jumelle avec les mêmes ID/noms et une case vide pour redessiner les concepts.

URL GitHub Pages après déploiement :

`https://ludodulac.github.io/Rebulo/phonology-atlas.html`

## Prochaine étape méthodologique

Ne pas ajouter une vague 4 d’images au hasard. La suite doit mesurer :
1. les phonèmes et blocs sonores déjà couverts ;
2. les sons recherchés mais pauvres en bonnes pièces strictes ;
3. les mots fréquents/pertinents réellement débloqués par chaque nouvelle pièce ;
4. les vraies syllabes lorsque la donnée de syllabation est disponible ;
5. les alternatives visuelles qui partagent exactement la même prononciation entière.
