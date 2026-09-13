# Dominant sense resolution + semantic typing prototype

Status: analysis only. No B mutation, no #290 formula change, no runtime activation, no assets/UI/Phrase/Wave 6, no 10k–15k batch.

Base main SHA: `b45854e82f85d8028075d7809d99c30212225ea9`.

## Question

#295 established that structured lexical senses are broadly observable, but a lexical sense is not automatically a safe visual concept. This prototype tests three separate stages:

1. `senseObserved`: exact-graphy lexical sense present in French Wiktionary via Wiktextract/Kaikki.
2. `semanticType`: deterministic general class assigned from source POS/topics/tags/gloss head patterns.
3. `visualEligibility`: deterministic decision on whether the ranked observed sense is sufficiently visual and sufficiently unambiguous to be promoted as a candidate.

An observed sense always remains `visualConceptCandidate:false`; eligibility is a separate computed decision.

## Source

French Wiktionary via Wiktextract/Kaikki. Source version retained from #295: frwiktionary dump 2026-09-01; Kaikki extraction 2026-09-08; wiktextract `ccec6f1 + 4deed51`. License/provenance retained: Wiktionary CC-BY-SA + GFDL. Only exact graphies required by the bounded corpus are fetched; no bulk dump is committed. IPA identity always comes from B.

## New gold and sealing

A new 225-relation corpus was deterministically selected from the two 2,000-relation industrial samples before any source lookup in this mission.

Explicit exclusions by exact `IPA|graphy`:

- #293 calibration: 400
- #294 recall corpus: 650
- #295 development: 150
- #295 sealed holdout: 75
- historical diagnostic FN list: 15

Partition was fixed at selection time:

- development: 135
- sealed final holdout: 90

Every row was then editorially annotated before source lookup with `seriousVisualConcept`, zero or more separate `expectedVisualSenses`, `primarySemanticType`, risk, and a short rationale. `humanNamingEvidence` remains `none`.

The 90 holdout rows contain 17 serious-positive relations and 73 negatives. Their labels were sealed before Kaikki lookup. The development data were then allowed for rule iteration; the holdout was not fetched until model v4 had been frozen.

## Taxonomy

The explicit deterministic taxonomy is:

`physical_object`, `animal`, `plant`, `food`, `body_part`, `person_role`, `vehicle`, `place`, `clothing`, `tool`, `material`, `event`, `action`, `abstract`, `relation`, `symbol`, `text`, `quantity`, `other`.

Typing uses structured topics first when specific, then the head/hypernym of the observed definition, then POS-based fallback. Incidental words late in a definition are deliberately not treated as strong type evidence.

## Sense ranking method

Model frozen: `dominant-sense-semantic-v4` at analysis freeze SHA `9905d76216194ae6d8b8868c78c5e8383b543a15`.

Ranking uses only general signals:

- source sense order as a **lexicographic prior only**; it is not claimed to be real-world usage frequency;
- exact B POS compatibility with source POS when both are known;
- structured source topics;
- usage/form penalties (`obsolete`, `rare`, `figurative`, form/inflection markers, etc.);
- semantic-type visual safety;
- gloss specificity;
- B/Lexique frequency only as a conservative guard for competitive naming classes, never as visual proof.

Visual promotion adds general guards for cross-type ambiguity, minimum rank score, source-order depth by semantic class, POS mismatch, and low frequency in competitive classes. There is no whitelist, blacklist, old-FN exception, or per-word `editorial_added` path in the decision model.

## Development trajectory (135 only)

Development coverage: 132/135 = 97.8%; all 31 serious positives had at least one observed sense; mean ambiguity 6.24 observed senses/relation.

The sequence was intentionally visible:

- v1: TP18 / FP24 / FN13, precision 42.9%, recall 58.1%; semantic-type accuracy 50.0%. Whole-definition token matches produced many incidental misclassifications.
- v2: TP17 / FP16 / FN14, precision 51.5%, recall 54.8%; semantic-type accuracy 56.1%. Typing moved to structured topics and gloss-head hypernyms.
- v3: TP14 / FP8 / FN17, precision 63.6%, recall 45.2%; semantic-type accuracy 61.4%. Added B/source POS compatibility and ambiguity/frequency guards.
- v4 final development: TP12 / FP0 / TN104 / FN19, precision 100%, recall 38.7%, F1 55.8%. This model was then frozen before holdout lookup.

The development metrics are not the final independent claim.

## Sealed holdout result (90)

Composition: 17 serious positives / 73 negatives.

Semantic-source coverage:

- 88/90 relations have at least one observed sense = 97.8%
- 17/17 serious positives have at least one observed sense = 100%
- mean ambiguity = 5.70 observed senses/relation
- 71/73 negatives are blocked by the final decision rule = 97.3%

### Primary, sense-aligned evaluation

For a promotion to count as a correct TP here, the relation must be gold-positive **and** the selected top observed sense must have a semantic type compatible with a pre-source expected visual sense.

- TP 2
- FP 0
- TN 73
- FN 15
- precision 100%
- recall 11.8%
- F1 21.1%

This is the conservative result used for the main conclusion.

### Raw relation-level visual decision

If every automatic green is counted simply as a relation-level positive, regardless of whether the selected sense is the expected one:

- TP 3
- FP 2
- TN 71
- FN 14
- precision 60.0%
- recall 17.6%
- F1 27.3%

The gap between the two views is itself important: `canne` is a serious relation, but the system chose the plant sense rather than the expected walking-stick sense.

## Semantic typing and ranking on holdout

Top semantic type vs pre-source primary semantic type:

- 41/88 = 46.6% accuracy among source-covered rows.

For the 17 serious positives, a type-compatible observed sense appears in:

- top-1: 8/17 = 47.1%
- top-2: 9/17 = 52.9%
- top-3: 10/17 = 58.8%

These are explicitly **type-compatible ranking proxies**, not exact-sense accuracy when multiple senses share a type. The source does not guarantee that dictionary order equals actual use frequency, and this report makes no such claim.

## Automatic greens

Five holdout relations were promoted automatically:

- `chanteur`: correct; selected observed sense “Personne qui fait métier de chanter.”, `person_role`.
- `mousse`: correct; selected observed plant sense, `plant`.
- `canne`: relation is positive but selected sense is wrong for the expected representation: plant sense ranked above walking-stick sense.
- `halo`: false green; a secondary anatomical sense was promoted (`body_part`).
- `fierté`: false green; typing mistakenly promoted an abstract definition as `symbol`.

Thus there are 2 clearly sense-aligned correct greens, 1 wrong-sense positive green, and 2 false greens.

## Error analysis

All 15 sense-aligned FN are materialized in `data/dominant-sense-holdout-evaluation.json`, including expected sense(s), all available observed evidence, rank of the first compatible sense when present, selected type, and rejection reason.

Representative failure modes:

- `quartier`: expected `place`; a compatible place sense exists but ranks 5th. The top-ranked sense is botanical; rejected by source-order guard.
- `casier`: the storage sense is observed (“Ensemble de cases, de compartiments…”), but the general hypernym typer leaves it `other`; no compatible typed sense is found.
- `seigneur`: observed definitions exist, but “Maître, possesseur…” is not recognized by the conservative `person_role` head patterns.
- `chantier`: place senses are observed, but source senses about wooden supports rank above them; first compatible place is rank 3.
- `joue`: correct body-part sense is rank 1, but B/source POS mismatch blocks it; this exposes a project-POS reliability issue for homographic inflected forms.
- `pêcher`, `voler`, `toucher`: correct action senses rank first, but v4 intentionally does not promote generic actions because development precision was poor.
- `alien`: correct observed “Extraterrestre” is present and ranked first but remains `other` under the frozen taxonomy rules.
- `cachette`: observed “Petite cache” is present but the hypernym resolution does not infer `place`.
- `shampoing`: source gives variant-of definitions; the frozen rules avoid converting those into a material/product type.
- `charriots`: observed entry is a plural/form relation; form-derived semantic inheritance is intentionally not followed automatically.

FP details are also materialized:

- `halo`: secondary anatomical sense won the ranking and passed strong-concrete guards.
- `fierté`: semantic typing error (`symbol`) caused an abstract noun to be promoted.

No rule is changed after seeing these holdout failures.

## Human cost

Structured MOT→SENS retrieval remains cheap and highly automatable: 97.8% holdout coverage.

The remaining cost is SENS→dominant sense→safe concept. Only 2/17 serious positives are independently recovered with the expected semantic type under the safe interpretation. Therefore 15/17 = 88.2% of serious positives still require editorial resolution if recall is desired. Across all 90 holdout relations, only two can currently be treated as independently demonstrated safe automatic additions; the rest require rejection or review.

This is an improvement over #295’s 0/27 sealed-holdout recall, but not enough to make semantic review cheap at industrial scale.

## Decision for 10,000–15,000

**NO.**

The required qualitative milestone has finally appeared: recall is >0 on a genuinely sealed holdout, from general structured-source rules rather than per-word editorial additions. However, raw automatic-green precision is only 60%, semantic-type accuracy is 46.6%, top-1 type-compatible ranking is 47.1%, and only 2/17 serious positives are recovered with the expected type. The mechanism is promising research, not yet an industrial green lane.

The next useful work should target general hypernym resolution / semantic inheritance for variant/form senses and calibrated dominance signals, tested on another pre-sealed corpus. It should not be a 10k–15k batch.
