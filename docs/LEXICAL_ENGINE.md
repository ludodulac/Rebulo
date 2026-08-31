# Rebulo — moteur lexical et phonétique

## Objectif

Le moteur ne génère pas un rébus à partir de ressemblances orthographiques. Il part de la forme phonologique française du mot cible et cherche une concaténation exacte de dénominations de pictogrammes validées.

## Source lexicale principale

Lexique 4 est retenu comme source lexicale principale pour les formes françaises, leurs représentations phonologiques et leurs fréquences. La base est distribuée sous licence CC BY-SA 4.0. Toute intégration de données Lexique devra conserver attribution et conditions de partage compatibles.

Manulex est une excellente ressource pour les fréquences rencontrées par les enfants, mais sa licence CC BY-NC-SA 3.0 impose une restriction non commerciale. Les données Manulex ne sont donc pas embarquées dans Rebulo à ce stade. Elles peuvent servir à la recherche interne tant que l'usage respecte leur licence.

## Pipeline prévu

1. Charger une liste de mots français avec transcription phonologique canonique.
2. Filtrer selon fréquence, catégorie grammaticale, âge/niveau et pertinence thérapeutique.
3. Chercher les segmentations exactes dans `data/lexicon-seed.json` puis dans le futur lexique complet des pictogrammes.
4. Refuser toute segmentation qui nécessite une suppression implicite, un changement de phonème ou une dénomination artificielle.
5. Classer les solutions par stabilité de dénomination, reconnaissance visuelle, nombre de pièces et ambiguïté.
6. Placer les candidats en statut `experimental`.
7. Faire une validation linguistique puis orthophonique avant passage en `validated`.

## Règle d'or

Un pictogramme entier fournit le son entier de sa dénomination validée.

Exemple accepté :

- mer /mɛʁ/ + scie /si/ -> merci /mɛʁsi/

Exemple rejeté :

- riz /ʁi/ + bus /bys/ -> /ʁibys/, différent de rébus /ʁebys/

Exemple rejeté :

- vache /vaʃ/ utilisée implicitement comme /va/

## Architecture

- `src/phonetic-engine.js` : normalisation IPA, concaténation, validation stricte, recherche de segmentations.
- `data/lexicon-seed.json` : premières unités pictographiques avec label, IPA, confiance visuelle et stabilité lexicale.
- `data/phonetic-rules.json` : règles officielles.
- `tests/phonetic-engine.test.mjs` : tests empêchant la réintroduction d'erreurs connues.

## Étape suivante

Créer un script d'import de Lexique 4 qui transforme les colonnes utiles en un format compact Rebulo, sans recopier de champs inutiles. Puis exécuter le moteur sur une liste de mots fréquents et extraire :

- les mots déjà composables ;
- les sons manquants ;
- les pictogrammes qui augmenteraient le plus la couverture du corpus thérapeutique.
