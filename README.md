# Rebulo

Rebulo est un outil de création de rébus phonétiquement stricts, pensé d'abord pour l'orthophonie et utilisable sur smartphone.

## Principe

Le moteur ne valide jamais un rébus sur une simple ressemblance orthographique. Une image représente un mot entier et sa prononciation entière ; la concaténation des pièces doit être exactement égale à la prononciation de la cible.

Exemples retenus :
- mer /mɛʁ/ + scie /si/ → merci /mɛʁsi/
- scie /si/ + nez /ne/ + mât /ma/ → cinéma /sinema/
- pas /pa/ + rat /ʁa/ + pluie /plɥi/ → parapluie /paʁaplɥi/
- pas /pa/ + rat /ʁa/ + sol /sɔl/ → parasol /paʁasɔl/

Exemples explicitement refusés :
- riz /ʁi/ + bus /bys/ ne donne pas rébus /ʁebys/
- tour /tuʁ/ + nez /ne/ + sol /sɔl/ ne donne pas la prononciation usuelle de tournesol
- pie /pi/ + rat /ʁa/ + mie /mi/ + dé /de/ ne donne pas la prononciation de pyramide

## Doctrine UX

Rebulo doit avoir la profondeur d'un logiciel professionnel, mais la manipulabilité d'un jeu pour enfant. La référence Clash Royale porte sur la philosophie d'interface — hiérarchie, géographie stable, tactile, feedback et divulgation progressive — et non sur la copie de son identité graphique.

Règles non négociables :
- une seule scène principale, sans longue page verticale ;
- le rébus occupe le centre et reste l'objet visuel dominant ;
- une action principale clairement identifiable par état ;
- boutons courts, gros et tactiles : un bouton ne doit pas être une phrase ;
- navigation et actions principales toujours aux mêmes endroits ;
- options avancées dans des panneaux temporaires, jamais ajoutées automatiquement à l'accueil ;
- complexité IPA, licences et données cliniques masquées tant qu'elles ne sont pas utiles ;
- chaque interaction importante produit un feedback visible ;
- priorité au toucher et à la lisibilité pour enfants, lecteurs fragiles et personnes ayant une motricité moins précise ;
- codes visuels stables, sans dépendre uniquement de la couleur ;
- conserver une interface calme : reprendre la lisibilité et la physicalité du jeu mobile, pas sa stimulation permanente.

Toute nouvelle fonction doit d'abord trouver sa place dans cette hiérarchie avant d'obtenir un nouveau contrôle visible.

## Structure

- `index.html` : interface du créateur et accès au prototype jeu historique
- `styles.css` : interface responsive et impression
- `app.js` : orchestration du créateur et du jeu historique
- `src/phonetic-engine.js` : validation et segmentation phonétiques strictes
- `data/corpus-pilot.json` : cibles pilotes, acceptées ou explicitement rejetées
- `data/lexicon-seed.json` : concepts illustrables actifs
- `data/asset-sources.json` : provenance et licences des illustrations externes
- `data/rebus.json` : catalogue historique conservé
- `assets/rebus/` : pictogrammes SVG
- `docs/` : recherche, couverture, plan clinique et passation

## Règle de qualité

Une solution est refusée dès qu'elle nécessite une suppression arbitraire, une consonne silencieuse « ressuscitée », une liaison inventée, une lecture partielle cachée ou une approximation orthographique. L'absence de solution exacte est un résultat normal du moteur.

Les pictogrammes ajoutés au lexique restent des prototypes tant que leur dénomination spontanée, leur reconnaissance visuelle et leur adéquation à l'âge ciblé n'ont pas été validées.

## Illustrations et licences

Les nouveaux pictogrammes `lit` et `riz` proviennent d'OpenMoji. Tous les emojis OpenMoji sont conçus par OpenMoji, projet open source d'emojis et d'icônes, et sont utilisés sous licence CC BY-SA 4.0. Les références précises de chaque fichier sont enregistrées dans `data/asset-sources.json`.

Les autres SVG historiques du dépôt sont conservés tels quels ; leur provenance doit être auditée avant une diffusion commerciale si elle n'est pas déjà documentée.

## Lancer

Servir le dossier avec un petit serveur HTTP puis ouvrir `index.html`. Le projet est compatible avec un hébergement statique tel que GitHub Pages.
