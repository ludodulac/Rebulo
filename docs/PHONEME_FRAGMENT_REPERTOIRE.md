# Rebulo — répertoire de fragments phonémiques

## But

Rebulo doit pouvoir chercher une représentation sur **toute sous-séquence phonémique contiguë utile**, même si cette sous-séquence n'est pas un mot et même si elle ne correspond pas à une syllabe lexicale traditionnelle.

Le système historique conserve ses fenêtres source-exactes de 1–2 syllabes. La nouvelle couche `rebus-phoneme-fragments.js` ajoute une vue plus générale : intérieur de syllabe, syllabe entière, jonction de syllabes, deux syllabes ou davantage dans la limite de recherche, préfixe, milieu, fin de mot et fenêtres traversant plusieurs mots dans une phrase.

Exemple conceptuel pour `cuire les œufs` : le moteur peut examiner `/k/`, `/kɥ/`, `/kɥi/`, `/kɥiʁ/`, `/ɥi/`, `/iʁ/`, puis des fenêtres traversant la frontière des mots telles que `/iʁle/`, `/leø/` ou `/ʁleø/`. Le fait qu'un fragment n'ait pas de sens lexical ne l'empêche pas d'être indexé.

## Catégories de fragments

- `whole_word` : toute la prononciation d'un mot.
- `whole_syllable` : une syllabe source-exacte entière.
- `multi_syllable` : plusieurs syllabes source-exactes adjacentes.
- `within_syllable_fragment` : sous-séquence située à l'intérieur d'une syllabe.
- `cross_syllable_fragment` : sous-séquence qui traverse une frontière syllabique sans prétendre être une syllabe canonique.
- fenêtres de phrase : mêmes unités phonémiques, avec indication explicite lorsqu'une fenêtre traverse une frontière de mot.

## Représentations textuelles avant dessins

`data/rebus-fragment-representation-ideas.json` contient des **briefs conceptuels seulement**. Une idée peut être picturale, une scène sonore, une lettre, un chiffre ou une convention graphique. Plusieurs idées peuvent partager exactement le même son.

Premiers exemples :

- `/ʁɛ/` → raie marine ; éventuellement raie/trait si la lecture reste évidente.
- `/ɛ/` → haie.
- `/lɛ/` → lait ; `laid` reste enregistré comme possibilité lexicale mais n'est pas privilégié visuellement.
- `/ɥil/` → huile.
- `/kɥi/` → petit oisillon qui fait « cui » dans une scène sonore explicite.
- `/ø/` → œufs au pluriel ; ou scène déictique « eux ».
- `/dø/` → chiffre `2`.
- `/de/` → lettre `D` lue par son nom.
- `/œ̃/` → chiffre `1`.
- `/ɔ̃z/` → nombre `11`.

## Exact, convention, libre, verrouillé

Aucune équivalence n'est cachée.

- `exact` : la lecture stockée correspond exactement à l'IPA.
- `explicit_convention` : symbole visible dont la lecture canonique est stockée explicitement, par exemple `2` → /dø/.
- `playful_near` : rapprochement ludique potentiel, conservé séparément et jamais injecté dans le mode strict.
- `orthophony_locked` : convention ou rapprochement qui doit rester explicitement verrouillé tant que la politique orthophonique n'a pas décidé de son usage.

Ainsi `1` → /œ̃/ peut exister exactement tandis qu'une utilisation pour /ɛ̃/ reste une tolérance séparée. De même `D` → /de/ ne devient pas automatiquement `D’` → /d/ : ce sont deux conventions différentes.

## Preuve et activation

Le répertoire textuel ne produit aucune preuve humaine. Toutes les idées restent :

- `automaticActivation: false`
- `humanNamingEvidence: none`
- `clinicalEvidence: none`
- `spontaneousNamingRisk: unknown` tant qu'un humain n'a pas réellement nommé le stimulus.

La direction artistique viendra ensuite. L'objectif de cette étape est d'abord d'obtenir une carte sonore riche et cohérente, puis de choisir les concepts qui méritent un vrai dessin simple, immédiatement reconnaissable et au niveau d'un rébus de magazine jeunesse.
