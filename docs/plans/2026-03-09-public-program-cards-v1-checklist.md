# Public Program Cards V1 Checklist

**Goal:** Get `public_program_cards` V1 to produce a stable, decision-oriented read model before expanding field completeness.

**Core rule:** Stabilize `public_program_cards` first. Improve completeness second.

---

## 1. V1 Field Tiers

### V1 Must Ship

- `stable_id`
- `institution_name`
- `program_name`
- `notice_type`
- `deadline`
- `eligibility_summary`
- `source_url`
- `updated_at`

These fields are the minimum set needed for the frontend to answer:

- what is this?
- when does it end?
- where is the official source?
- is it worth clicking?

### V1 Ship With Conservative Rules

- `application_stage`
- `published_at`

These fields are useful in V1, but they must use defensive mappings and allow nulls when the source is weak.

### V1 Keep In Contract But Allow Placeholder / Null

- `availability_status`
- `verification_status`
- `last_verified_at`

These fields should exist in the contract now so the frontend contract stops drifting, but V1 is allowed to leave them null or use conservative placeholder values until the backend rules are implemented.

---

## 2. V1 Contract

This is the frozen V1 field contract for `public_program_cards`.

| Field | Type | Nullable | Default / Placeholder | V1 status |
|---|---|---|---|---|
| `id` | `text` or `uuid` | no | database-generated | required |
| `stable_id` | `text` | no | none | required |
| `institution_name` | `text` | no | none | required |
| `department_name` | `text` | yes | `null` | allowed |
| `program_name` | `text` | no | fallback rule required | required |
| `notice_type` | `text` | no | `unknown` only if mapping fails | required |
| `application_stage` | `text` | yes | `null` | conservative |
| `published_at` | `text` or `date` | yes | `null` | conservative |
| `deadline` | `text` or `date` | yes | `null` | required field, but record must be flagged if missing |
| `availability_status` | `text` | yes | `null` or `unknown` | placeholder allowed |
| `eligibility_summary` | `text` | no | fallback rule required | required |
| `source_url` | `text` | no | none | required |
| `verification_status` | `text` | yes | `null` or `unverified` | placeholder allowed |
| `last_verified_at` | `timestamptz` or `text` | yes | `null` | placeholder allowed |
| `updated_at` | `timestamptz` | no | refresh timestamp | required |

---

## 3. Fixed Generation Rules

These rules must be implemented before broader field expansion.

### `stable_id`

Source priority:

1. `department_entities.key`

Rule:

- use the current natural key
- one stable department card must always map to one stable `stable_id`

### `program_name`

Source priority:

1. explicit normalized program name if available
2. notice-level program name
3. department name fallback

V1 rule:

- if no stable program-level name exists, fall back to the department-level current card name
- do not invent a name from long free text

### `notice_type`

Source priority:

1. `stage_normalized`
2. `stage_raw`

V1 rule:

- map to a stable public enum using the current normalized stage values
- use `unknown` only when safe mapping is not possible

### `application_stage`

V1 rule:

- derive conservatively from the selected current notice
- if a trustworthy stage cannot be expressed, return `null`
- do not force-fit every notice into a richer lifecycle than the source supports

### `published_at`

V1 rule:

- use the selected current notice's published date
- if parsing fails, keep the raw public-safe representation or return `null`
- do not fabricate a date

### `deadline`

V1 rule:

- use the selected current notice's application end field
- if parsing fails, return `null`
- missing deadline must be surfaced during validation, not silently accepted

### `eligibility_summary`

V1 rule:

- derive from the current selected notice's requirement text
- keep it short and source-faithful
- do not over-summarize with LLM-style rewriting in V1

### `source_url`

V1 rule:

- use the selected current notice URL
- cards without usable source URL must not become public current cards

---

## 4. Execution Order

### Step 1. Freeze the V1 contract

- finalize field names
- finalize types
- finalize nullability
- finalize placeholder policy

### Step 2. Implement generation rules

Lock down:

- `program_name` fallback
- `notice_type` mapping
- `application_stage` conservative mapping
- `deadline` null / parse-failure handling
- `stable_id` generation

### Step 3. Update SQL and read-model generation

Make the database-side `public_program_cards` or equivalent physical read model produce the V1 contract consistently.

### Step 4. Add minimum validation to the import/read pipeline

At minimum, detect and report missing or weak values for:

- `stable_id`
- `program_name`
- `deadline`
- `source_url`

### Step 5. Move the public frontend onto the single read model

- Home
- search
- public list cards
- detail entry path

All should read from `public_program_cards` only.

---

## 5. Validation Focus

The V1 validation pass does not need to validate every field equally.

It must focus first on:

- `source_url`
- `deadline`
- `program_name`
- `stable_id`

These are the fields most likely to break user judgment if wrong or missing.

---

## 6. Acceptance Criteria

This step is complete only if all four checks pass:

1. The public frontend reads one read model only.
2. The same real-world project does not produce multiple current cards by accident.
3. Records missing `deadline`, `source_url`, or `program_name` are explicitly identified.
4. After new data import, current cards refresh through backend generation instead of frontend patch logic.

---

## 7. What Not To Do In V1

Do not block V1 on:

- full field completeness
- rich tags
- complex verification workflow states
- advanced availability inference
- recommendation logic
- analytics fields

V1 succeeds when the current card becomes stable and decision-usable, not when the schema becomes exhaustive.
