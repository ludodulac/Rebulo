# Prototype borné `senseCandidates[]`

## Décision exécutive

Le prototype réduit fortement les faux positifs connus sans modifier la formule #290, mais sa couverture est encore insuffisante pour autoriser un lot de 10–15k relations.

**Recommandation : NON pour le lot 10–15k à ce stade.**

La raison n'est plus un excès de faux positifs dans la voie verte proposée : sur l'échantillon étiqueté, la voie verte stricte n'en produit aucun. Le problème devient le rappel et le coût de résolution des sens : trop de bons concepts restent orange ou non résolus faute de preuve structurée au niveau SENS/CONCEPT.

## Base et périmètre

- Base réelle : `b41f086f997e75fafc077a60057700137402af85`.
- Corpus : **400 relations/unités de calibration**.
- Sous-ensemble avec vérité éditoriale indépendante : **99**.
- B inchangé.
- Formule #290 inchangée.
- `humanNamingEvidence = none` partout.
- Aucune image, SVG, activation runtime, UI, CSS, planner, Phrase ou Vague 6.

Le sous-ensemble étiqueté comprend les 78 B automatiques de #292 avec leur audit complet, les 8 faux négatifs rescue de #291/#292 et les near-misses explicitement revus. Les autres lignes (#290, #291 et stress #292) servent à tester la structure et la couverture mais ne sont pas traitées comme vérité éditoriale primaire.

## Structure exacte

Chaque relation garde séparément :

- `lexicalEntries[]` : données lexicales observées ;
- `senseCandidates[]` : sens/concepts potentiels.

Chaque `senseCandidate` contient exactement :

- `senseId` stable ;
- `label` ;
- `description` ;
- `pos` ;
- `provenance` ;
- `provenanceStatus` ;
- `confidence` ;
- `concreteCategory` ;
- `visualConceptCandidate` ;
- `evidence` ;
- `rationale` ;
- `ambiguityNotes`.

Statuts :

- `observed` : information réellement présente dans une source structurée ;
- `editorial_added` : sens ajouté après revue éditoriale explicite ;
- `inferred_candidate` : proposition automatique, jamais assimilée à une vérité observée.

Le prototype interdit conceptuellement la promotion de `inferred_candidate` vers `observed`.

## Sources et provenance

1. `lexicalEntries[]` des tranches #291/#292 : identité exacte graphie + IPA ; aucune prétention d'inventaire de sens.
2. Données structurées historiques V1–V5 déjà citées dans `legacyEvidence` : candidates `observed` quand un concept/sens est réellement présent dans ces fichiers.
3. Revues rescue #291 et #292 : candidates `editorial_added` pour `basse`, `enceinte`, `rature`, `portable`, `mûres`, `afro`, `mineur`, `louche`.
4. Garde sémantique automatique v1 : candidates `inferred_candidate`, avec un petit lexique positif de catégories concrètes très contraintes. L'absence de preuve positive laisse le sens non résolu au lieu de conclure « concret » à partir du seul POS NOM.

Important : la version finale du garde automatique **ne contient ni la liste des 32 faux positifs de #292 ni les huit mots rescue comme exceptions positives**. Ils restent utilisés uniquement pour l'évaluation indépendante et la couche éditoriale explicitement tracée.

## Avant / après

Évaluation primaire sur 99 cas étiquetés :

| Mode | TP | FP | TN | FN | Précision | Rappel |
|---|---:|---:|---:|---:|---:|---:|
| Baseline #290/#292 | 46 | 32 | 13 | 8 | 59.0 % | 85.2 % |
| Garde de sens automatique | 23 | 0 | 45 | 31 | 100.0 % | 42.6 % |
| Après résolution de sens (auto + preuves) | 31 | 0 | 45 | 23 | 100.0 % | 57.4 % |
| Voie verte stricte | 8 | 0 | 45 | 46 | 100.0 % | 14.8 % |

Le taux historique spécifique aux 78 B automatiques de #292 reste **32/78 = 41,0 % de faux positifs parmi les promotions automatiques**. Après la garde de sens, aucun de ces 32 cas connus n'est automatiquement retenu comme sérieux.

Cette amélioration n'est donc pas obtenue en changeant #290, mais en exigeant une preuve positive au niveau du sens concret autonome.

## Comptes de provenance

Dans les 400 unités :

- `inferred_candidate` : **400** ;
- `observed` : **35** ;
- `editorial_added` : **8**.

Il y a au moins un candidat inféré par relation, mais l'inférence reste explicitement séparée de la vérité source.

## Cas corrigés

Les faux positifs connus tels que `force`, `honte`, `risque`, `rôle`, `nombre`, `code`, `genre`, `doute`, `preuve`, `calme`, mais aussi `job`, `soin`, `offre`, `gauche`, `zone`, `style`, etc. ne deviennent plus sérieux simplement parce qu'ils sont NOM.

Les huit rescue sont conservés avec provenance `editorial_added` :

- `basse` → instrument ;
- `enceinte` → haut-parleur ;
- `rature` → marque barrée ;
- `portable` → téléphone ;
- `mûres` → fruit ;
- `afro` → coiffure ;
- `mineur` → travailleur de mine ;
- `louche` → ustensile.

## Faux positifs et faux négatifs restants

- Faux positifs après résolution sur les 99 cas étiquetés : **0**.
- Faux négatifs après résolution : **23**.

Le prototype est donc volontairement conservateur. Des concepts éditorialement sérieux restent non résolus sans preuve suffisante. Exemples typiques dans les B #292 non couverts par le petit lexique positif : des mots comme `diable`, `course`, `chasse`, `pub`, `rêve`, `lettre` ou `couple` nécessitent encore une décision de sens/concept au lieu d'une promotion automatique par POS.

Cela constitue la limite principale actuelle : le prototype sait beaucoup mieux dire « je ne sais pas », mais n'a pas encore une source de sens structurée assez riche pour maintenir le rappel.

## Nouvelle définition de la voie verte

La voie verte ne signifie plus `NOM + catégorie supposée concrète`.

Une relation n'est verte que si elle possède au moins un `senseCandidate` :

1. avec `visualConceptCandidate = true` ;
2. avec confiance >= 0,8 ;
3. avec une provenance `observed` ou `editorial_added` ;
4. avec un sens/concept suffisamment spécifique pour être autonome visuellement ;
5. sans dépendre du seul POS, de la fréquence ou de `phoneticReuse` ;
6. sans aucune prétention de validation humaine de nommage.

Un `inferred_candidate`, même prometteur, reste orange tant qu'il n'a pas de preuve de sens suffisante.

## Répartition prototype verte / orange / rouge

Sur 400 unités :

- **Vert : 43 (10,8 %)** — preuve structurée/éditoriale suffisante au niveau sens/concept ;
- **Orange : 89 (22,3 %)** — candidat automatique sérieux mais preuve de sens insuffisante pour le vert ;
- **Rouge / non résolu : 268 (67,0 %)** — pas de sens visuel autonome suffisamment établi.

Le rouge ne doit pas être curé intégralement. Les deux tranches ont déjà mesuré un rescue faible-score de 1,1–1,5 %, ce qui justifie un audit déterministe par échantillonnage.

## Travail humain restant

Sur un lot analogue de 400 :

- vert : spot-audit 10–20 %, soit environ **4–9** décisions ;
- orange : revue éditoriale complète, soit **89** décisions ;
- rouge : audit de sauvetage 10–20 %, soit environ **27–54** décisions.

Charge humaine indicative : **120–152 touches éditoriales pour 400 relations**, soit environ **30–38 %** du lot, avant même validation humaine de nommage.

Extrapoler directement ce coût à toute B serait prématuré, mais il est déjà trop élevé pour lancer proprement 10–15k avec la couverture sémantique actuelle.

## Prochaine étape recommandée

**NON pour 10–15k maintenant.**

Étape suivante recommandée : enrichir et valider la couche de preuves de sens sans changer #290, avec un second prototype ciblé sur la couverture :

- élargir les sources structurées de sens/concept réellement traçables ;
- conserver `inferred_candidate` comme hypothèse et jamais comme fait ;
- mesurer si la voie verte peut passer d'environ 11 % à une proportion sensiblement plus grande sans réintroduire >5–10 % de faux positifs ;
- réduire les 23 faux négatifs connus, en particulier les noms concrets/autonomes non présents dans le petit lexique positif ;
- maintenir un audit rescue rouge déterministe.

L'objectif suivant n'est donc pas davantage de relations, mais davantage de **couverture sémantique fiable**.
