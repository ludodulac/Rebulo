# Rebulo — benchmark de phrases réelles

> Indicateur de régression : il mesure la diversité et la couverture des chemins, pas leur qualité humaine finale.

- Phrases : 6.
- Prononciations lexicales entièrement résolues : 6.
- Phrases avec au moins un chemin complet : 0.
- Phrases avec au moins un chemin complet traversant une frontière de mots : 0.
- Phrases présentant au moins une route candidate qui traverse une frontière de mots : 6.
- Couverture moyenne du meilleur chemin actuel : 71.0%.
- Nombre moyen de découpages complets distincts : 0.

| Phrase | IPA résolue | Meilleure couverture | Unités manquantes | Chemins complets | Traversée de mots | Plus longue pièce |
|---|---|---:|---:|---:|---:|---:|
| Elles ne sont pas cuites les pâtes | oui | 76.5% | 4 | 0 | 9 | 3 |
| Elle a mis le livre sur la table | oui | 80.0% | 4 | 0 | 8 | 4 |
| Le petit chat regarde la pluie | oui | 80.0% | 4 | 0 | 7 | 5 |
| On prépare un gâteau pour demain | oui | 63.2% | 7 | 0 | 20 | 3 |
| Tu prends le train ce matin | oui | 50.0% | 8 | 0 | 19 | 3 |
| Il range son manteau dans la voiture | oui | 76.2% | 5 | 0 | 20 | 6 |

## Lecture

Une progression saine peut d’abord se voir par une réduction des trous et une hausse de la couverture partielle avant l’apparition de chemins complets. Une hausse du nombre de chemins n’est pas automatiquement un progrès : les prototypes et observations humaines doivent ensuite dire si les nouvelles routes sont réellement nommables et compréhensibles.
