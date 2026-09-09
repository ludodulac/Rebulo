# Couverture des frontières syllabiques source-exact

Après l’intégration de `SyllPhono` Lexique et sa conversion stricte vers l’IPA, l’analyse complète du 9 septembre 2026 produit :

- 14 135 cibles dans le vocabulaire linguistique présélectionné ;
- 14 129 cibles avec `syllabificationStatus = source_exact` ;
- 6 cibles restant en `needs_source_review`.

Ces chiffres proviennent du workflow complet Lexique 4 exécuté sur 189 832 entrées importées. Ils mesurent la disponibilité technique de frontières syllabiques validées ; ils ne constituent ni une validation clinique, ni une autorisation automatique d’activité.

Le parcours de données attendu est désormais :

`Lexique SyllPhono → conversion IPA stricte → coverage-report → creator catalog → creator runtime → session / worksheet`

Une activité syllabique ne doit être activée que si elle consomme explicitement `syllables` avec `syllabificationStatus = source_exact` et définit une réponse attendue contrôlable.
