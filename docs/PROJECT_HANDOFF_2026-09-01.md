# Rebulo — état opérationnel / passation

Ce fichier conserve **l'état de travail utile entre conversations**. Il n'est plus le point d'entrée général : commencer par `AI_START_HERE.md`.

Ne recopier ici ni les principes stables (`docs/PRODUCT_PRINCIPLES.md`), ni les métriques générées, ni la chronologie complète des PR. Pour l'historique d'une décision, consulter `docs/PROGRESSION.md`, Git et les PR concernées seulement si nécessaire.

## État vérifié à la dernière passation

- Le moteur `strict` conserve la garantie image entière → mot entier → prononciation entière, avec concaténation phonétique exacte.
- Les conventions générales non strictes restent explicites et séparées du strict.
- La provenance et les révisions des assets actifs ont été réconciliées dans `data/asset-sources.json` ; la provenance n'implique aucune validation humaine ou clinique.
- Chaque pictogramme actif dispose d'une review de dénomination liée à sa révision exacte dans `data/production-naming-reviews.json` ; le prochain gate de ces reviews est une vraie observation humaine.
- Les comparaisons de prototypes restent séparées des reviews de production, même lorsqu'elles portent sur le même concept. Ne jamais transférer silencieusement les observations d'une révision vers une autre.
- Les deux stimuli aveugles `heure-scene-a-v1` et `heure-scene-b-v1` existent dans `assets/research/` et sont prêts pour une vraie passation de dénomination ; aucun résultat ne doit être inventé.
- Les opérations générales actuellement prêtes pour test de compréhension ont un protocole canonique dans `data/general-operation-comprehension-tests.json` et un runner local `general-operation-comprehension-test.html` / `.js` ; aucune promotion automatique n'est autorisée.
- `IN/UN` restent bloqués tant qu'une preuve grapheme↔phonème suffisamment fiable manque. Ne pas les résoudre par heuristique orthographique opportuniste.

Les nombres courants de mots, d'assets, de couverture ou de gates doivent être lus dans les rapports/données réels ou régénérés avec les scripts du dépôt. Ne pas les recopier ici comme constantes.

## Gates humains encore réels

### Dénomination des pictogrammes

Utiliser `naming-test.html` pour les vraies passations et `naming-review.html` pour la revue. Conserver :
- première réponse spontanée verbatim ;
- hésitation ;
- absence de réponse ;
- réponses concurrentes ;
- lien exact avec la révision du stimulus.

Une observation humaine n'est pas une validation clinique.

### Compréhension des opérations générales

Utiliser `general-operation-comprehension-test.html`. Le registre canonique est `data/general-operation-comprehension-tests.json`.

Ne jamais promouvoir une opération vers `comprehension_tested` ou `authorized_general` sans données humaines réelles et décision explicite selon le modèle de readiness.

## Prochaine priorité utile

Avant de choisir un nouveau chantier, vérifier `main`, les PR/issues ouvertes, la CI et les données actuelles. Les prochains travaux utiles doivent partir des gates réellement ouverts, pas d'un ancien résumé de conversation.

Si aucune nouvelle observation humaine n'est disponible, privilégier les tâches techniques ou de recherche qui réduisent un blocage réel sans inventer de résultats : cohérence des données, pipeline de vocabulaire utile, audits ciblés, UX ou outillage de passation.

## Sources de vérité pour reprendre

Lire d'abord `AI_START_HERE.md`, puis seulement la zone concernée. Les sources opérationnelles les plus fréquentes sont :

- constitution : `docs/PRODUCT_PRINCIPLES.md` ;
- strict/construction : `src/phonetic-engine.js`, `src/rebus-construction.js` et tests associés ;
- corpus/couverture : `docs/LEXICAL_PIPELINE.md`, données et scripts générateurs concernés ;
- pictogrammes : `docs/GUARANTEE_MODEL.md`, `data/asset-sources.json`, `data/production-naming-reviews.json`, `data/pictogram-prototype-comparisons.json` ;
- opérations générales : `data/general-operation-readiness.json`, `data/general-operation-comprehension-tests.json`, modules/tests `general-operation-*` ;
- historique seulement si nécessaire : `docs/PROGRESSION.md`, PR, commits et issue roadmap.

## Format recommandé pour la prochaine passation

Mettre à jour ce fichier seulement après un lot important, avec quelques lignes couvrant :

1. modification réellement fusionnée ;
2. vérifications effectuées ;
3. hypothèses ou observations humaines encore absentes ;
4. blocage réel ;
5. prochaine priorité ;
6. fichiers à relire pour reprendre.

Pas de roman chronologique, pas de copie de rapports, pas de nouvelle passation concurrente.
