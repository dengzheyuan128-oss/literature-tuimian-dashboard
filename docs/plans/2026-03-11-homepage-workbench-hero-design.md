# Homepage Workbench Hero Design

**Date:** 2026-03-11

## Goal

Make the homepage first screen feel like a task-focused workbench instead of a platform introduction page.

## Scope

This change is limited to the hero area in `client/src/pages/Home.tsx`.

It will:

- rewrite the headline and supporting copy to be action-oriented
- reduce the number of top-level CTA buttons
- keep search and tier filters as the main first-screen actions

It will not:

- redesign the rest of the homepage
- change card rendering, detail pages, or data flow
- add new backend or matching logic

## Approach

1. Replace descriptive platform copy with decision-oriented copy.
2. Keep one primary CTA and two supporting CTAs at most.
3. Let search and tier filters remain the core interaction in the hero.
4. Avoid claims that over-promise current system capability.

## Success Criteria

- The first screen tells users what to do next, not what the platform is.
- Search and filtering remain visually primary.
- The hero no longer reads like a marketing section.
