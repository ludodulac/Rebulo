# Grande bibliothèque visuelle et phonétique Rebulo

## But

Rebulo ne doit pas dépendre d'une poignée de pictogrammes. La bibliothèque est désormais pensée comme une ressource extensible : illustrations générales, concepts phonétiques structurés, puis éventuelle revue clinique séparée.

Cette première extension massive ajoute plus de 100 concepts visuels usuels et les relie à une prononciation française entière. Elle ne change pas la règle du mode strict : **image entière → mot conventionnel entier → prononciation entière**, avec concaténation IPA exacte.

## Source visuelle principale

La première grande collection utilise **OpenMoji**, afin de conserver une esthétique cohérente avec les pictogrammes déjà présents dans Rebulo.

- Projet : OpenMoji
- Licence : CC BY-SA 4.0
- Commit épinglé : `aeb8bb3a59e2de39c754ac79180c8131c906acea`
- Dépôt : `hfg-gmuend/openmoji`

Le commit est épinglé : Rebulo ne dépend pas silencieusement d'une image qui changerait plus tard. Chaque entrée contient son fichier source, son commit et sa licence.

Deux autres banques ouvertes ont été examinées comme solutions de repli pour de futures extensions : **Noto Emoji** (la plupart des ressources image sous Apache 2.0) et **Twemoji** (graphismes sous CC BY 4.0). Elles ne sont pas mélangées automatiquement dans ce premier lot, afin de préserver la cohérence visuelle. Une source de repli pourra être ajoutée quand OpenMoji ne fournit pas un concept suffisamment clair.

## Strict, général et clinique restent distincts

Une image disponible n'est pas automatiquement une bonne unité phonétique. Les entrées ont donc un drapeau `strictEligible`.

- `strictEligible:true` ou absent : l'entrée peut participer à la segmentation stricte si sa prononciation entière correspond exactement.
- `strictEligible:false` : l'illustration peut servir dans le jeu général ou dans une phrase, mais elle est exclue du moteur strict.
- `clinicalStatus:"unreviewed"` : aucune validation clinique n'est revendiquée.

Les illustrations dont la dénomination est particulièrement ambiguë restent volontairement hors strict. Cette prudence vaut davantage qu'un chiffre de couverture artificiellement gonflé.

## Lettres et nombres

Les lettres déjà modélisées restent des opérations explicites de rébus général. Les nombres `0–10` et `100` ont maintenant aussi une lecture conventionnelle explicite. Par exemple, le symbole `2` peut porter la lecture « deux » lorsque le segment phonétique exact est `/dø/`.

Ces symboles ne sont pas transformés en pictogrammes stricts : ils restent des conventions visuelles visibles, dans l'esprit des rébus de magazines.

## Expansion à partir des vrais manques phonétiques

`data/coverage-report.json` contient les sons qui bloquent actuellement des mots du Lexique 4. La grande bibliothèque ne se contente pas d'ajouter des images au hasard : elle recherche les nouveaux concepts dont l'IPA correspond exactement à ces manques et transforme leurs exemples en nouvelles cibles jouables.

Cela permet d'étendre progressivement la couverture sans simplifier `src/phonetic-engine.js` et sans inventer une lecture partielle d'image.

## Phrases et présentation

Le corpus de phrases de découverte dépasse maintenant 100 phrases et utilise le vocabulaire visuel beaucoup plus large. Les nombres peuvent apparaître comme chiffres. Les signes `+` mécaniques entre toutes les images sont masqués : les pièces placées dans l'ordre suffisent visuellement à indiquer l'assemblage, comme dans un rébus classique.

## Étapes suivantes d'enrichissement

La bibliothèque doit continuer à croître en partant des gaps de couverture les plus rentables, puis chercher le meilleur visuel ouvert et non ambigu. Quand une image ne peut pas être nommée de façon suffisamment stable, elle reste générale ou prototype. Aucune donnée de dénomination participante ni aucun statut clinique ne doit être inventé pour l'activer.
