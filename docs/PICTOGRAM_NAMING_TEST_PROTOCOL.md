# Rebulo — protocole court de dénomination des pictogrammes

Ce protocole sert à décider si une image peut entrer dans la banque phonétique active de Rebulo. Il ne constitue pas une norme clinique validée ni un outil diagnostique ; c’est un garde-fou opérationnel du projet.

## Principe

Une image n’est utile à Rebulo que si elle provoque spontanément le **mot entier attendu**, avec la **prononciation entière attendue**, sans indice caché.

## Comparaison de prototypes avant passation

Lorsqu’un concept prometteur dispose d’un visuel ambigu, Rebulo peut conserver plusieurs prototypes de recherche avant tout test participant. Ces comparaisons sont enregistrées dans `data/pictogram-prototype-comparisons.json`.

Pour chaque candidat, conserver :
- l’asset exact et sa provenance ;
- son état de disponibilité ;
- l’intention visuelle du prototype ;
- les **risques de dénomination anticipés**, clairement identifiés comme hypothèses et jamais comme réponses observées ;
- l’état du futur test de dénomination.

Une comparaison de prototypes ne vaut ni test de dénomination, ni validation clinique, ni activation. Tant qu’aucune décision humaine documentée n’existe, le concept concerné reste inactif. L’ajout d’un meilleur candidat visuel doit compléter la comparaison existante plutôt que supprimer silencieusement le prototype précédent.

## Passation

1. Montrer le pictogramme seul, sans mot écrit, sans rébus et sans contexte.
2. Demander simplement : **« Qu’est-ce que c’est ? »**
3. Noter la **première réponse spontanée mot pour mot**.
4. Ne donner ni premier son, ni choix de réponses, ni correction avant l’enregistrement de cette première réponse.
5. Noter séparément les absences de réponse, hésitations et réponses concurrentes.
6. Tester séparément les publics dont les performances peuvent différer fortement : âge, niveau de langage ou besoins cognitifs particuliers.

## Données minimales à conserver

Pour chaque pictogramme :
- concept et IPA cible ;
- fichier image exact et version/source ;
- population testée ;
- nombre de participants ;
- consigne exacte ;
- réponses spontanées brutes ;
- fréquence du label cible ;
- principales réponses concurrentes ;
- décision et nom de la personne ayant relu les résultats.

## Décision Rebulo

- **Actif en prototype** : le mot cible paraît immédiatement reconnaissable et le risque concurrent est jugé faible, mais la validation formelle reste à faire (`prototype_priority`).
- **Test requis** : une réponse concurrente plausible changerait la valeur phonétique de l’image (`naming_test_required`). L’image reste hors segmentation automatique.
- **Pas d’image adaptée** : aucun visuel assez direct n’est disponible (`no_suitable_asset`).
- **Relu cliniquement** : les réponses ont été examinées par un professionnel ; ce statut ne signifie pas automatiquement approbation générale (`clinical_reviewed`).
- **Validé clinique** : réservé à une décision explicite documentée (`clinical_approved`). Rebulo ne déduit jamais ce statut automatiquement d’un taux ou d’un score.

## Règle de sécurité

Le rendement lexical ne prime jamais sur la dénomination. Si une image débloque beaucoup de mots mais provoque fréquemment un autre nom — par exemple « goutte » au lieu de « eau » — elle reste inactive.

La règle phonétique reste inchangée : **IMAGE ENTIÈRE → MOT CONVENTIONNEL ENTIER → PRONONCIATION ENTIÈRE**.
