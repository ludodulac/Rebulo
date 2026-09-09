# Rebulo

Rebulo est un créateur de rébus riche, ludique et intelligent. Son cœur actuel sait produire des rébus phonétiquement stricts et sa rigueur linguistique permet des usages pédagogiques et orthophoniques fiables sur smartphone.

L'ambition généraliste et l'usage orthophonique sont complémentaires : Rebulo doit retrouver le plaisir immédiat des rébus de magazines tout en sachant distinguer les constructions et les illustrations qui satisfont des exigences phonétiques ou cliniques plus fortes. Les principes stables de cette architecture sont décrits dans `docs/PRODUCT_PRINCIPLES.md`.

Le mode Jouer consomme la couverture stricte générée depuis les données lexicales actuelles. Les métriques courantes doivent être lues dans les rapports de `data/` ou régénérées avec les scripts du dépôt plutôt que recopiées ici comme constantes.

## Continuité pour une nouvelle conversation IA

Commencer par **`AI_START_HERE.md`**. C'est un routeur court vers les sources de vérité et les fichiers à lire selon la tâche.

Une conversation ciblée ne doit pas relire tout `docs/` par défaut. Vérifier d'abord `main`, les changements récents, la CI et les fichiers réellement concernés, puis charger uniquement la documentation de cette zone.

L'état opérationnel utile entre sessions reste dans `docs/PROJECT_HANDOFF_2026-09-01.md`. `docs/PROGRESSION.md` sert surtout d'historique et ne doit être relu que si une décision passée est nécessaire.

## Principe strict actuellement implémenté

Le moteur ne valide jamais un rébus strict sur une simple ressemblance orthographique. Une image représente un mot entier et sa prononciation entière ; la concaténation des pièces doit être exactement égale à la prononciation de la cible.

Exemples retenus :
- mer /mɛʁ/ + scie /si/ → merci /mɛʁsi/
- scie /si/ + nez /ne/ + mât /ma/ → cinéma /sinema/
- pas /pa/ + rat /ʁa/ + pluie /plɥi/ → parapluie /paʁaplɥi/
- pas /pa/ + rat /ʁa/ + sol /sɔl/ → parasol /paʁasɔl/

Exemples explicitement refusés par le mode strict :
- riz /ʁi/ + bus /bys/ ne donne pas rébus /ʁebys/
- tour /tuʁ/ + nez /ne/ + sol /sɔl/ ne donne pas la prononciation usuelle de tournesol
- pie /pi/ + rat /ʁa/ + mie /mi/ + dé /de/ ne donne pas la prononciation de pyramide

Ces refus ne signifient pas que Rebulo doit rester limité à la concaténation d'images entières. Des conventions de rébus classiques peuvent être ajoutées lorsqu'elles sont modélisées comme des opérations explicites et testables ; elles ne doivent simplement jamais être présentées comme des solutions `strict`.

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

- `AI_START_HERE.md` : routeur sélectif pour reprendre le projet avec un minimum de contexte
- `index.html` : interface principale
- `styles.css` : interface responsive et impression
- `app.js` : orchestration principale
- `src/phonetic-engine.js` : validation et segmentation phonétiques strictes
- `src/rebus-construction.js` : constructions et opérations explicites
- `src/creator-runtime.js` : runtime du créateur
- `data/corpus-pilot.json` : cibles pilotes, acceptées ou explicitement rejetées
- `data/lexicon-seed.json` : concepts illustrables structurés
- `data/asset-sources.json` : provenance, licences et révisions d'illustrations
- `data/rebus.json` : catalogue historique conservé
- `assets/rebus/` : pictogrammes SVG de production
- `assets/research/` : stimuli et prototypes de recherche séparés de la production
- `docs/PRODUCT_PRINCIPLES.md` : constitution produit stable et niveaux d'exigence
- `docs/PROJECT_HANDOFF_2026-09-01.md` : état opérationnel concis entre sessions
- `docs/` : contrats spécialisés, recherches et historique à charger seulement selon la tâche

## Règle de qualité

Une solution `strict` est refusée dès qu'elle nécessite une suppression arbitraire, une consonne silencieuse « ressuscitée », une liaison inventée, une lecture partielle cachée ou une approximation orthographique. L'absence de solution exacte est un résultat normal du moteur strict.

La bibliothèque générale et la validation clinique sont deux dimensions différentes. Une illustration peut exister pour un usage ludique sans être présentée comme cliniquement validée. La maturité réelle d'un stimulus doit être vérifiée dans les données et le modèle de garantie, notamment `docs/GUARANTEE_MODEL.md`.

## Illustrations et licences

Les références de provenance, licence et révision connues sont enregistrées dans `data/asset-sources.json`. Une provenance documentée ne prouve ni la dénomination spontanée, ni l'adéquation à l'âge, ni une validation clinique.

Avant diffusion commerciale ou changement d'asset, vérifier la fiche de provenance de la révision réellement utilisée et conserver les observations humaines liées à leur révision exacte.

## Lancer

Servir le dossier avec un petit serveur HTTP puis ouvrir `index.html`. Le projet est compatible avec un hébergement statique tel que GitHub Pages.
