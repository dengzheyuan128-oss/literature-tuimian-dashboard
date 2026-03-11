# Homepage Workbench Hero Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refocus the homepage hero so users are immediately guided into searching and filtering programs instead of reading promotional platform copy.

**Architecture:** Extract hero copy and CTA definitions into a small pure helper, cover it with focused tests, then update `Home.tsx` to render the new workbench-oriented content while keeping existing search and tier filters in place.

**Tech Stack:** TypeScript, React, Vitest

---

### Task 1: Add failing tests for homepage hero content config

**Files:**
- Create: `client/src/lib/homeHeroContent.ts`
- Create: `client/src/lib/homeHeroContent.test.ts`

**Step 1: Write the failing test**

Add tests proving:
- the hero headline is task-oriented
- only one primary CTA is present
- no more than two secondary CTAs are present

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run client/src/lib/homeHeroContent.test.ts`

Expected: FAIL because the helper does not exist yet.

### Task 2: Implement minimal homepage hero config

**Files:**
- Create: `client/src/lib/homeHeroContent.ts`
- Modify: `client/src/pages/Home.tsx`

**Step 1: Write minimal implementation**

Define task-oriented copy and a reduced CTA set in the helper, then wire `Home.tsx` to use it.

**Step 2: Run test to verify it passes**

Run: `pnpm exec vitest run client/src/lib/homeHeroContent.test.ts`

Expected: PASS

### Task 3: Verify no regressions

**Files:**
- Modify: `client/src/pages/Home.tsx` if needed

**Step 1: Run targeted verification**

Run: `pnpm exec vitest run client/src/lib/homeHeroContent.test.ts client/src/lib/statsDisplay.test.ts client/src/lib/programCards.test.ts client/src/lib/programCardsApi.test.ts`

Expected: PASS

**Step 2: Run build verification**

Run: `pnpm build`

Expected: exit 0

### Task 4: Commit and push

**Files:**
- Commit all files changed for this task

**Step 1: Commit**

Use a focused commit message describing the homepage hero simplification.

**Step 2: Push**

Push the branch to `origin/main`.
