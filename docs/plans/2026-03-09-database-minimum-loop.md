# Database Minimum Loop

**Goal:** Define the minimum database loop that produces one stable, trustworthy, user-facing current read model for the public frontend.

**Core principle:** The backend is not trying to model everything first. It is trying to generate a single current card object that helps a student decide what matters, what is still valid, and what to do next.

---

## 1. Final Target

The current target is not "finish the entire data model".

It is:

> produce one stable, trustworthy, decision-oriented current read model that the frontend can consume uniformly.

That read model is:

`public_program_cards`

or an equivalent physical read table/view that plays the same role.

Everything before it exists to clean, normalize, and select the right current record.

---

## 2. Minimum Layered Objects

The minimum loop should be understood as five layers.

### A. `raw_notices`

Purpose:

- preserve original import or crawl payload
- preserve provenance
- never serve the public frontend directly

This is the source-truth recovery layer.

### B. `normalized_notices`

Purpose:

- convert raw notice-like records into one standard notice shape
- keep the system in a notice-centric view
- normalize structure without pretending to be the final user card

This is the first structured layer.

### C. `department_entities`

Purpose:

- define one stable department/project identity
- prevent slight naming variation from splitting the same department into multiple cards

This is the identity-stability layer.

### D. `department_cards`

Purpose:

- aggregate entity identity with the currently selected effective notice
- produce one candidate display object per department

This is the current-card assembly layer.

### E. `public_program_cards`

Purpose:

- expose the final public read model
- present only user-decision fields
- be the only object the public frontend reads

This is not the ground-truth table.
It is the product-facing current read model.

If compressed into one sentence:

The first four layers clean the mess. The last layer gives students a usable current object.

---

## 3. Current Codebase Mapping

The repo already approximates this direction:

- local import model:
  - `rawExcelRows`
  - `normalizedNotices`
  - `departmentEntities`
  - `departmentCards`
- database/public read side:
  - `program_cards`
  - `notices`
  - `public_program_card_reads`

The next backend step is not inventing another structure.
It is aligning the database read side with the new layered import side so both produce the same public current-card contract.

---

## 4. Trusted Fields To Prioritize First

Do not optimize the first batch by schema completeness.
Optimize by user decision value.

### High-Priority Trusted Fields

- `stable_id`
- `institution_name`
- `department_name`
- `program_name`
- `notice_type`
- `application_stage`
- `published_at`
- `deadline`
- `source_url`
- `verification_status`
- `availability_status`
- `eligibility_summary`
- `last_verified_at`
- `updated_at`

### Why These Fields Matter

They answer the user's real questions:

- what is this opportunity?
- is it current?
- when do I need to act?
- can I trust the source?
- what is the main threshold?

### Minimum Decision Core

If only five fields can be made trustworthy first, prioritize:

- `stable_id`
- `deadline`
- `source_url`
- `availability_status`
- `eligibility_summary`

These five most directly support "should I look at this, can I trust it, and do I need to act now?"

---

## 5. Frontend Read Rule

The public frontend should read from exactly one layer:

`public_program_cards`

The public frontend should not read directly from:

- `raw_notices`
- `normalized_notices`
- `department_entities`
- ad hoc joins in the browser
- archived JSON fallback as a normal operating path

The frontend should also not decide:

- which notice is current
- whether a card is still actionable
- how trust status is computed
- how the card summary is assembled

Frontend responsibilities should stay limited to:

- display
- filter and sort
- user actions such as save, remind, compare, and jump to source

In short:

The frontend consumes the finished dish. The backend does the cooking.

---

## 6. Minimum Backend Loop

The minimum backend loop is:

1. ingest source notice content into `raw_notices`
2. normalize into `normalized_notices`
3. resolve stable ownership through `department_entities`
4. select one current effective record into `department_cards`
5. publish the frontend-facing result into `public_program_cards`
6. serve the public frontend only from `public_program_cards`

If the public frontend still needs to guess, merge, or rank raw notice candidates itself, the loop is not complete.

---

## 7. Current-Card Selection Rule

The current-card selection rule must be backend-owned and deterministic.

Current order:

1. latest year
2. latest published date
3. stage priority
   `pre_admission > summer_camp > winter_camp > other > unknown`
4. deterministic tiebreaker

That means:

- one current card must point to one selected current notice
- the read model must not independently pick a different "latest" record
- public ranking and filtering must start from this already-selected object

---

## 8. `public_program_cards` Minimum Field Set

V1 target fields for the public read model:

- `id`
- `stable_id`
- `institution_name`
- `department_name`
- `program_name`
- `notice_type`
- `application_stage`
- `published_at`
- `deadline`
- `availability_status`
- `eligibility_summary`
- `source_url`
- `verification_status`
- `last_verified_at`
- `updated_at`

Second-priority fields after the loop is stable:

- `institution_tags`
- `location`
- `discipline_grade`
- `degree_type`
- `materials_summary`
- `exam_form_summary`

---

## 9. Field Mapping Table

This table answers a practical question:

Which `public_program_cards` fields can already be produced from the current four-layer import model, and which still need extra database or cleaning work?

| Read field | Current source layer | Current source field(s) | Ready now | Notes |
|---|---|---|---|---|
| `id` | `department_cards` / DB read layer | `department_cards.key` or DB card id | Partial | Local model has stable department card key; DB still needs final public id strategy. |
| `stable_id` | `department_entities` | `department_entities.key` | Yes | Natural key already exists as `school_name_normalized::department_name_normalized`. |
| `institution_name` | `department_cards` | `school_name` | Yes | Already present in local four-layer model. |
| `department_name` | `department_cards` | `department_name` | Yes | Already present in local four-layer model. |
| `program_name` | `department_cards` / optional notice field | currently falls back to department name | Partial | Current local model uses department name as placeholder; needs a stronger program naming rule later. |
| `notice_type` | `normalized_notices` | `stage_normalized` or `stage_raw` | Partial | Current stage normalization exists; naming should be stabilized for public semantics. |
| `application_stage` | `department_cards` | `primary_stage` / `stage_normalized` | Partial | Current model has raw and normalized stage, but no final public field naming yet. |
| `published_at` | `normalized_notices` | `published_at_raw` | Partial | Raw value exists; structured date field is not yet formalized. |
| `deadline` | `normalized_notices` | `application_end_raw` | Partial | Exists only for some notices; should map to public deadline only when reliable. |
| `availability_status` | derived read layer | year + deadline + verification policy | No | Needs explicit backend rule, not yet implemented. |
| `eligibility_summary` | `department_cards` | `requirement_text` | Yes | Current card layer already carries a compact requirement text field. |
| `source_url` | `normalized_notices` / `department_cards` | `notice_url` | Yes | Current notice selection already excludes URL-missing cards by default. |
| `verification_status` | DB/service layer | source policy + review state + link status | No | Needs explicit database/service field definition. |
| `last_verified_at` | DB/service layer | verification workflow timestamp | No | Not present in current import model. |
| `updated_at` | DB/service/read layer | import or refresh timestamp | Partial | DB read model already has `updated_at`; import artifacts also have generation time. |

---

## 10. Completion Standard

The minimum loop should only be considered complete when all five questions can be answered with "yes":

1. Does the public frontend read exactly one stable view?
2. Does each card have a stable identifier that survives reruns?
3. Can a student directly judge what this is, whether it is still active, whether it is trustworthy, and what to do next?
4. Is the currently displayed record chosen by the backend instead of frontend assembly logic?
5. When source notices change, can the public read model be regenerated deterministically?

---

## 11. Practical Next Step

The next implementation priority is not expanding schema breadth.

It is:

1. align the database-side read model with the local four-layer import model
2. fill the trusted field set above in the backend read layer
3. move the public frontend onto that single read model without bypasses

That is the minimum database loop that can support real user decisions.
