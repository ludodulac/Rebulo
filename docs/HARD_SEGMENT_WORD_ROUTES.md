# Rebulo — routes mot-par-mot pour segments difficiles

- Segments analysés : 8.
- Cibles utiles concernées : 127.
- Opportunités examinées pour les routes difficiles : 250.
- Cibles avec au moins une route phonétiquement exacte : 50.
- Cibles dont une route exacte dispose aussi d’un candidat lexical de représentation : 15.
- Cibles dont une route dispose déjà d’un candidat visuel curaté en recherche : 7.
- Cibles sans aucune route exacte : 77.
- Cibles qui nécessitent encore un candidat lexical de représentation : 112.
- Cibles qui nécessitent encore une piste visuelle curatée : 120.
- Groupes de besoins visuels : 20.
- Cibles avec route alternative stricte : 7.
- Cibles avec route stricte et candidat lexical de représentation : 4.
- Cibles avec route stricte et candidat visuel curaté : 0.
- Cibles avec au moins une route générale visible : 45.

> Exactitude phonétique ≠ représentation lexicale ≠ piste visuelle curatée ≠ validation de dénomination. La file ci-dessous partitionne exactement les cibles encore non résolues visuellement; une piste générale documentée reste non autorisée tant que sa sémantique visible n’est pas formalisée et testée.

## File priorisée des besoins visuels

- Recherche pictogramme/scène : 15 cibles dans 3 groupes.
- Opération générale visible déjà documentée à formaliser : 77 cibles dans 12 groupes.
- Nouvelle représentation réellement à découvrir : 28 cibles dans 5 groupes.

| Rang | Besoin | Voie de recherche | Brique/segment | Cibles | Âge min. | Mots exacts | Opération visible documentée | Banque visuelle | Segments sources | Exemples |
|---:|---|---|---|---:|---:|---|---|---|---|---|
| 1 | curater le mot exact existant | pictogramme / scène | /lo/ | 3 | 5 | lot, los, laud | — | — | /al/ | allô, allo, halo |
| 2 | curater le mot exact existant | opération générale visible documentée | /tʁi/ | 2 | 9 | tri, trie | TR | — | /tʁ/ | patrie, tripoter |
| 3 | curater le mot exact existant | opération générale visible documentée | /at/ | 1 | 7 | hâte, atte | TR | — | /tʁ/ | attraper |
| 4 | curater le mot exact existant | pictogramme / scène | /ba/ | 1 | 7 | bas, bât, bats, bah | — | — | /aʁ/ | bagarre |
| 5 | curater le mot exact existant | opération générale visible documentée | /e/ | 1 | 9 | ais, ai, et, eh | É | É (fallback_only) | /aʁ/ | harper |
| 6 | trouver mot exact ou opération visible | nouvelle représentation à découvrir | /d/ | 12 | 5 | — | — | — | /di/ | dîner, paradis, midi, diriger |
| 7 | trouver mot exact ou opération visible | nouvelle représentation à découvrir | /ʁ/ | 7 | 5 | — | — | — | /al/, /aʁ/ | art, are, artère, mouchard |
| 8 | trouver mot exact ou opération visible | opération générale visible documentée | /tʁa/ | 5 | 5 | — | TR | — | /tʁ/ | travers, traverser, rattraper, tracer |
| 9 | trouver mot exact ou opération visible | nouvelle représentation à découvrir | /l/ | 3 | 7 | — | — | — | /al/ | signal, idéal, postal |
| 10 | trouver mot exact ou opération visible | opération générale visible documentée | /ɛ̃s/ | 2 | 5 | — | IN, UN | — | /ɛ̃/ | ainsi, incident |
| 11 | trouver mot exact ou opération visible | opération générale visible documentée | /asjɔ̃/ | 2 | 9 | — | TION, SION | — | /sjɔ̃/ | tentation, assignation |
| 12 | trouver mot exact ou opération visible | nouvelle représentation à découvrir | /n/ | 2 | 9 | — | — | — | /al/, /aʁ/ | arène, haleine |
| 13 | trouver mot exact ou opération visible | opération générale visible documentée | /t/ | 1 | 9 | — | TR | — | /tʁ/ | tri |
| 14 | trouver mot exact ou opération visible | opération générale visible documentée | /ɛ̃t/ | 1 | 12 | — | IN, UN | — | /ɛ̃/ | interner |
| 15 | résoudre le segment source | opération générale visible documentée | /tʁ/ | 20 | 5 | — | TR | — | /tʁ/ | trop, autre, d'autres, quatre |
| 16 | résoudre le segment source | opération générale visible documentée | /mɑ̃/ | 18 | 5 | — | MENT | — | /mɑ̃/ | maman, manger, man, serment |
| 17 | résoudre le segment source | opération générale visible documentée | /sjɔ̃/ | 18 | 5 | — | TION, SION | scion (reject_visual_priority) | /sjɔ̃/ | mission, version, passion, opération |
| 18 | résoudre le segment source | pictogramme / scène | /œʁ/ | 11 | 5 | — | — | heure (second_wave), heurt (reject_visual_priority) | /œʁ/ | heure, h, erreur, ailleurs |
| 19 | résoudre le segment source | opération générale visible documentée | /ɛ̃/ | 6 | 5 | — | IN, UN | — | /ɛ̃/ | hein, terrain, impossible, insigne |
| 20 | résoudre le segment source | nouvelle représentation à découvrir | /di/ | 4 | 9 | — | — | dit (reject_visual_priority) | /di/ | humidité, cupidité, rapidité, diversité |

## /mɑ̃/ — alternate_segmentation_first

- 0/18 cibles ont une route phonétiquement exacte; 0/18 ont une piste lexicale; 0/18 ont déjà une piste visuelle curatée; 18 nécessitent encore une piste visuelle.

| Mot | IPA | Route exacte | Lexical | Visuel curaté | Meilleure route | Nouvelle brique | Prochaine porte |
|---|---|---|---|---|---|---|---|
| maman | /mamɑ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| manger | /mɑ̃ʒe/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| man | /mɑ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| serment | /sɛʁmɑ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| amant | /amɑ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| apparemment | /apaʁamɑ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| document | /dokymɑ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| alimentaire | /alimɑ̃tɛʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| documentaire | /dokymɑ̃tɛʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| ciment | /simɑ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| dément | /demɑ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| décidément | /desidemɑ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| alimenter | /alimɑ̃te/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| piment | /pimɑ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| poliment | /polimɑ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| tourmenter | /tuʁmɑ̃te/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| mentalité | /mɑ̃talite/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| clément | /klemɑ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |

## /ɛ̃/ — alternate_segmentation_first

- 10/16 cibles ont une route phonétiquement exacte; 7/16 ont une piste lexicale; 7/16 ont déjà une piste visuelle curatée; 9 nécessitent encore une piste visuelle.

| Mot | IPA | Route exacte | Lexical | Visuel curaté | Meilleure route | Nouvelle brique | Prochaine porte |
|---|---|---|---|---|---|---|---|
| hein | /ɛ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| ainsi | /ɛ̃si/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /ɛ̃s/ /ɛ̃s/ + I /i/ | — | search_exact_whole_word_or_explicit_general_operation |
| terrain | /tɛʁɛ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| impossible | /ɛ̃posibl/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| intérêt | /ɛ̃teʁɛ/ | exact_alternative_routes_found | representable_alternative_candidate_found | curated_visual_research_candidate_found | /ɛ/ /ɛ/ + T /te/ + raie /ʁɛ/ | haie | prototype_then_naming_test |
| incident | /ɛ̃sidɑ̃/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /ɛ̃s/ /ɛ̃s/ + I /i/ + dent /dɑ̃/ | — | search_exact_whole_word_or_explicit_general_operation |
| interroger | /ɛ̃tɛʁoʒe/ | exact_alternative_routes_found | representable_alternative_candidate_found | curated_visual_research_candidate_found | /ɛ/ /ɛ/ + terre /tɛʁ/ + eau /o/ + G /ʒe/ | haie | prototype_then_naming_test |
| insigne | /ɛ̃siɲ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| impoli | /ɛ̃poli/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| indépendant | /ɛ̃depɑ̃dɑ̃/ | exact_alternative_routes_found | representable_alternative_candidate_found | curated_visual_research_candidate_found | /ɛ/ /ɛ/ + D /de/ + paon /pɑ̃/ + dent /dɑ̃/ | haie | prototype_then_naming_test |
| inverser | /ɛ̃vɛʁse/ | exact_alternative_routes_found | representable_alternative_candidate_found | curated_visual_research_candidate_found | /ɛ/ /ɛ/ + ver /vɛʁ/ + C /se/ | haie | prototype_then_naming_test |
| impôt | /ɛ̃po/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| inciter | /ɛ̃site/ | exact_alternative_routes_found | representable_alternative_candidate_found | curated_visual_research_candidate_found | /ɛ/ /ɛ/ + scie /si/ + T /te/ | haie | prototype_then_naming_test |
| importuner | /ɛ̃pɔʁtyne/ | exact_alternative_routes_found | representable_alternative_candidate_found | curated_visual_research_candidate_found | /ɛ/ /ɛ/ + porte /pɔʁt/ + U /y/ + nez /ne/ | haie | prototype_then_naming_test |
| interner | /ɛ̃tɛʁne/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /ɛ̃t/ /ɛ̃t/ + R /ɛʁ/ + nez /ne/ | — | search_exact_whole_word_or_explicit_general_operation |
| lycéen | /liseɛ̃/ | exact_alternative_routes_found | representable_alternative_candidate_found | curated_visual_research_candidate_found | lit /li/ + C /se/ + /ɛ/ /ɛ/ | haie | prototype_then_naming_test |

## /œʁ/ — scene_comparison

- 0/11 cibles ont une route phonétiquement exacte; 0/11 ont une piste lexicale; 0/11 ont déjà une piste visuelle curatée; 11 nécessitent encore une piste visuelle.

| Mot | IPA | Route exacte | Lexical | Visuel curaté | Meilleure route | Nouvelle brique | Prochaine porte |
|---|---|---|---|---|---|---|---|
| heure | /œʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| h | /œʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| erreur | /ɛʁœʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| ailleurs | /ajœʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| terreur | /tɛʁœʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| heurter | /œʁte/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| livreur | /livʁœʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| boxeur | /bɔksœʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| pêcheur | /pɛʃœʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| porteur | /pɔʁtœʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| éclaireur | /eklɛʁœʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |

## /aʁ/ — scene_comparison_for_older_users

- 8/8 cibles ont une route phonétiquement exacte; 2/8 ont une piste lexicale; 0/8 ont déjà une piste visuelle curatée; 8 nécessitent encore une piste visuelle.

| Mot | IPA | Route exacte | Lexical | Visuel curaté | Meilleure route | Nouvelle brique | Prochaine porte |
|---|---|---|---|---|---|---|---|
| art | /aʁ/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | A /a/ + /ʁ/ /ʁ/ | — | search_exact_whole_word_or_explicit_general_operation |
| bagarre | /bagaʁ/ | exact_alternative_routes_found | representable_alternative_candidate_found | lexical_candidate_needs_visual_curation | /ba/ /ba/ + gare /gaʁ/ | bas, bât, bats | assess_visual_concept_then_naming_risk_before_prototype |
| are | /aʁ/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | A /a/ + /ʁ/ /ʁ/ | — | search_exact_whole_word_or_explicit_general_operation |
| harper | /aʁpe/ | exact_alternative_routes_found | representable_alternative_candidate_found | lexical_candidate_needs_visual_curation | harpe /aʁp/ + /e/ /e/ | ais, ai, et | assess_visual_concept_then_naming_risk_before_prototype |
| artère | /aʁtɛʁ/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | A /a/ + /ʁ/ /ʁ/ + terre /tɛʁ/ | — | search_exact_whole_word_or_explicit_general_operation |
| mouchard | /muʃaʁ/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | mouche /muʃ/ + A /a/ + /ʁ/ /ʁ/ | — | search_exact_whole_word_or_explicit_general_operation |
| arène | /aʁɛn/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | A /a/ + raie /ʁɛ/ + /n/ /n/ | — | search_exact_whole_word_or_explicit_general_operation |
| ardent | /aʁdɑ̃/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | A /a/ + /ʁ/ /ʁ/ + dent /dɑ̃/ | — | search_exact_whole_word_or_explicit_general_operation |

## /al/ — alternate_segmentation_preferred

- 9/9 cibles ont une route phonétiquement exacte; 3/9 ont une piste lexicale; 0/9 ont déjà une piste visuelle curatée; 9 nécessitent encore une piste visuelle.

| Mot | IPA | Route exacte | Lexical | Visuel curaté | Meilleure route | Nouvelle brique | Prochaine porte |
|---|---|---|---|---|---|---|---|
| allô | /alo/ | exact_alternative_routes_found | representable_alternative_candidate_found | lexical_candidate_needs_visual_curation | A /a/ + /lo/ /lo/ | lot, los, laud | assess_visual_concept_then_naming_risk_before_prototype |
| signal | /siɲal/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | cygne /siɲ/ + A /a/ + /l/ /l/ | — | search_exact_whole_word_or_explicit_general_operation |
| allo | /alo/ | exact_alternative_routes_found | representable_alternative_candidate_found | lexical_candidate_needs_visual_curation | A /a/ + /lo/ /lo/ | lot, los, laud | assess_visual_concept_then_naming_risk_before_prototype |
| idéal | /ideal/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | I /i/ + dé /de/ + A /a/ + /l/ /l/ | — | search_exact_whole_word_or_explicit_general_operation |
| haleine | /alɛn/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | A /a/ + lait /lɛ/ + /n/ /n/ | — | search_exact_whole_word_or_explicit_general_operation |
| allergie | /alɛʁʒi/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | A /a/ + lait /lɛ/ + /ʁ/ /ʁ/ + J /ʒi/ | — | search_exact_whole_word_or_explicit_general_operation |
| alerter | /alɛʁte/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | A /a/ + lait /lɛ/ + /ʁ/ /ʁ/ + thé /te/ | — | search_exact_whole_word_or_explicit_general_operation |
| halo | /alo/ | exact_alternative_routes_found | representable_alternative_candidate_found | lexical_candidate_needs_visual_curation | A /a/ + /lo/ /lo/ | lot, los, laud | assess_visual_concept_then_naming_risk_before_prototype |
| postal | /pɔstal/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | poste /pɔst/ + A /a/ + /l/ /l/ | — | search_exact_whole_word_or_explicit_general_operation |

## /tʁ/ — alternate_segmentation_required

- 9/29 cibles ont une route phonétiquement exacte; 3/29 ont une piste lexicale; 0/29 ont déjà une piste visuelle curatée; 29 nécessitent encore une piste visuelle.

| Mot | IPA | Route exacte | Lexical | Visuel curaté | Meilleure route | Nouvelle brique | Prochaine porte |
|---|---|---|---|---|---|---|---|
| trop | /tʁo/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| autre | /otʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| d'autres | /dotʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| quatre | /katʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| lettre | /lɛtʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| travers | /tʁavɛʁ/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /tʁa/ /tʁa/ + ver /vɛʁ/ | — | search_exact_whole_word_or_explicit_general_operation |
| attraper | /atʁape/ | exact_alternative_routes_found | representable_alternative_candidate_found | lexical_candidate_needs_visual_curation | /at/ /at/ + rat /ʁa/ + P /pe/ | hâte, atte, hâte | assess_visual_concept_then_naming_risk_before_prototype |
| théâtre | /teatʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| traverser | /tʁavɛʁse/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /tʁa/ /tʁa/ + ver /vɛʁ/ + C /se/ | — | search_exact_whole_word_or_explicit_general_operation |
| rattraper | /ʁatʁape/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | rat /ʁa/ + /tʁa/ /tʁa/ + P /pe/ | — | search_exact_whole_word_or_explicit_general_operation |
| paraître | /paʁɛtʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| apparaître | /apaʁɛtʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| tracer | /tʁase/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /tʁa/ /tʁa/ + C /se/ | — | search_exact_whole_word_or_explicit_general_operation |
| chapitre | /ʃapitʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| détresse | /detʁɛs/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| patrie | /patʁi/ | exact_alternative_routes_found | representable_alternative_candidate_found | lexical_candidate_needs_visual_curation | pas /pa/ + /tʁi/ /tʁi/ | tri, trie | assess_visual_concept_then_naming_risk_before_prototype |
| trauma | /tʁoma/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| peintre | /pɛ̃tʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| atroce | /atʁɔs/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| terrestre | /tɛʁɛstʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| maestro | /maɛstʁo/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| litre | /litʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| traversée | /tʁavɛʁse/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /tʁa/ /tʁa/ + ver /vɛʁ/ + C /se/ | — | search_exact_whole_word_or_explicit_general_operation |
| tripoter | /tʁipote/ | exact_alternative_routes_found | representable_alternative_candidate_found | lexical_candidate_needs_visual_curation | /tʁi/ /tʁi/ + pot /po/ + thé /te/ | tri, trie | assess_visual_concept_then_naming_risk_before_prototype |
| traine | /tʁɛn/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| tri | /tʁi/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /t/ /t/ + riz /ʁi/ | — | search_exact_whole_word_or_explicit_general_operation |
| paraitre | /paʁɛtʁ/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| traîneau | /tʁɛno/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| traîne | /tʁɛn/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |

## /sjɔ̃/ — alternate_segmentation_required

- 2/20 cibles ont une route phonétiquement exacte; 0/20 ont une piste lexicale; 0/20 ont déjà une piste visuelle curatée; 20 nécessitent encore une piste visuelle.

| Mot | IPA | Route exacte | Lexical | Visuel curaté | Meilleure route | Nouvelle brique | Prochaine porte |
|---|---|---|---|---|---|---|---|
| mission | /misjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| version | /vɛʁsjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| passion | /pasjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| opération | /opeʁasjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| possession | /posesjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| pension | /pɑ̃sjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| génération | /ʒeneʁasjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| libération | /libeʁasjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| séparation | /sepaʁasjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| démission | /demisjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| apparition | /apaʁisjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| potion | /posjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| session | /sesjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| citation | /sitasjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| tentation | /tɑ̃tasjɔ̃/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | tente /tɑ̃t/ + /asjɔ̃/ /asjɔ̃/ | — | search_exact_whole_word_or_explicit_general_operation |
| agitation | /aʒitasjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| occupation | /okypasjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| imitation | /imitasjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| assignation | /asiɲasjɔ̃/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | A /a/ + cygne /siɲ/ + /asjɔ̃/ /asjɔ̃/ | — | search_exact_whole_word_or_explicit_general_operation |
| ration | /ʁasjɔ̃/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |

## /di/ — alternate_segmentation_required

- 12/16 cibles ont une route phonétiquement exacte; 0/16 ont une piste lexicale; 0/16 ont déjà une piste visuelle curatée; 16 nécessitent encore une piste visuelle.

| Mot | IPA | Route exacte | Lexical | Visuel curaté | Meilleure route | Nouvelle brique | Prochaine porte |
|---|---|---|---|---|---|---|---|
| dîner | /dine/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /d/ /d/ + I /i/ + nez /ne/ | — | search_exact_whole_word_or_explicit_general_operation |
| paradis | /paʁadi/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | pas /pa/ + rat /ʁa/ + /d/ /d/ + I /i/ | — | search_exact_whole_word_or_explicit_general_operation |
| midi | /midi/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | mie /mi/ + /d/ /d/ + I /i/ | — | search_exact_whole_word_or_explicit_general_operation |
| diriger | /diʁiʒe/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /d/ /d/ + I /i/ + riz /ʁi/ + G /ʒe/ | — | search_exact_whole_word_or_explicit_general_operation |
| diner | /dine/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /d/ /d/ + I /i/ + nez /ne/ | — | search_exact_whole_word_or_explicit_general_operation |
| divers | /divɛʁ/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /d/ /d/ + I /i/ + ver /vɛʁ/ | — | search_exact_whole_word_or_explicit_general_operation |
| dit | /di/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /d/ /d/ + I /i/ | — | search_exact_whole_word_or_explicit_general_operation |
| diffuser | /difyze/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /d/ /d/ + I /i/ + fusée /fyze/ | — | search_exact_whole_word_or_explicit_general_operation |
| humidité | /ymidite/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| paddy | /padi/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | pas /pa/ + /d/ /d/ + I /i/ | — | search_exact_whole_word_or_explicit_general_operation |
| cupidité | /kypidite/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| rapidité | /ʁapidite/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| dandy | /dɑ̃di/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | dent /dɑ̃/ + /d/ /d/ + I /i/ | — | search_exact_whole_word_or_explicit_general_operation |
| diversité | /divɛʁsite/ | still_needs_new_representation_or_rule | still_needs_representable_alternative | still_needs_visual_representation | — | — | compare_source_scene_lexical_and_alternate_segmentation_strategies |
| die | /di/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | /d/ /d/ + I /i/ | — | search_exact_whole_word_or_explicit_general_operation |
| caddie | /kadi/ | exact_alternative_routes_found | still_needs_representable_alternative | still_needs_visual_representation | K /ka/ + /d/ /d/ + I /i/ | — | search_exact_whole_word_or_explicit_general_operation |

