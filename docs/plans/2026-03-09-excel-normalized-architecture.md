# Excel Unified Data Architecture

**Goal:** Freeze the minimum data-model decisions required to unify four inconsistent Excel sources before any further import-script changes.

**Scope:** This document only defines object boundaries, required-field rules, deduplication, card selection, and rerun constraints. It does not add new UI fields or new parsing features.

---

## 1. Object Boundaries

The pipeline must be physically separated into four layers:

1. `raw_excel_rows`
   Stores the original row-level source payload. This layer is append-only and never manually edited.

2. `normalized_notices`
   Stores one normalized notice fact per row. This is the only standardized input for downstream processing.

3. `department_entities`
   Stores normalized department-level identities so slight naming differences do not split one department into multiple cards.

4. `department_cards`
   Stores the aggregated UI-facing card model. One card represents one department under one school.

These layers must not be collapsed into one table or one JSON shape.

---

## 2. Required Field Threshold

A field can enter the first-version required set only if it satisfies all of the following:

1. It can be mapped across all four Excel files.
2. Its meaning is stable across files.
3. Its completion rate is high enough to avoid uneven cards.
4. It can be read directly from source columns.

Any field that requires inference, text guessing, or cross-field derivation is excluded from the required set.

### First-Version Required Fields

Required source-trace fields:

- `source_file`
- `source_sheet`
- `source_row`

Required notice fields:

- `school_name`
- `department_name`
- `published_at_raw`
- `stage_raw`
- `notice_url`
- `application_method_raw`
- `requirement_text`

### Why `application_method_raw` and `requirement_text` are still required in V1

- `application_method_raw`
  maps directly from the `报名方式` column in the Excel sources and has high completion in the current staging output (`15339 / 15622` non-placeholder rows).

- `requirement_text`
  maps directly from `本科专业要求` in the 2024/2025 files and from `申请要求` in the 2026 file. It also has usable completion in the current staging output (`12710 / 15622` non-placeholder rows).

If later re-import evidence shows either field falls below the required-field bar after the new unified pipeline, it should be downgraded to optional.

Everything else is optional or excluded from first-version cards.

### Explicitly Not Required in V1

- `program_name_raw`
- `application_start_raw`
- `application_end_raw`
- `event_start_raw`
- `event_end_raw`
- `ranking_requirement_text`
- `materials_text`
- `english_requirement_text`
- `degree_type`
- all inferred tags or summary fields

---

## 3. Department Entity Key

`department_entities` uses a readable natural key in V1:

`school_name_normalized + "::" + department_name_normalized`

Reason:

- easy to inspect during cleanup
- easy to diff during reruns
- matches the current aggregation unit of "school + department"

UUID-style identifiers can be added later if needed.

---

## 4. Notice Deduplication

V1 uses a conservative two-level strategy.

### Exact Dedup Key

Use this first:

`school_name + department_name + notice_url + source_file`

This avoids accidental over-merging when the same notice URL appears in more than one yearly Excel file.

### Logical Dedup Candidate

Track this separately for future tightening:

`school_name + department_name + notice_url`

This is not the primary V1 dedup key.

### URL-Missing Records

If `notice_url` is empty:

- keep the row in `normalized_notices`
- mark `has_url = false`
- exclude it from default `department_cards` aggregation

This preserves source data without polluting public cards.

---

## 5. Stage Values

V1 keeps both:

- `stage_raw`
- `stage_normalized`

`stage_normalized` is optional derived data, not part of the V1 required-field set.

Allowed V1 normalized values:

- `pre_admission`
- `summer_camp`
- `winter_camp`
- `other`
- `unknown`

`unknown` is the fallback when the raw stage cannot be mapped safely.

---

## 6. Current Notice Selection Rule

Each `department_card` shows one primary current notice and keeps the rest in history.

Selection order:

1. latest year
2. latest `published_at_raw`
3. highest stage priority

Stage priority in V1:

`pre_admission > summer_camp > winter_camp > other > unknown`

If multiple notices still tie after these rules:

- show the notice with the latest parsed `published_at_raw`
- if `published_at_raw` is still tied or unparsable, use the record with the larger `source_row` within the same `source_file`
- keep the remaining notices in the department history list

---

## 7. Rerun Constraint

The architecture must support deterministic reruns.

Rules:

1. `raw_excel_rows` is source-of-truth and never hand-edited.
2. `normalized_notices` is fully regenerated from raw rows plus current cleaning rules.
3. `department_entities` is regenerated from normalized notices.
4. `department_cards` is regenerated from department entities plus aggregation rules.

V1 assumes full reruns.

Future note:

- incremental reruns may be needed later
- V1 does not optimize for that yet

---

## 8. What This Enables

After this document is accepted:

1. update the import script to emit the four-layer model
2. keep optional fields out of first-version card logic
3. build department cards from normalized notices instead of raw Excel rows

This document is the reference point for all next import-script changes.
