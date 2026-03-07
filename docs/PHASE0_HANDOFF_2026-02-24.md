# Phase 0 Handoff (2026-02-24)

## Scope
- Current active phase: `Phase 0 (environment + build baseline only)`
- Constraint: `no cross-phase changes`

## Done in this phase
- Unified package-manager direction to `pnpm`.
- Deleted `package-lock.json`.
- Added baseline files:
  - `.nvmrc` (`20.19.0`)
  - `.npmrc` (`package-manager-strict=true`, `engine-strict=true`)
- Updated `package.json`:
  - `engines.node` / `engines.pnpm`
  - `scripts.verify = "pnpm check && pnpm build"`
  - `scripts.verify:full = "pnpm check && pnpm build && pnpm check:data"`
  - `pnpm.onlyBuiltDependencies = ["esbuild", "@tailwindcss/oxide"]`
- Updated `README.md` with Phase 0 baseline and verify usage.

## Current factual status
- `pnpm install`: already succeeded in latest state.
- `pnpm check`: passes.
- `pnpm build`: fails with `esbuild spawn EPERM`.
- `pnpm exec esbuild --version`: passes (`0.25.10`).
- Current runtime versions:
  - Node: `v24.11.1`
  - pnpm: `10.4.1`
  - `.nvmrc` target: `20.19.0`

## Blocker (environment)
- Build blocked by local policy/permission issue:
  - error signature: `spawn EPERM` during Vite config bundling via esbuild.

## Next minimal steps after restart (Phase 0 only)
1. Switch Node to `.nvmrc` target (`20.19.0`), then verify:
   - `node -v`
2. Rebuild native/build-time deps:
   - `pnpm rebuild esbuild @tailwindcss/oxide`
3. Re-test:
   - `pnpm check`
   - `pnpm build`
   - `pnpm verify`
4. If still `EPERM`, apply host-level fixes in order:
   - Run terminal as Administrator
   - Add Defender/AV whitelist for repo + pnpm tool dir
   - Move repo out of Desktop to a neutral path (e.g. `C:\dev\...`) and retry

## Restart quick-read set
- `docs/PHASE0_HANDOFF_2026-02-24.md` (this file)
- `package.json`
- `README.md` (tail section: Development Baseline)
