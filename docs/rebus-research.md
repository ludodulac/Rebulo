# Recherche rébus — base de conception

## Définition opérationnelle

Un rébus exprime un mot ou une phrase par des lettres, mots, chiffres, dessins et signes dont la lecture phonétique permet de retrouver la solution.

Pour Rebulo, on distingue :
1. **Nom direct** : l'image se lit par son nom usuel (`mer`, `scie`, `rat`).
2. **Homophonie** : une image fournit un mot homophone du segment recherché.
3. **Syllabe ou segment** : autorisé seulement si le découpage est explicite et adapté à l'âge.
4. **Lettre / chiffre / note** : symbole lu phonétiquement.
5. **Position / opérateur** : sur, sous, dans, sans, plus, moins — réservé aux niveaux avancés.

## Règles de validation phonétique

Chaque rébus doit contenir :
- la solution écrite ;
- la lecture de chaque pictogramme ;
- une transcription phonétique simplifiée ou API ;
- une note de confiance ;
- un âge minimum.

### Refus automatiques pour les enfants

- changement arbitraire de voyelle (`riz` ne devient pas `ré`) ;
- consonne inventée ;
- consonne muette que l'on fait réapparaître sans règle explicite ;
- image qui exige un synonyme improbable ;
- segmentation qu'un enfant ne peut pas raisonnablement inférer.

## Rébus initiaux validés

| Solution | Découpage | Contrôle sonore | Niveau |
|---|---|---|---|
| merci | mer + scie | /mɛʁ/ + /si/ → /mɛʁsi/ | 5+ |
| tournesol | tour + nez + sol | /tuʁ/ + /ne/ + /sɔl/ → /tuʁnesɔl/ | 7+ |
| cinéma | scie + nez + mât | /si/ + /ne/ + /ma/ → /sinema/ | 7+ |
| parapluie | pas + rat + pluie | /pa/ + /ʁa/ + /plɥi/ → /paʁaplɥi/ | 8+ |
| pyramide | pie + rat + mie + dé | /pi/ + /ʁa/ + /mi/ + /de/ → /piʁamide/ | 9+ |

## Sources de principe

- Larousse, définition de « rébus » : lecture phonétique de lettres, mots, chiffres, dessins et signes.
- CNRTL, définition de « rébus » : dénomination directe ou homonymique des éléments.
- Les collections classiques de rébus montrent aussi l'usage de notes de musique, lettres, chiffres et relations spatiales.

Les exemples visuels trouvés en ligne servent uniquement à étudier les mécanismes. Les pictogrammes Rebulo sont originaux et ne recopient pas les illustrations trouvées.
