# Gate de contexte lexical

Statut : **preuve technique, pas filtre produit**.

Le cas observé `auras` montre une frontière précise : Lexique connaît la forme, son lemme et sa catégorie grammaticale, mais l'ancien rapport de couverture ne sérialisait pas le lemme. Une couche produit en aval ne pouvait donc pas distinguer proprement une forme strictement constructible d'une forme lexicalement peu autonome sans réinventer l'information.

La correction minimale conserve désormais `lemma`, `pos` et `sourceSyllabification` dans les lignes constructibles, les exemples de segments manquants et les candidats homophones exacts.

Cette modification **ne retire pas `auras`**, ne bannit pas les verbes ou formes fléchies, et ne prétend pas définir automatiquement la clarté lexicale. Elle restaure seulement la vérité source nécessaire à une décision ultérieure fondée sur des cas observés.

Boucle suivante : `forme constructible → contexte lexical disponible → observation de l'ambiguïté réelle → règle minimale justifiée → test de non-régression`.
