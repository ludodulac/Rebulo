# REBULO — Canonical state contract (051A)

This contract defines the future machine-readable source of truth for REBULO representation state. It does **not** populate the current representation inventory and does not replace human decisions.

## Authority by field

- `graphic_status` is the graphic lifecycle only: `SOURCE_ONLY`, `CANDIDATE`, `HUMAN_VALIDATED`, `CANONICAL`, `BLOCKED`, `MISSING`.
- `visual_validation.status` and `naming_validation.status` are independent human-validation dimensions. File existence never implies either validation.
- `runtime_active` + `runtime_status` are operational runtime state. `RUNTIME_ACTIVE` exists only in `runtime_status`; validation or canonical storage never implies runtime activation.
- `runtime_piece_id` + `runtime_asset_ref` identify the exact runtime binding (piece ID plus path/URL). They are mandatory when `runtime_active == true` and null when inactive, preventing an active legacy/OpenMoji asset from being confused with a separate Drive candidate or canonical file.
- `drive_source_id`, `drive_candidate_id`, `drive_canonical_asset_id`, and `github_asset_path` are explicit locations. Null means no authoritative location is recorded for that field.
- `provenance` records all supporting observations, including duplicate or historical Drive IDs; a single location field must not erase conflicting evidence.
- `latest_proof` is the newest observed proof and may be automated.
- `canonical_decision` is separate and may only carry `HUMAN_DECISION` or `CANONICAL_DECISION` authority. Therefore a newer analysis-bot commit on `main` does not silently replace the last canonical decision.
- `next_action` is the next explicit state-transition task, not a product instruction.
- `updated_at` timestamps the registry record update, not necessarily the latest human decision.

## Derived counters

Counters are **derived**, never stored as canonical truth:

- `canonical_asset_count`: records with `graphic_status == CANONICAL`.
- `candidate_count`: records with `graphic_status == CANDIDATE`.
- `human_validated_count`: records where both `visual_validation.status == PASS` and `naming_validation.status == PASS`.
- `runtime_active_count`: records with `runtime_active == true` and `runtime_status == RUNTIME_ACTIVE`.
- `inactive_count`: records with `runtime_active == false` and `graphic_status` not in `[BLOCKED, MISSING]`.
- `blocked_count`: records with `graphic_status == BLOCKED`.
- `missing_count`: records with `graphic_status == MISSING`.

The counters are intentionally orthogonal: a canonical asset can be runtime-inactive, and a file can exist without human validation. A concept may also have a Drive candidate while a different legacy/external asset is active; the runtime binding fields identify the active artifact explicitly.

## Proof model

`latest_proof.proof_type` explicitly supports GitHub commit, GitHub PR, Drive file, human validation, and certified report evidence. Each proof also carries an `authority` value so observations and automated derivations remain distinguishable from human/canonical decisions.

051A changes only this contract. No assets, runtime files, workflows, Drive documents, or representation inventory are modified.
