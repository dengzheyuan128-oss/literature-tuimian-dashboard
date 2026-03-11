# Reliable Stats Display Design

**Date:** 2026-03-10

## Goal

Stop the homepage and diagnostic panel from showing misleading totals when the API does not provide a reliable global count.

## Scope

This change is limited to display logic for:

- `client/src/components/BuildInfo.tsx`
- `client/src/pages/Home.tsx`

It does not reintroduce expensive database counts or change the API contract.

## Approach

1. Treat `totalCount` as the only reliable source of a global entry total.
2. When `totalCount` is missing, do not fall back to `cards.length` as if it were a site-wide total.
3. Show current-page counts separately from reliable global totals.
4. Move the branching logic into a small pure helper so it can be tested without rendering the full page.

## Success Criteria

- BuildInfo no longer shows `Entries: 2` when that number only reflects a one-item probe request.
- Home no longer claims `共 X 个条目` unless `totalCount` is actually available.
- Existing pagination and card rendering behavior stays unchanged.
