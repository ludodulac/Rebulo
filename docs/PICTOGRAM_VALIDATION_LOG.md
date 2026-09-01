# Rebulo — journal de validation des pictogrammes

Ce journal complète `CLINICAL_PICTOGRAM_PLAN.md`. Il consigne les décisions prises pendant la construction du corpus pilote. La présence d'un fichier image ne vaut jamais validation clinique.

## Statuts

- `prototype_priority` : concept phonétiquement exact, suffisamment prometteur pour être actif dans le prototype, mais encore à valider formellement en dénomination spontanée.
- `naming_test_required` : asset disponible mais volontairement inactif, car le visuel peut provoquer un autre mot.
- `no_suitable_asset` : aucun visuel suffisamment univoque retenu ; le concept reste absent du lexique actif.

## 2026-09-01

### lit /li/

- Statut : `prototype_priority`
- Actif : oui
- Asset : OpenMoji BED (`1F6CF`)
- Motif : objet courant, silhouette de lit claire, risque de dénomination concurrente jugé faible pour un prototype.
- Reste à faire : test de dénomination spontanée avec le public ciblé avant statut clinique.

### riz /ʁi/

- Statut : `prototype_priority`
- Actif : oui
- Asset : OpenMoji COOKED RICE (`1F35A`)
- Motif : aliment concret et iconographie suffisamment spécifique pour un prototype.
- Reste à faire : test de dénomination spontanée avant statut clinique.

### chat /ʃa/

- Statut : `prototype_priority`
- Actif : oui
- Asset : OpenMoji CAT FACE (`1F431`)
- Motif : animal très familier, forme visuelle immédiatement identifiable et risque de dénomination concurrente jugé faible pour le prototype.
- Reste à faire : test de dénomination spontanée avec le public ciblé avant statut clinique.

### dos /do/

- Statut : `no_suitable_asset`
- Actif : non
- Motif : la recherche dans la banque OpenMoji n'a pas fourni de représentation suffisamment directe du dos humain. Les silhouettes/personnes génériques risquent de provoquer « personne », « homme », « corps » ou une action plutôt que « dos ».
- Décision : ne pas fabriquer ni détourner un pictogramme pour obtenir /do/. Rechercher ultérieurement une illustration dédiée où le dos est explicitement mis en évidence.

### thé /te/

- Statut : `naming_test_required`
- Actif : non
- Asset : OpenMoji TEACUP WITHOUT HANDLE (`1F375`)
- Risque : le visuel peut être nommé « tasse », « boisson » ou « café » ; ces lectures ne fournissent pas /te/.
- Décision : conserver l'asset comme candidat expérimental, hors segmentation automatique.

### eau /o/

- Statut : `naming_test_required`
- Actif : non
- Asset : OpenMoji DROPLET (`1F4A7`)
- Risque : la réponse spontanée « goutte » est très plausible ; elle ne fournit pas /o/.
- Décision : conserver l'asset comme candidat expérimental, hors segmentation automatique.

## Règle d'activation

Un concept ne peut passer à `active:true` que si :

1. sa dénomination entière fournit exactement l'IPA enregistrée ;
2. l'image provoque suffisamment souvent le mot attendu sans consigne cachée ;
3. le concept est reconnaissable pour l'âge ciblé ;
4. aucune suppression, liaison inventée ou lecture partielle n'est nécessaire ;
5. la provenance et la licence de l'asset sont documentées.

Les futurs tests de dénomination devront consigner au minimum : population, nombre de participants, consigne exacte, réponses spontanées, taux du label cible et principales réponses concurrentes.
