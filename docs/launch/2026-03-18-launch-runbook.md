# Launch Runbook

## Scope

This runbook covers the minimum launch path for the current user-facing app.
It assumes the public front end reads from `public_program_cards` and that data is refreshed before each release.

## Required Env Vars

Set these before building or deploying:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OAUTH_PORTAL_URL`
- `VITE_APP_ID`

Feature-gated / optional:

- `VITE_GLM_API_KEY`
- `VITE_FRONTEND_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_URL`
- `VITE_BAIDU_SITE_ID`
- `VITE_ADMIN_EMAILS`
- `VITE_SHOW_BUILD_INFO`

## Deployment Steps

1. Pull the latest repo state and confirm no unrelated work is being overwritten.
2. Verify env vars are present in the target environment.
3. Refresh data into the read model before cutover.
4. Run the production build.
5. Deploy the built assets to the hosting target.
6. Confirm the release URL and environment variables on the live site.

## Read-Model / Data Refresh

1. Refresh the upstream notice data.
2. Rebuild normalized records.
3. Regenerate `department_cards`.
4. Regenerate `public_program_cards`.
5. Check that the latest cards have:
   - stable IDs
   - source URLs
   - deadlines
   - availability status
   - eligibility summary
6. If the read model is stale or empty, stop the launch and fix the data pipeline first.

## Smoke Tests

Run these checks on the deployed site:

- Home page loads without visible copy breakage.
- Search returns current cards.
- A card shows a source link, deadline, and status.
- Card detail opens and shows the expected summary.
- Auth or reminder flows do not block public browsing.
- Admin-only controls stay hidden for non-admin users.

## Rollback Basics

Rollback if any of these fail:

- Public cards are missing or duplicated.
- Deadlines, source links, or status are wrong at scale.
- The site cannot load for the main user path.
- A deploy introduces broken copy, layout collapse, or failed auth.

Rollback order:

1. Revert the deploy artifact or redeploy the last known good build.
2. Restore the previous read-model snapshot or data export.
3. Verify the public cards list and home page again.

## Operator Responsibilities

- Refresh the data before launch and after any major import.
- Check the public read model for missing or stale cards.
- Watch for broken links, missing deadlines, and mismatched statuses.
- Verify the public browsing path after every deployment.
- Keep the launch checklist and rollback decision logged.
- Escalate to engineering if the read model or deploy pipeline cannot produce current cards.
