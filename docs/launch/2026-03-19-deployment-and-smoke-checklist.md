# Deployment And Smoke Checklist

## 1. Deploy Prerequisites

Run these before touching the live environment:

- Confirm `pnpm check` passes locally.
- Confirm `pnpm build` passes locally.
- Confirm the target deployment points to the current `public_program_cards` path.
- Confirm no one is overwriting unrelated in-flight work.

## 2. Required Environment Variables

The live environment must provide:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional but expected in some environments:

- `VITE_BAIDU_SITE_ID`
- `VITE_GLM_API_KEY`
- `VITE_ADMIN_EMAILS`
- `VITE_SHOW_BUILD_INFO` should stay unset or `false` in production

## 3. Data Refresh Before Release

Do not launch if the read model is stale.

Release sequence:

1. Refresh staging/import source data.
2. Regenerate normalized notices and department-level cards.
3. Regenerate `public_program_cards`.
4. Spot-check a few records for:
   - stable ID
   - institution name
   - program name
   - deadline
   - source URL
   - availability status
   - eligibility summary

## 4. Deployment Steps

1. Push the current branch or merge the approved branch.
2. Trigger the production build and deploy.
3. Confirm the build artifact is the current one.
4. Confirm the live site is reading the expected environment.
5. Open the release URL and clear any stale browser cache.

## 5. Post-Deploy Smoke Test

Check these flows on the live site:

### Public / core flow

- Landing page loads and has no visible garbled text.
- Login page opens.
- Privacy / terms / data sources / feedback pages open.
- Dashboard loads after login.
- Search returns cards.
- A project card shows:
  - institution name
  - program name
  - deadline
  - official source link
  - availability / verification badges
- Card detail modal opens and closes correctly.
- Official source link can open in a new tab.

### User tools

- Add to compare works.
- Add reminder works.
- Favorite toggle works.
- Matcher form can save profile.
- Matcher can generate a result page.
- Match result page renders all three sections without broken copy.

## 6. Mainland China Network Check

This step cannot be skipped if the launch target includes mainland users.

Test from a real mainland network:

- Landing page first load speed is acceptable.
- Login succeeds.
- Dashboard data loads without hanging.
- Search and card detail are usable.
- External official links can still open.

If mainland access is unstable, do not call the release complete.

## 7. Rollback Triggers

Rollback immediately if any of these happen:

- `public_program_cards` is empty or obviously stale.
- Cards are duplicated at scale.
- Deadlines or source links are systematically wrong.
- Public pages show visible garbled text.
- Login blocks access to the normal user path.
- Dashboard cannot load for the main path.

## 8. Rollback Steps

1. Revert or redeploy the last known good build.
2. Restore the last known good read-model snapshot if needed.
3. Re-run the smoke checks on the restored version.
4. Record the failure reason before trying another release.

## 9. Launch Sign-Off

Do not mark the release complete until all of these are true:

- Local verification passed
- Live deploy succeeded
- Read model refreshed
- Core smoke test passed
- Mainland network check passed
- Rollback target identified
