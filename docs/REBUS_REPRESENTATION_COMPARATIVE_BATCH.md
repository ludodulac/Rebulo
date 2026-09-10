# Rebulo — lot comparatif de représentations

Ce lot n'est ni une nouvelle banque de pictogrammes, ni un score automatique. Il sert à confronter plusieurs profils de représentation aux mêmes propriétés avant d'enrichir la cartographie globale des sons.

## Règle de lecture

`exact phonétiquement ≠ approximation ludique ≠ mot pertinent ≠ concept dessinable ≠ image spontanément nommable ≠ stimulus orthophonique validé`

Les champs de nommabilité restent volontairement inconnus tant qu'aucune observation humaine ne les documente. La fréquence, la concrétude ou la simplicité graphique sont ici des hypothèses de sélection, jamais des garanties.

| Profil | Son | Candidat / représentation | Asset existant ? | Ce que le cas permet d'observer | Risque de dénomination | Décision suivante |
|---|---|---|---|---|---|---|
| objet concret spécifique | /ni/ | nid | oui, `assets/research/nid-comic-v1.svg` | objet central unique, structure de nid dominante, pas de texte ni de distracteur majeur | inconnu sans observation humaine | tester l'asset existant avant toute refonte |
| mot exact visuellement ambigu | /ku/ | cou | non | concrétude élevée mais concurrence gorge/nuque; tester le besoin d'un pointeur | inconnu | comparer version sans indice et avec pointeur discret |
| fenêtre longue exacte | /kɔ̃pa/ | compas | non | vérifier qu'une pièce de deux syllabes très spécifique peut battre deux petites pièces ambiguës | inconnu | prototyper une seule version sobre et comparer aux découpages courts |
| convention visible préférable | /a/ | lettre A plutôt que `ha` | pas d'asset requis pour conclure sur le type | le problème est la route représentationnelle, pas la phonétique : `ha` n'offre pas d'objet naturel, A est une convention explicite | compréhension de convention inconnue | tester la convention séparément de la nommabilité d'objets |
| approximation ludique | cible /le/, source `lait` /lɛ/ | image de lait, mode général seulement | non | concept potentiellement très dessinable mais non exact phonétiquement | inconnu | conserver comme fallback marqué; jamais strict |
| matière concrète ambiguë | /bu/ | boue | non | contraste utile avec nid : catégorie matière, concurrence terre/flaque/saleté | inconnu | tester si la faible spécificité d'objet prédit davantage de variantes lexicales |

## Cas de réalité déjà inspecté : nid

L'asset existant dessine un seul nid brun, centré sur fond blanc. La forme en cuvette et les brindilles occupent l'essentiel du stimulus; aucun oiseau, arbre, œuf ou texte ne vient imposer une autre réponse. Cela rend l'hypothèse `objet spécifique + peu de distracteurs → meilleure stabilité de dénomination` plausible, mais **pas encore démontrée**.

Le bon test n'est donc pas de redessiner immédiatement le nid. Il faut d'abord recueillir quelques réponses spontanées sur cette version. Si les réponses convergent vers `nid` ou `nid d'oiseau`, cela donnera un premier appui à l'hypothèse. Si elles convergent vers `panier`, `bol` ou autre chose, il faudra corriger le modèle de sélection avant d'étendre la vague graphique.

## Ce qu'on cherche à apprendre

Les propriétés candidates sont : concurrence lexicale, concrétude, spécificité de l'objet, complexité graphique, besoin d'un indice, fréquence lexicale et stabilité attendue de dénomination. Elles restent des variables descriptives. Aucune formule ne les agrège encore en score fiable.

Le lot a été choisi pour mettre ces propriétés en tension : `nid` et `boue` sont tous deux concrets mais diffèrent fortement en spécificité; `cou` est concret mais anatomiquement concurrentiel; `compas` teste le bénéfice d'une fenêtre de deux syllabes; `A` teste une convention mieux adaptée qu'un faux pictogramme; `lait → /le/` vérifie qu'une bonne image ne doit jamais effacer une approximation phonétique.

## Porte de généralisation

On ne réinjecte une propriété dans la cartographie des 5 504 sons que si plusieurs cas montrent un motif répétable, et si la propriété concerne la nommabilité, après observation humaine. Jusqu'à cette étape, `visualPotential` et `namingRisk` peuvent rester `unknown`.

Le benchmark de phrases reste un contrôle périodique. Une amélioration de la banque peut faire monter la couverture ou la diversité de chemins; l'absence de gain immédiat n'autorise pas à relâcher les règles de preuve.
