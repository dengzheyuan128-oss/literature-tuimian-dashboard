# Public Program Cards V1 Execution Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Freeze `public_program_cards` V1 as the single public read contract, then land the minimum data-layer and frontend changes needed to make the site queryable and decision-oriented.

**Architecture:** Treat `public_program_cards` as the only public-facing read model. First freeze the V1 contract and generation rules. Then implement two parallel tracks: (1) backend/read-model generation and validation, (2) frontend migration to the frozen contract. Finish with focused review, repair, and verification.

**Tech Stack:** React 19, TypeScript, Vite, Supabase, shared import/read-model utilities, Vitest

---

## Frozen V1 Contract

### V1 must land

- `stable_id`
- `institution_name`
- `program_name`
- `notice_type`
- `deadline`
- `eligibility_summary`
- `source_url`
- `updated_at`

### V1 can land with conservative rules

- `application_stage`
- `published_at`

### V1 may stay nullable but field must exist

- `availability_status`
- `verification_status`
- `last_verified_at`

## Generation Rules To Freeze

### `program_name`

- Preferred source: current card/program layer
- Fallback order: explicit card program name -> specialty summary -> department name
- Failure rule: never synthesize from unrelated notice text

### `notice_type`

- Preferred source: normalized stage on selected latest notice
- Fallback: card primary stage
- Output should stay in the normalized enum space already used by the read layer

### `application_stage`

- Conservative rule: use card primary stage if present
- If missing, use selected latest notice normalized stage
- If still missing, return `null`

### `published_at`

- Preferred source: selected latest notice published date
- If missing or unparseable, return `null`

### `deadline`

- Preferred source: selected latest notice application end
- If missing or unparseable, keep raw string only if it is still user-meaningful
- If no meaningful value exists, surface as `null` and let validation/reporting catch it

### `source_url`

- Preferred source: selected latest notice URL
- If missing, do not synthesize from institution homepages

### `availability_status`

- Keep field in V1 contract
- Default to `null` until backend rule is explicitly defined

### `verification_status`

- Keep field in V1 contract
- Default to `null` until backend rule is explicitly defined

### `last_verified_at`

- Keep field in V1 contract
- Default to `null` until backend rule is explicitly defined

## Development Order

### Track 0: Freeze contract and acceptance

**Files:**
- Modify: `docs/plans/2026-03-09-database-minimum-loop.md`
- Modify: `docs/plans/2026-03-18-public-program-cards-v1-execution.md`

**Step 1: Write the contract summary**

- Add the three field tiers into the database minimum-loop doc or link back here.
- State that public frontend reads only `public_program_cards`.

**Step 2: Define acceptance**

- Acceptance checklist:
  - public frontend reads one public contract
  - no frontend current-card selection logic remains
  - missing `deadline` / `source_url` / `program_name` are identifiable
  - new data import can refresh cards without browser-side stitching

### Track 1: Data-layer read-model tightening

**Files:**
- Modify: `shared/programCardReads.ts`
- Modify: `scripts/push-staging-to-supabase.ts`
- Modify: `client/src/lib/programCards.ts`
- Modify: related tests discovered during implementation
- Modify: SQL or read-model docs if current schema contract needs to be aligned

**Step 1: Verify read-row shape matches V1**

- Ensure `ProgramCardReadRow` and any SQL/read-table expectations include the frozen V1 fields.

**Step 2: Tighten generation rules**

- Update `buildProgramCardReadRows` to use the frozen field precedence.
- Keep nullable placeholders only for the three explicitly deferred fields.

**Step 3: Add minimal validation/reporting**

- Detect rows missing `stable_id`, `program_name`, `deadline`, or `source_url`.
- Keep the read model producible, but make missing values visible to verification.

**Step 4: Make query path prefer the public read model**

- Ensure `client/src/lib/programCards.ts` keeps `public_program_card_reads` / `public_program_cards` as the primary path.
- Avoid hidden front-end reconstruction if the read model is present.

### Track 2: Frontend migration to the frozen contract

**Files:**
- Modify: `client/src/types/publicProgramCard.ts`
- Modify: `client/src/lib/publicProgramCards.ts`
- Modify: `client/src/lib/programCards.ts`
- Modify: `client/src/pages/Home.tsx`
- Modify: `client/src/components/SearchCommand.tsx`
- Modify: any directly dependent tests

**Step 1: Freeze frontend type usage**

- Align `PublicProgramCard` with the V1 contract and existing UI needs.
- Avoid legacy assumptions that require browser-side notice stitching.

**Step 2: Update mapping layer**

- Make `mapProgramCardRecordToUniversity` and public card mapping depend on the frozen fields, not implicit legacy fields.

**Step 3: Keep the public UI on one source**

- Homepage, search, and card interactions should consume the same `usePublicProgramCards` contract.

**Step 4: Reduce hidden fallback dependence**

- Archived JSON may remain as emergency fallback, but not as the normal operating path.

### Track 3: Review and repair

**Files:**
- Modify only the smallest set required by review findings

**Step 1: Review spec compliance**

- Confirm each field rule matches the frozen contract.

**Step 2: Review code quality**

- Remove duplicated mapping logic where practical.
- Keep conversion responsibilities explicit between read rows, `University`, and `PublicProgramCard`.

**Step 3: Repair blockers**

- Fix only issues that block the V1 loop.
- Defer non-critical product polish and advanced recommendation logic.

## Parallelization Boundary

Safe to run in parallel:

- Data-layer read-model tightening
- Frontend type/mapping migration
- Independent audit for hidden legacy reads and fallback behavior

Must stay serialized:

- Freezing the V1 contract
- Final integration and verification

## Verification

Minimum checks before calling this done:

- Focused tests for read-model generation and program card mapping
- Focused tests for frontend read-path behavior if present
- Manual verification that homepage/search consume the public contract without extra stitching
- Manual spot-check that records missing `deadline`, `source_url`, or `program_name` are visible as data issues rather than silently faked

## Definition of Done

- `public_program_cards` V1 contract is documented and frozen
- Read-model generation follows the frozen precedence rules
- Public UI reads one contract for cards/search
- Missing key decision fields are surfaced for repair
- No new work was added outside the minimum decision loop
