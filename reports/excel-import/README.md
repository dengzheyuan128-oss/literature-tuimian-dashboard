# Excel Import Reports

This folder stores the normalized staging output generated from the four source Excel files in `excel/`.

## Files

- `staging-rows.json`: normalized row-level staging data
- `staging-summary.json`: import summary, header detection, row counts, and missing-key-field counts

## Regenerate

```bash
pnpm exec tsx scripts/import-excel-to-staging.ts
```

## Purpose

The staging layer is the stable handoff point between:

1. Excel cleaning and normalization
2. Database import into Supabase

Do not treat these files as the final public dataset.
