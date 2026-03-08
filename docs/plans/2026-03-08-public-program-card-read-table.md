# Public Program Card Read Table Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the browser's primary dynamic-view read path with a physical public read table for faster, more stable card listing, search, and detail fetches.

**Architecture:** Add a denormalized `public_program_card_reads` table owned by the write pipeline. Excel import and admin approval will upsert rows into this table whenever published card data changes. The frontend public list and detail path will query the read table directly, while legacy compatibility paths remain temporarily in place for non-public features.

**Tech Stack:** Supabase/Postgres, TypeScript, Vite, Vitest, Supabase JS

---

### Task 1: Add read-table DDL and refresh contract

**Files:**
- Create: `docs/plans/sql/2026-03-08-public-program-card-reads.sql`
- Modify: `docs/plans/2026-03-08-public-program-card-read-table.md`

**Step 1:** Define `public.public_program_card_reads` with one row per published card and read-oriented indexes.

**Step 2:** Grant `select` to `anon` and `authenticated`, and document that frontend list/search/detail must only read this table.

### Task 2: Add pure helpers for generating read rows

**Files:**
- Create: `shared/programCardReads.ts`
- Test: `client/src/lib/programCardReads.test.ts`

**Step 1:** Write failing tests for generating denormalized read rows from import-plan entities.

**Step 2:** Implement helpers that build one read row per program card using its latest approved notice.

### Task 3: Update import pipeline to write the read table

**Files:**
- Modify: `scripts/push-staging-to-supabase.ts`
- Test: `client/src/lib/programCardReads.test.ts`

**Step 1:** After inserting cards and notices, build read rows and upsert them into `public_program_card_reads`.

**Step 2:** Keep `latest_notice_id` updates in sync so the write model and read model stay aligned.

### Task 4: Update admin approval flow to maintain the read table

**Files:**
- Modify: `client/src/lib/supabase.ts`

**Step 1:** After approving a notice, fetch the published card's resolved data and upsert the matching read row.

**Step 2:** Keep the approval flow successful even if legacy compatibility fields remain untouched.

### Task 5: Move public reads to the read table

**Files:**
- Modify: `client/src/lib/programCards.ts`
- Modify: `client/src/lib/publicProgramCards.ts`

**Step 1:** Replace primary list/search reads from `public_program_cards` with `public_program_card_reads`.

**Step 2:** Replace detail lookup with a direct single-row query instead of fetching the list dataset.

**Step 3:** Keep a short transitional fallback to the old view only if the read table is missing, not as the main path.

### Task 6: Verify the new public path

**Files:**
- Test: `client/src/lib/programCards.test.ts`
- Test: `client/src/lib/programCardReads.test.ts`

**Step 1:** Run targeted Vitest suites for read-row generation and program-card mapping.

**Step 2:** Run `pnpm check` and `pnpm build`.

**Step 3:** Document the one required manual step: execute the new SQL in Supabase before redeploy.
