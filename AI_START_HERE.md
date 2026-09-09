# Rebulo — AI start here

Ce fichier est un **routeur de contexte**, pas une encyclopédie. Il ne remplace ni le code, ni les données, ni les tests, ni `docs/PRODUCT_PRINCIPLES.md`.

## Contexte transversal

Rebulo appartient à l'écosystème documenté dans **`ludodulac/Grand-p-re-`**. Le slug GitHub utilise des tirets à la place des caractères accentués de « Grand Père ».

Dans une nouvelle conversation : ouvrir d'abord `ludodulac/Grand-p-re-` sur `main`, lire `AI_START_HERE.md`, suivre `projects/_INDEX.md` vers la fiche Rebulo et appliquer `LOOP_ENGINEERING.md` pour le travail itératif ; revenir ensuite ici. **Rebulo reste la source de vérité de son état réel. Grand Père apporte contexte transversal et méthode, jamais un substitut au code/tests/données locaux.**

**Ne lire que la documentation pertinente à la zone touchée. Ne pas relire tout Rebulo par défaut.**

## 1. Avant d'agir

1. vérifier le HEAD réel de `main`, commits récents, PR/issues et CI pertinentes ;
2. si l'interface déployée est concernée, vérifier GitHub Pages ;
3. inspecter code, données et tests de la zone ;
4. utiliser `docs/_INDEX.md` pour le routage local ;
5. travailler sur une branche dédiée lorsque le workflow courant l'exige.

## 2. Hiérarchie de vérité

1. code + données + tests + état déployé pertinent ;
2. `docs/PRODUCT_PRINCIPLES.md` ;
3. contrats/modèles spécialisés ;
4. handoff opérationnel à revérifier ;
5. historique.

## 3. Constitution à préserver

- cœur strict phonétique, jamais simple ressemblance orthographique ;
- image stricte = mot entier + prononciation entière ;
- concaténation exacte de la prononciation cible ;
- `Aucune solution exacte` est normal ;
- convention non stricte explicite, nommée et testable ;
- phonologie, clarté lexicale, nommabilité visuelle, âge, observation humaine et validation clinique sont des niveaux distincts.

## 4. Routage

Utiliser `docs/_INDEX.md`. En particulier :
- moteur strict → principes + moteur phonétique/construction + tests ;
- corpus → pipeline lexical + données réellement consommées + scripts/tests ;
- images/dénomination → guarantee model + assets + naming reviews/tests ;
- UX → HTML/CSS/runtime réellement chargés + tests ciblés ;
- clinique → uniquement si la tâche est réellement clinique.

Priorité produit corpus : `vocabulaire utile → prononciations → décompositions → chunks → candidats lexicaux → clarté humaine → nommabilité visuelle → qualité → illustrations`.

## 5. Boucle de travail

Pour une question humaine/lexicale, préférer :
`stimulus → réponse humaine → phonologie → clarté lexicale → représentation/nommabilité → première frontière responsable → correction minimale → nouveau test`.

Ne pas corriger une ambiguïté de classe par une blacklist locale avant d'avoir identifié sa cause générale. Une CI verte ne prouve ni compréhension enfant ni validation clinique.

Après chaque boucle : preuve → CONTINUE / PIVOT / STOP. Ne pas étendre corpus ou activités uniquement parce que la technique le permet.

## 6. Validation

Utiliser les scripts définis par le `package.json` actuel et les tests ciblés de la zone. Pour un lot transversal/risqué, utiliser la validation complète prévue par le dépôt. Les gates humains restent explicitement humains.

## 7. Passation

Ne pas créer un nouveau handoff concurrent. Conserver seulement ce qui a réellement changé/vérifié, ce qui reste hypothétique ou humainement non testé, les blocages et la prochaine priorité. Une boucle en cours doit rester reconstructible par : **objectif / dernière boucle / preuve / prochaine décision**.

Reprise minimale : `Grand Père → fiche Rebulo / LOOP_ENGINEERING → Rebulo AI_START_HERE → état réel main/CI/PR → docs/_INDEX → fichiers/tests de la zone`.
