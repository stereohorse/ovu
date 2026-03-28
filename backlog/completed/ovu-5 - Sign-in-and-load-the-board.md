---
id: OVU-5
title: Sign in and load the board
status: Done
assignee:
  - OpenCode
created_date: '2026-03-26 07:48'
updated_date: '2026-03-28 02:33'
labels: []
dependencies:
  - OVU-4
documentation:
  - README.md
  - docs/api-design.md
  - docs/engineering-spec.md
  - docs/architecture.md
  - docs/domain-model.md
priority: high
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Deliver the first runnable end-to-end user flow for ovu so an authenticated user can enter the app and see the board populated from live backend data. This slice should establish the minimum backend and frontend surfaces needed to move from local startup into a visible product experience.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An unauthenticated user can sign in through the MVP session flow and the app establishes authenticated state for subsequent requests.
- [x] #2 The frontend loads its bootstrap data and renders the initial application shell after sign-in.
- [x] #3 The board view reads task data from the backend and shows tasks grouped by their current workflow status.
- [x] #4 Protected endpoints reject unauthenticated access with the documented structured API error behavior.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a bounded in-memory backend slice in `apps/api` for MVP auth and board loading: seed one demo user, public app config, and sample board tasks shaped to the documented machine-status contract.
2. Implement session-cookie auth in Fastify with login/logout plus current-user resolution, and expose protected HTTP endpoints that return the documented structured `UNAUTHORIZED` envelope for unauthenticated access.
3. Extend the shared API boundary so the frontend can load authenticated bootstrap and board data after sign-in without duplicating types or hard-coding workflow enums in the UI.
4. Replace the placeholder home screen in `apps/web` with a sign-in-first application shell that restores session state on refresh, loads bootstrap + board data after authentication, and renders tasks grouped by workflow status.
5. Validate the slice with workspace typecheck/build plus a local end-to-end run covering sign-in, bootstrap load, board rendering, and unauthenticated rejection behavior.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Proceeding with the recommended bounded vertical slice: session-cookie auth, protected tRPC procedures, bootstrap + board queries, and seeded in-memory backend data shaped to the documented MVP contracts.

Implemented a bounded in-memory vertical slice for auth/bootstrap/board loading across `apps/api`, `packages/trpc`, and `apps/web`, including a demo user, seeded board tasks, shared task-status contracts, protected tRPC procedures, and documented REST auth endpoints with structured `UNAUTHORIZED` errors.

Replaced the placeholder web route with an index sign-in flow that restores session state via cookies, loads typed bootstrap + board data after auth, renders the board grouped by workflow status, and supports sign-out.

Validation completed with `pnpm --filter @ovu/api typecheck`, `pnpm --filter @ovu/trpc typecheck`, `pnpm --filter @ovu/web typecheck`, `pnpm typecheck`, `pnpm build`, curl checks for unauthenticated `401` + login/me/board flows, and browser-based sign-in/sign-out verification on desktop plus a mobile viewport smoke test.

During end-to-end validation I found the main UI was mounted at `/home` rather than `/`; I fixed that by moving `apps/web/app/routes/home.tsx` to `apps/web/app/routes/_index.tsx` so the board flow now loads from the root route as expected.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the first runnable OVU product slice with session-cookie auth, protected bootstrap and board loading, and a sign-in-first web shell backed by shared typed contracts and seeded MVP data. Verified the flow end to end with typecheck/build, structured unauthorized API responses, browser sign-in/sign-out, and a mobile viewport smoke test.
<!-- SECTION:FINAL_SUMMARY:END -->
