# Rebulo

Rebulo est un jeu de rébus français pensé pour smartphone.

## Principe

Le moteur ne valide pas un rébus sur une simple ressemblance orthographique. Chaque entrée possède une décomposition sonore explicite et un niveau d'âge.

Exemples retenus :
- mer + scie → merci
- tour + nez + sol → tournesol
- scie + nez + mât → cinéma
- pas + rat + pluie → parapluie
- pie + rat + mie + dé → pyramide

## Structure

- `index.html` : interface du jeu
- `styles.css` : interface responsive
- `app.js` : logique de jeu et validation des réponses
- `data/rebus.json` : catalogue des rébus validés
- `assets/rebus/` : pictogrammes SVG originaux utilisés par le jeu
- `docs/rebus-research.md` : règles de conception et contrôle phonétique

## Règle de qualité

Une image peut évoquer plusieurs mots, mais une lecture utilisée dans un rébus doit être enregistrée explicitement. Les approximations comme `riz → ré` sont refusées dans les niveaux enfants.

## Lancer

Servir le dossier avec un petit serveur HTTP puis ouvrir `index.html`. Le projet est compatible avec un hébergement statique tel que GitHub Pages.
