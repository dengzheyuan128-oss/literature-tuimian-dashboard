# Staging Import Rule Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve staging import derivation rules so imported notices expose cleaner english requirement summaries and stronger fallback application method values without changing downstream architecture.

**Architecture:** Keep the import schema unchanged and strengthen the derivation layer inside `shared/stagingImport.ts`. Add narrowly scoped helper functions, drive them with focused tests in `client/src/lib/stagingImport.test.ts`, and verify with targeted test runs plus a build.

**Tech Stack:** TypeScript, Vitest, shared import pipeline

---

### Task 1: Add failing tests for derived field extraction

**Files:**
- Modify: `client/src/lib/stagingImport.test.ts`
- Test: `client/src/lib/stagingImport.test.ts`

**Step 1: Write the failing test**

Add one test proving english requirement extraction returns a concise summary instead of the whole paragraph, and one test proving an empty `application_method` can be derived from common phrases in source text.

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run client/src/lib/stagingImport.test.ts`

Expected: FAIL because the existing implementation returns raw text or empty values.

### Task 2: Implement minimal derivation helpers

**Files:**
- Modify: `shared/stagingImport.ts`
- Test: `client/src/lib/stagingImport.test.ts`

**Step 1: Write minimal implementation**

Add helper functions that:
- extract a short english requirement line from requirement/material text
- infer application method from explicit column first, then text markers
- keep year/title derivation resilient to empty fragments

**Step 2: Run test to verify it passes**

Run: `pnpm exec vitest run client/src/lib/stagingImport.test.ts`

Expected: PASS

### Task 3: Verify no regressions

**Files:**
- Modify: `shared/stagingImport.ts` if needed

**Step 1: Run targeted verification**

Run: `pnpm exec vitest run client/src/lib/stagingImport.test.ts`

Expected: PASS

**Step 2: Run build verification**

Run: `pnpm build`

Expected: exit 0

### Task 4: Commit and push

**Files:**
- Commit all files changed for this task

**Step 1: Commit**

Use a focused commit message describing staging import rule enhancement.

**Step 2: Push**

Push the branch to `origin/main`.
