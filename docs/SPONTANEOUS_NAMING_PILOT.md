# Pilote minimal de nommage spontané

Statut : **préparé, aucune donnée humaine collectée**.

## Question

Pour un stimulus isolé : **« Qu’est-ce que tu vois ? »**

Le but n’est pas de demander si l’image « ressemble à » la cible, mais de conserver le mot réellement produit sans contexte.

## Procédure minimale

1. Ouvrir le stimulus seul. Ne montrer ni IPA, ni cible éditoriale, ni liste de réponses.
2. Poser uniquement : « Qu’est-ce que tu vois ? »
3. Copier la première réponse littérale dans `spontaneous_response_literal`.
4. Si plusieurs mots arrivent spontanément, garder les suivants dans `additional_spontaneous_words_literal`, dans l’ordre.
5. Ne pas corriger, valider ou invalider la réponse.
6. Aucun choix multiple avant cette réponse.
7. Un indice éventuel n'arrive qu'ensuite et va dans les champs `hint_given_after_spontaneous_response` / `post_hint_response_literal`.
8. Utiliser un code participant non identifiant. Ne pas stocker de nom, adresse, email ou autre donnée personnelle inutile.

Le manifeste `data/rebus-spontaneous-naming-pilot.json` contient les 8 stimuli de départ et les ambiguïtés éditoriales connues. Ces métadonnées sont réservées au collecteur et ne doivent pas être montrées avant la réponse.

La feuille vide `data/rebus-spontaneous-naming-responses-template.csv` est le format de collecte. Elle ne contient volontairement aucune ligne participant.

## Ensemble initial

- `croix-stimulus-v1.svg`
- `doigt-stimulus-v1.svg`
- `oeufs-stimulus-v1.svg`
- `oie-stimulus-v1.svg`
- `pelle-stimulus-v1.svg`
- `radis-stimulus-v1.svg`
- `carre-stimulus-v1.svg`
- `fou-echecs-stimulus-v1.svg`

Cet ensemble contraste symbole/objet, partie du corps, singulier/pluriel, espèces voisines, outils proches, légumes proches, forme géométrique et pièce d'échecs.

## Niveau de preuve

La préparation du protocole ne change aucune preuve : `spontaneousNamingRisk = unknown`, `humanNamingEvidence = none`, `clinicalEvidence = none`. Une réponse d'IA, une inspection éditoriale ou la simple existence d'un SVG ne compte jamais comme observation humaine.
