# Structured sense source prototype

## Executive conclusion

This bounded prototype validates the **lexical sense ingestion layer**, but does **not** yet validate industrial B→C scaling.

French Wiktionary through Wiktextract/Kaikki gives excellent exact-graphy semantic coverage and multiple traceable senses. However, the sealed holdout shows that the frozen deterministic visual filter does not generalize enough to turn those observed lexical senses into safe new green cases.

**Decision for a 10,000–15,000 relation batch: NO.**

B is unchanged. Formula #290 is unchanged. `humanNamingEvidence` remains `none`. No runtime, image, SVG, UI, CSS, planner, Phrase or Wave 6 work is included.

## Source audit and choice

### Chosen source

**French Wiktionary via Wiktextract / Kaikki**

- source id: `frwiktionary-kaikki-2026-09-08`
- French Wiktionary dump: `2026-09-01`
- Kaikki structured extraction: `2026-09-08`
- Wiktextract revisions reported by Kaikki: `ccec6f1` + `4deed51`
- format used here: per-graphy JSONL
- content used: exact source graphy, POS, separate `senses[]`, glosses/definitions, tags, topics, categories and source sense identity where available
- licensing/provenance: Kaikki states that extracted Wiktionary data is made available under the same licenses as Wiktionary, **CC-BY-SA and GFDL**
- full raw extraction size at audit time: about 6.3 GB JSONL / 685 MB compressed; this prototype did **not** download or commit that bulk resource

The implementation fetches only exact target graphies. No LLM is used as the lexical source of truth.

### Alternatives considered

1. **Full frwiktionary Wiktextract dump** — semantically suitable and same upstream provenance, but disproportionate for a bounded prototype. Per-graphy Kaikki JSONL exposes the needed subset deterministically without copying the bulk dump.
2. **Existing Rebulo V1–V5 structured curation** — useful project evidence but not a general lexical sense inventory. The preceding #294 audit found no exact structured V1–V5 evidence for the 23 remaining false negatives, so it cannot solve semantic coverage generally.

Kaikki was therefore selected because it combines rich multi-sense structure, exact French graphies, deterministic ingestion, explicit version/provenance, and bounded access.

## Identity and provenance contract

Matching is strict:

1. exact graphy is sent to the semantic source;
2. only source entries with `entry.word === exactWord` and `lang_code === "fr"` are retained;
3. no accent/diacritic stripping or broad orthographic normalization is performed;
4. Kaikki is **not** used as the phonetic authority in this prototype;
5. the IPA attached to each semantic candidate comes explicitly from the exact B relation.

Every imported source sense is stored as `provenanceStatus: "observed"` and includes source fields such as `sourceId`, `sourceName`, `sourceSenseId`, `sourceDefinition`, `sourcePOS`, `sourceTags`, `sourceTopics`, `sourceCategories`, `sourceVersion`, `sourceUrl`, and an explicit `phoneticIdentity.ipaProvenance` pointing back to B.

Critically, every lexical `observed` candidate keeps:

`visualConceptCandidate: false`

The source proves the lexical sense only. Visual suitability is evaluated separately as an `inferred_candidate` assessment.

## Bounded ingestion

The development/evidence pass targets 150 newly selected gold relations plus the 15 historical unresolved #294 false negatives: **165 graphies**. It materializes **1,222 observed lexical senses**.

The sealed holdout adds 75 previously unseen graphies and **380 observed senses**.

Across both bounded passes this prototype therefore processes **240 target relations** and materializes **1,602 observed senses**. It does not process the full 135,140 B relations.

## Gold design and calibration control

### Development gold: 150

A deterministic 150-relation corpus was selected before looking up the new semantic source. It excludes all 400 #293/#294 calibration rows and excludes the 15 historical unresolved false negatives. Each row was editorially labeled before source ingestion with:

- serious visual concept yes/no;
- expected concept when yes;
- risk;
- short rationale;
- `humanNamingEvidence: none`.

Composition: **48 positive / 102 negative**.

This first 150-case set exposed four false positives in the initial general visual filter. The filter was tightened using only general POS/tag/topic/gloss constraints and a dominant-literal-noun rule; no lexical blacklist or whitelist was added.

Because that tuning used outcomes from these 150 cases, this set is reported as **development/diagnostic**, not as the final independent performance claim.

### Sealed holdout: 75

To restore a genuinely independent measurement after rule tuning, filter v2.2 was frozen first at commit:

`81b2a12f89e59b186e62caa5a8a11ade9e20239d`

Only then were 75 additional relations deterministically selected, excluding:

- the original 400 calibration cases;
- the 150 development gold rows;
- the 15 historical unresolved FN.

The 75 were editorially labeled **before any Kaikki lookup for those graphies**. The source evaluation then ran without any further rule change.

Composition: **27 positive / 48 negative**.

Total new gold reviewed in this mission: **225 relations**, within the requested 150–250 bound.

## Three-state evaluation

### Development 150 (diagnostic only)

| State | TP | FP | TN | FN | Precision | Recall | F1 |
|---|---:|---:|---:|---:|---:|---:|---:|
| A — baseline | 0 | 0 | 102 | 48 | 100.0% | 0.0% | 0.0% |
| B — observed senses ingested, no visual inference | 0 | 0 | 102 | 48 | 100.0% | 0.0% | 0.0% |
| C — source + tuned general deterministic filter | 16 | 0 | 102 | 32 | 100.0% | 33.3% | 50.0% |

The initial pre-tightening filter had produced 25 TP / 4 FP (86.2% precision, 52.1% recall). The four FP were caused by a general failure mode: a secondary concrete sense or weak concrete cue could green a lexeme whose dominant sense was not safely visual. The correction was general: use stronger semantic cues and require the dominant literal nominal sense. No word-specific exception was introduced.

### Sealed holdout 75 — primary independent result

| State | TP | FP | TN | FN | Precision | Recall | F1 |
|---|---:|---:|---:|---:|---:|---:|---:|
| A — baseline | 0 | 0 | 48 | 27 | 100.0% | 0.0% | 0.0% |
| B — observed senses ingested, no visual inference | 0 | 0 | 48 | 27 | 100.0% | 0.0% | 0.0% |
| C — **frozen** source filter | 0 | 0 | 48 | 27 | 100.0% | 0.0% | 0.0% |

The frozen rule therefore introduces **0 FP**, but also recovers **0 FN** on the untouched holdout. This is the decisive result for industrial readiness.

## Semantic coverage

### Development 150

- relations with at least one observed lexical sense: **148/150 = 98.7%**
- mean observed senses per relation: **7.13**
- source-created multi-sense ambiguity cases: **126/150 = 84.0%**
- cleanly unmatched: **2**
- serious concepts with a compatible dominant observed-sense proxy: **19/48 = 39.6%**

### Sealed holdout 75

- relations with at least one observed lexical sense: **71/75 = 94.7%**
- mean observed senses per relation: **5.07**
- observed senses materialized: **380**
- source-created multi-sense ambiguity cases: **60/75 = 80.0%**
- cleanly unmatched: **4**
- serious concepts with a compatible dominant observed-sense proxy: **3/27 = 11.1%**
- negative cases with observed senses that were correctly kept non-green: **44/44**

Across the complete 225-case gold, **219/225 = 97.3%** have at least one observed lexical sense. Thus the source solves lexical semantic coverage much better than it solves visual decision coverage.

## Historical 15 unresolved #294 FN

The source supplies observed senses for the historical orange cases and makes their lexical meaning substantially more explicit, but the frozen safe route greens none of them.

| Word | Observed senses | Dominant source sense, abbreviated | Outcome |
|---|---:|---|---|
| club | 4 | association with common activities/interests | orange |
| oeuvre | 1 | source entry does not yield an eligible dominant literal noun in the filter | orange |
| star | 1 | vedette, especially entertainment | orange |
| drogue | 17 | psychotropic substance | orange |
| mu | 4 | Greek letter μ/Μ | orange |
| course | 17 | action of running | orange |
| perte | 14 | deprivation/loss | orange |
| chasse | 24 | action of hunting | orange |
| pub | 2 | advertising message | orange |
| rêve | 10 | dream experience during sleep | orange |
| lettre | 12 | alphabetic character | orange |
| chose | 22 | generic object/idea/abstraction | orange |
| droite | 9 | right-hand side | orange |
| vote | 8 | expressed opinion/suffrage | orange |
| geste | 7 | bodily movement/action | orange |

This is a useful result: source evidence improves MOT→SENS without forcing unsafe SENS→IMAGE promotion.

## Calibration-leak protection

The production-like decision module is isolated in:

`scripts/lib/structured-sense-visual-filter.mjs`

Tests enforce that it:

- has no file I/O or access to gold/audit files;
- contains no `editorial_added` path;
- contains no exact lexical literals from the development gold, sealed holdout, historical 15 FN, or prior known false positives;
- cannot implicitly turn an imported observed sense into a visual candidate;
- keeps the B IPA provenance explicit.

The finalizer is also checked for historical-FN lexical exceptions.

## Green-route interpretation

The development set showed 16 apparent new green cases after tuning, but this is **not** an independent estimate because the same set was used to diagnose the filter.

The sealed holdout shows:

- old green: **0**
- new green: **0**
- gained green: **0**
- new false positives: **0**

Therefore no positive industrial green-rate projection is justified from this prototype. The defensible current estimate for **generalizable incremental green gain under the frozen rule is 0 on the sealed holdout**. The 16/150 development result is a hypothesis for future rule research, not a production projection.

## Human cost

Source ingestion itself is low-cost and deterministic: exact graphy lookup and sense materialization are automatable.

The expensive step remains SENS→CONCEPT VISUEL / nameability adjudication. On the sealed holdout, all **27/27 serious visual concepts** remain unrecovered by the frozen safe rule despite 94.7% lexical source coverage. In challenging strata this still implies approximately one editorial semantic/visual decision per candidate rather than a mostly automatic pipeline.

No human naming experiment was performed; `humanNamingEvidence` is `none` throughout.

## Recommendation

**NO for a 10,000–15,000 relation industrial batch.**

What is validated:

- real structured source ingestion;
- exact graphy identity with accents preserved;
- traceable multi-sense `observed` provenance;
- deterministic bounded fetching;
- safe separation between lexical observation and visual inference;
- very high lexical sense coverage;
- zero false positives on the sealed holdout under the frozen conservative route.

What is not validated:

- a meaningful independent recall gain from `observed` evidence;
- robust automatic resolution of source polysemy;
- a general SENS→CONCEPT VISUEL rule that transfers to unseen relations.

The next semantic research step should target **sense ranking / dominant-sense resolution and typed semantic classes**, with another pre-registered holdout. It should not be a 10–15k production batch and should not add manual word whitelists.
