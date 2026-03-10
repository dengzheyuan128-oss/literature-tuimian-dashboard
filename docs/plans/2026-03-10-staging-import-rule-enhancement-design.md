# Staging Import Rule Enhancement Design

**Date:** 2026-03-10

## Goal

Improve the shared staging import pipeline so it derives cleaner, more reusable structured fields from existing Excel text columns, with a focus on:

- `english_requirement_text`
- fallback `application_method`
- more stable year/title generation

## Scope

This change is limited to the staging import layer in `shared/stagingImport.ts` and its tests. It does not change frontend rendering, Supabase schema, or manual per-school backfills.

## Approach

1. Keep the existing source columns as-is.
2. Add small derivation helpers in staging import that prefer explicit columns first and only fall back to text extraction when needed.
3. Return concise extracted summaries instead of dumping full source paragraphs into derived fields.
4. Protect behavior with focused tests before implementation.

## Non-Goals

- Full NLP extraction from arbitrary notice text
- Manual remediation for specific schools
- New database columns
- Search or UI changes

## Success Criteria

- English requirements become short extracted summaries when markers exist.
- Empty `application_method` values can be filled from common phrases in related text.
- Existing staging import selection behavior remains unchanged.
- Targeted tests and build pass.
