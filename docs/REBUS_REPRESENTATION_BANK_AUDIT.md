# Rebulo — audit produit de la banque de représentations

> Ce rapport mesure la banque réellement exploitable. Il ne remplace ni Lexique 4, ni le catalogue phonétique exhaustif, ni la politique d’approximation, ni les validations humaines.

## Dénominateur produit

- Sons/fenêtres utiles distincts : 9491.
- Catalogue exhaustif conservé : 66890 fenêtres sonores distinctes.
- Pictogrammes OpenMoji agrégés dans la banque : 369.
- Entrées locales historiques/canoniques du seed : 24.

## Cartographie A–I sur les sons utiles

| Catégorie | Sons | Part des sons utiles |
|---|---:|---:|
| A — mot français exact disponible | 5741 | 60.5% |
| B — plusieurs mots français exacts | 2562 | 27.0% |
| C — mot exact mais aucune image prête/évidente | 5483 | 57.8% |
| D — pictogramme exact déjà prêt | 226 | 2.4% |
| E — approximation légère disponible | 1742 | 18.4% |
| F — composition exacte de plusieurs pictogrammes | 171 | 1.8% |
| G — lettre utilisable | 23 | 0.2% |
| H — chiffre/nombre utilisable | 12 | 0.1% |
| I — aucune représentation raisonnable actuellement disponible | 8925 | 94.0% |

Les catégories se chevauchent volontairement : un son peut avoir plusieurs mots exacts, une image prête et une lettre. La catégorie I est au contraire une frontière opérationnelle conservatrice.

## Nommabilité : ce qui est réellement connu

- Images exactes utiles recensées dans cette vue : 226.
- Images avec métadonnées visuelles retrouvées : 226.
- Images avec métadonnées de design élevées (confiance et stabilité ≥ 0,85) : 15.
- Images dont le test de dénomination est explicitement encore à faire : 226.
- Images disposant d’une validation humaine explicite de dénomination : 0.

**Important : les scores de confiance/stabilité sont des métadonnées de conception, pas des résultats humains. Rebulo ne les transforme pas en validation de dénomination.**

## Goulot d’étranglement actuel

- 5483 sons utiles ont déjà au moins un mot français exact mais pas encore d’image prête/évidente : c’est le principal réservoir à curater avant d’inventer davantage d’heuristiques phonétiques.
- 8925 sons utiles n’ont actuellement aucune route que la banque considère raisonnablement exploitable.
- 171 sons utiles peuvent déjà être couverts par 2–3 pictogrammes exacts, même sans pictogramme unique.
- 1742 sons utiles ont au moins une petite approximation dans la file de recherche ; elle reste générale/non stricte.

## Premiers trous à examiner

| Rang | Son | Cibles utiles | Mot(s) exact(s) | État visuel | Approximation légère | Exemples |
|---:|---|---:|---|---|---|---|
| 1 | /sjɔ̃/ | 365 | scion, cyon, scions | exact_word_unreviewed | — | mission, pression, attention, situation |
| 2 | /mɑ̃/ | 374 | man, mans, mens | reviewed_bad_or_deferred | — | vraiment, comment, moment, maman |
| 3 | /ti/ | 176 | tee, tie | exact_word_unreviewed | die /di/, dit /di/ | petit, partie, gentil, tirer |
| 4 | /ɛ̃/ | 234 | ein, eins, ain | exact_word_unreviewed | — | hein, ainsi, important, intérieur |
| 5 | /kɔ̃/ | 233 | con | reviewed_bad_or_deferred | gond /gɔ̃/, gons /gɔ̃/ | combien, confiance, content, compris |
| 6 | /e/ | 280 | ais, ai, et | exact_word_unreviewed | — | aider, eh, hé, école |
| 7 | /ko/ | 169 | cot, côt, cots | exact_word_unreviewed | go /go/, goth /go/ | comment, côté, colère, connaître |
| 8 | /me/ | 135 | maye, mée, mes | reviewed_bad_or_deferred | mai /mɛ/, meix /mɛ/ | mes, message, armée, aimer |
| 9 | /ɑ̃/ | 188 | an, han | exact_word_unreviewed | — | encore, ensemble, endroit, enfant |
| 10 | /ba/ | 86 | bas, bât, bats | exact_word_unreviewed | pas /pa/, pa /pa/ | là-bas, bateau, bas, combat |
| 11 | /di/ | 147 | dit, die, dit | exact_word_unreviewed | tee /ti/, tie /ti/ | dîner, difficile, différent, ridicule |
| 12 | /vi/ | 97 | vie, vit, vy | exact_word_unreviewed | phi /fi/, fy /fi/ | vie, envie, avis, visage |
| 13 | /ʁo/ | 57 | rot, rho, rôt | exact_word_unreviewed | — | bureau, héros, numéro, zéro |
| 14 | /pʁo/ | 93 | pro, prot | exact_word_unreviewed | broc /bʁo/, impro /ɛ̃pʁo/ | problème, propos, procès, projet |
| 15 | /vɑ̃/ | 48 | vent, vend | exact_word_unreviewed | faon /fɑ̃/, fend /fɑ̃/ | avant, souvent, vivant, devant |
| 16 | /to/ | 85 | to, taux, tau | exact_word_unreviewed | dos /do/, do /do/ | plutôt, bientôt, tôt, photo |
| 17 | /aʁ/ | 43 | art, are, hart | exact_word_unreviewed | — | argent, armée, art, article |
| 18 | /fi/ | 85 | phi, fy, fi | exact_word_unreviewed | vie /vi/, vy /vi/ | finir, difficile, officier, profiter |
| 19 | /ʁɑ̃/ | 70 | rang, ran, ranc | exact_word_unreviewed | — | rentrer, courant, rencontrer, rendez-vous |
| 20 | /sa/ | 68 | sas, sa, çà | exact_word_unreviewed | — | sa, savoir, salut, salope |
| 21 | /ʃe/ | 67 | ché | exact_word_unreviewed | chai /ʃɛ/, gé /ʒe/ | chercher, marcher, marché, coucher |
| 22 | /mo/ | 73 | mot, maux | exact_word_unreviewed | — | moment, mot, mauvais, moteur |
| 23 | /sə/ | 58 | se | exact_word_unreviewed | cé /se/, saie /sɛ/ | semaine, seconde, secret, secours |
| 24 | /sy/ | 65 | su, su, sue | exact_word_unreviewed | — | super, sujet, dessus, sûrement |
| 25 | /pɛʁ/ | 56 | père, paire, pair | exact_word_unreviewed | bers /bɛʁ/, perte /pɛʁt/ | père, personne, super, grand-père |
| 26 | /ga/ | 64 | gars, ga, ghât | exact_word_unreviewed | cas /ka/, ka /ka/ | gars, gagner, gamin, magasin |
| 27 | /bi/ | 65 | by, bi, bee | exact_word_unreviewed | pie /pi/, pis /pi/ | bizarre, habitude, cabinet, billet |
| 28 | /ʁə/ | 197 | — | no_exact_visual_lead | ré /ʁe/, raie /ʁɛ/ | retour, retard, revoir, recherche |
| 29 | /su/ | 44 | sou, saoûl, souls | exact_word_unreviewed | — | souvent, souci, souvenir, sourire |
| 30 | /lo/ | 67 | lot, los, laud | exact_word_unreviewed | — | boulot, allô, colonel, salaud |
| 31 | /ke/ | 59 | quais | exact_word_unreviewed | quai /kɛ/, quet /kɛ/ | ok, expliquer, manquer, attaquer |
| 32 | /sɔ̃/ | 22 | son, sont, sont | exact_word_unreviewed | — | son, façon, garçon, chanson |
| 33 | /no/ | 63 | nô, noe, nos | exact_word_unreviewed | — | nos, innocent, piano, no |
| 34 | /ɔʁ/ | 30 | or, ord, ort | exact_word_unreviewed | aure /oʁ/ | dehors, or, ordinateur, organiser |
| 35 | /tyʁ/ | 52 | tur, turent | exact_word_unreviewed | dur /dyʁ/, tuerie /tyʁi/ | voiture, nourriture, nature, futur |
| 36 | /bo/ | 35 | beau, bau, baux | exact_word_unreviewed | peau /po/, pot /po/ | beaucoup, beau, bonheur, beauté |
| 37 | /na/ | 96 | na | exact_word_unreviewed | — | nature, journaliste, navire, canapé |
| 38 | /lɑ̃/ | 40 | lan, lant, lanc | exact_word_unreviewed | — | excellent, talent, lancer, lendemain |
| 39 | /ɛ/ | 16 | haie, es, aie | exact_word_unreviewed | — | erreur, ennemi, hey, no |
| 40 | /ty/ | 42 | tue, tus, tue | exact_word_unreviewed | dûs /dy/, du /dy/ | étudier, naturel, foutu, tunnel |

## Exact lexical, mais travail visuel encore à faire

| Rang | Son | Cibles utiles | Candidats exacts | Statut |
|---:|---|---:|---|---|
| 1 | /sjɔ̃/ | 365 | scion, cyon, scions | exact_word_unreviewed |
| 2 | /mɑ̃/ | 374 | man, mans, mens | reviewed_bad_or_deferred |
| 3 | /a/ | 424 | a, ha, hâ | exact_word_unreviewed |
| 4 | /ti/ | 176 | tee, tie | exact_word_unreviewed |
| 5 | /ɛ̃/ | 234 | ein, eins, ain | exact_word_unreviewed |
| 6 | /kɔ̃/ | 233 | con | reviewed_bad_or_deferred |
| 7 | /e/ | 280 | ais, ai, et | exact_word_unreviewed |
| 8 | /le/ | 141 | lé, les, lez | reviewed_bad_or_deferred |
| 9 | /ko/ | 169 | cot, côt, cots | exact_word_unreviewed |
| 10 | /ʁe/ | 257 | ré, rée | exact_word_unreviewed |
| 11 | /se/ | 222 | cé, ces, ses | exact_word_unreviewed |
| 12 | /me/ | 135 | maye, mée, mes | reviewed_bad_or_deferred |
| 13 | /ɑ̃/ | 188 | an, han | exact_word_unreviewed |
| 14 | /ba/ | 86 | bas, bât, bats | exact_word_unreviewed |
| 15 | /di/ | 147 | dit, die, dit | exact_word_unreviewed |
| 16 | /tɑ̃/ | 90 | temps, tan, taon | exact_word_unreviewed |
| 17 | /vi/ | 97 | vie, vit, vy | exact_word_unreviewed |
| 18 | /ka/ | 176 | cas, k, ka | exact_word_unreviewed |
| 19 | /ʁo/ | 57 | rot, rho, rôt | exact_word_unreviewed |
| 20 | /pʁo/ | 93 | pro, prot | exact_word_unreviewed |
| 21 | /pe/ | 119 | p, pô, pe | exact_word_unreviewed |
| 22 | /i/ | 111 | i, y, hie | exact_word_unreviewed |
| 23 | /vɑ̃/ | 48 | vent, vend | exact_word_unreviewed |
| 24 | /to/ | 85 | to, taux, tau | exact_word_unreviewed |
| 25 | /aʁ/ | 43 | art, are, hart | exact_word_unreviewed |
| 26 | /paʁ/ | 55 | part, par, parr | exact_word_unreviewed |
| 27 | /fi/ | 85 | phi, fy, fi | exact_word_unreviewed |
| 28 | /ʁɑ̃/ | 70 | rang, ran, ranc | exact_word_unreviewed |
| 29 | /ʒe/ | 105 | g, gé, jé | exact_word_unreviewed |
| 30 | /sa/ | 68 | sas, sa, çà | exact_word_unreviewed |
| 31 | /ʃe/ | 67 | ché | exact_word_unreviewed |
| 32 | /lə/ | 71 | le | exact_word_unreviewed |
| 33 | /də/ | 54 | de | exact_word_unreviewed |
| 34 | /mo/ | 73 | mot, maux | exact_word_unreviewed |
| 35 | /sə/ | 58 | se | exact_word_unreviewed |
| 36 | /sy/ | 65 | su, su, sue | exact_word_unreviewed |
| 37 | /pɛʁ/ | 56 | père, paire, pair | exact_word_unreviewed |
| 38 | /ga/ | 64 | gars, ga, ghât | exact_word_unreviewed |
| 39 | /bi/ | 65 | by, bi, bee | exact_word_unreviewed |
| 40 | /ve/ | 78 | v, vés, vé | exact_word_unreviewed |

## Compositions exactes déjà disponibles

| Rang | Son | Route image exacte | Cibles utiles |
|---:|---|---|---:|
| 1 | /ʁite/ | riz + thé | 18 |
| 2 | /lite/ | lit + thé | 41 |
| 3 | /site/ | scie + thé | 21 |
| 4 | /paʁa/ | pas + rat | 17 |
| 5 | /done/ | dos + nez | 10 |
| 6 | /poli/ | pot + lit | 9 |
| 7 | /mine/ | mie + nez | 8 |
| 8 | /deli/ | dé + lit | 9 |
| 9 | /desi/ | dé + scie | 6 |
| 10 | /tuʁne/ | tour + nez | 6 |
| 11 | /sine/ | scie + nez | 6 |
| 12 | /maʁi/ | mât + riz | 4 |
| 13 | /teʁa/ | thé + rat | 6 |
| 14 | /papa/ | pas + pas | 4 |
| 15 | /tali/ | tas + lit | 6 |
| 16 | /teo/ | thé + eau | 5 |
| 17 | /tɛʁo/ | terre + eau | 5 |
| 18 | /osi/ | eau + scie | 2 |
| 19 | /depɑ̃/ | dé + paon | 5 |
| 20 | /pate/ | pas + thé | 4 |
| 21 | /mɛʁsi/ | mer + scie | 2 |
| 22 | /pɑ̃dɑ̃/ | paon + dent | 4 |
| 23 | /mate/ | mât + thé | 3 |
| 24 | /mili/ | mie + lit | 3 |
| 25 | /ʁate/ | rat + thé | 4 |
| 26 | /depo/ | dé + pot | 3 |
| 27 | /paʁi/ | pas + riz | 3 |
| 28 | /soli/ | seau + lit | 3 |
| 29 | /mite/ | mie + thé | 7 |
| 30 | /tane/ | tas + nez | 4 |
| 31 | /papi/ | pas + pie | 3 |
| 32 | /deo/ | dé + eau | 2 |
| 33 | /opi/ | eau + pie | 2 |
| 34 | /detuʁ/ | dé + tour | 3 |
| 35 | /pita/ | pie + tas | 3 |
| 36 | /tapi/ | tas + pie | 2 |
| 37 | /teli/ | thé + lit | 2 |
| 38 | /ʁali/ | rat + lit | 2 |
| 39 | /gaʁde/ | gare + dé | 3 |
| 40 | /side/ | scie + dé | 8 |

## Pourquoi les anciens dessins apparaissent encore

Le runtime charge d’abord les 24 entrées de `data/lexicon-seed.json`, puis ajoute les vagues OpenMoji. Une entrée OpenMoji dont l’id ou le label existe déjà dans le seed est volontairement ignorée : **le seed gagne**. Il y a actuellement 6 concepts OpenMoji masqués de cette manière. C’est pourquoi remplacer ou ajouter une image dans une autre bibliothèque ne change pas automatiquement le visuel affiché pour un concept déjà présent dans le seed.

L’audit local recense 24 SVG de production actifs. Parmi eux, 9 sont encore classés `legacy_or_external` par l’audit de style. Ils ne sont pas supprimés : ils forment une file de migration explicite.

## Nouveaux dessins retrouvés

Le dépôt contient 3 assets de recherche au style comic qui ne sont pas automatiquement utilisés en production. Ils sont conservés avec leur révision et leur statut de validation. Exemples : heure (assets/research/heure-scene-a-v1.svg), heure (assets/research/heure-scene-b-v1.svg), nid (assets/research/nid-comic-v1.svg).

## Décision de boucle

**CONTINUE — mais sur la banque de représentations.** La prochaine production doit d’abord réduire le backlog C/I par curation de mots exacts et réutilisation d’images/compositions existantes. L’approximation reste un outil de remplissage des trous, pas le chantier principal.
