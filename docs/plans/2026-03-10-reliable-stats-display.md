# Reliable Stats Display Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure homepage and diagnostic stats only show reliable totals, avoiding misleading global counts derived from paginated data.

**Architecture:** Add a small pure helper module for stats-display rules, cover it with focused Vitest tests, then wire `BuildInfo` and `Home` to that helper. Keep API behavior unchanged so the fix stays on the display layer.

**Tech Stack:** TypeScript, React, Vitest

---

### Task 1: Add failing tests for stats-display rules

**Files:**
- Create: `client/src/lib/statsDisplay.test.ts`
- Test: `client/src/lib/statsDisplay.test.ts`

**Step 1: Write the failing test**

Add tests proving:
- global entry count is hidden when `totalCount` is missing
- global entry count is shown when `totalCount` exists
- homepage summary falls back to current-page-only wording when total is unavailable

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run client/src/lib/statsDisplay.test.ts`

Expected: FAIL because the helper does not exist yet.

### Task 2: Implement minimal stats-display helper

**Files:**
- Create: `client/src/lib/statsDisplay.ts`
- Modify: `client/src/components/BuildInfo.tsx`
- Modify: `client/src/pages/Home.tsx`

**Step 1: Write minimal implementation**

Add helper functions that:
- return `null` for unreliable global counts
- build homepage summary text based on reliable totals only

**Step 2: Run test to verify it passes**

Run: `pnpm exec vitest run client/src/lib/statsDisplay.test.ts`

Expected: PASS

### Task 3: Verify no regressions

**Files:**
- Modify: `client/src/components/BuildInfo.tsx` if needed
- Modify: `client/src/pages/Home.tsx` if needed

**Step 1: Run targeted verification**

Run: `pnpm exec vitest run client/src/lib/statsDisplay.test.ts client/src/lib/programCards.test.ts client/src/lib/programCardsApi.test.ts`

Expected: PASS

**Step 2: Run build verification**

Run: `pnpm build`

Expected: exit 0

### Task 4: Commit and push

**Files:**
- Commit all files changed for this task

**Step 1: Commit**

Use a focused commit message describing the stats display fix.

**Step 2: Push**

Push the branch to `origin/main`.
