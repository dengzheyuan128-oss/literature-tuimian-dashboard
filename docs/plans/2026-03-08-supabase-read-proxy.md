# Supabase Read Proxy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Route public program-card reads through a Vercel server-side API so production users no longer need browser access to `*.supabase.co`.

**Architecture:** Add a serverless API endpoint that reads `public_program_card_reads` with server-side Supabase credentials and returns paginated JSON. Update the public frontend data layer to prefer the local API in production and keep direct Supabase only as a local-development fallback.

**Tech Stack:** Vercel Functions, Express-free API route, Supabase JS, TypeScript, Vitest, Vite

---

### Task 1: Define proxy response contract

**Files:**
- Create: `api/program-cards.ts`
- Test: `client/src/lib/programCardProxy.test.ts`

**Step 1:** Write a failing test for parsing proxy payloads into the existing card dataset shape.

**Step 2:** Implement a stable JSON shape for list and detail responses.

### Task 2: Implement server-side Supabase read proxy

**Files:**
- Create: `api/program-cards.ts`

**Step 1:** Read `public_program_card_reads` on the server using `SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY` or anon fallback.

**Step 2:** Support `limit`, `offset`, `search`, and `id`.

**Step 3:** Return consistent `source`, `configured`, `error`, `hasMore`, and `records`.

### Task 3: Switch public frontend reads to the proxy

**Files:**
- Modify: `client/src/lib/programCards.ts`

**Step 1:** Prefer `/api/program-cards` in production.

**Step 2:** Keep direct Supabase only for local-development fallback.

**Step 3:** Use the proxy for single-card detail reads too.

### Task 4: Verify production-safe behavior

**Files:**
- Test: `client/src/lib/programCardProxy.test.ts`
- Modify: `client/src/components/BuildInfo.tsx` if needed

**Step 1:** Run the new proxy unit test.

**Step 2:** Run `pnpm check` and `pnpm build`.

**Step 3:** After deploy, confirm `BuildInfo` no longer reports `public_program_card_reads query timed out`.
