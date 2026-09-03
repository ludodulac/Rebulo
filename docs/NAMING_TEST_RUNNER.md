# Rebulo — interface locale de test de dénomination

`naming-test.html` fournit une interface légère pour exécuter les comparaisons de prototypes décrites dans `data/pictogram-prototype-comparisons.json`.

## Utilisation

1. Ouvrir `naming-test.html` depuis le site Rebulo déployé.
2. Choisir un concept (`pot`, `dos`, etc.).
3. Saisir un code de session anonyme, sans nom ni information personnelle.
4. Choisir un ordre de prototypes : aléatoire, A → B ou B → A.
5. Montrer chaque image seule et demander exactement : « Qu’est-ce que c’est ? ».
6. Noter uniquement la première réponse spontanée, avec hésitation ou absence de réponse si nécessaire.
7. Exporter le JSON à la fin de la passation.

## Garde-fous

- Les observations restent en mémoire dans l’onglet ; aucun stockage navigateur persistant n’est utilisé.
- Aucun envoi serveur n’est effectué.
- L’export ne contient pas de nom, âge, diagnostic ou autre donnée personnelle.
- Les observations brutes ne valent ni activation du pictogramme, ni validation clinique.
- Toute décision d’activation reste humaine et séparée du runner.
