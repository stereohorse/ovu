---
id: OVU-11
title: Introduce tRPC for typed web-to-API interactions
status: Done
assignee:
  - OpenCode
created_date: '2026-03-28 01:49'
updated_date: '2026-03-28 02:09'
labels:
  - architecture
  - api
  - frontend
  - backend
dependencies: []
documentation:
  - docs/architecture.md
  - docs/api-design.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Adopt tRPC as the primary application-facing contract between the React Router web app and Fastify API while preserving infrastructure-style HTTP endpoints such as health checks. This task covers the shared typed procedure layer, server integration, frontend client setup, and documentation updates needed so the web app can use end-to-end typed calls instead of ad hoc REST handlers for product-facing interactions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The API exposes a tRPC entrypoint integrated with the existing Fastify app while keeping infrastructure endpoints such as `/health` available.
- [x] #2 The web app has a shared tRPC client setup suitable for React Router usage and can call at least one server procedure end-to-end.
- [x] #3 Shared procedure types are consumed without duplicating request or response types between `apps/api` and `apps/web`.
- [x] #4 The project documentation explains that the web app now treats tRPC as its primary application API boundary and clarifies the role of any remaining plain HTTP endpoints.
- [x] #5 Build or typecheck coverage is updated so the new tRPC integration is verified in normal development workflows.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implementation plan recorded in `docs/superpowers/plans/2026-03-28-trpc-frontend-backend.md`.

Execution breakdown:
1. Create shared `@ovu/trpc` workspace package, extend `pnpm-workspace.yaml`, update `apps/api/package.json` and `apps/web/package.json`, and export `TrpcContext`, `appRouter`, `AppRouter`, and `system.status` from `packages/trpc`.
2. Mount tRPC into Fastify by updating `apps/api/src/app.ts`, adding `apps/api/src/trpc/context.ts`, and adding `apps/api/src/trpc/plugin.ts` with Fastify `routerOptions.maxParamLength`, `/trpc` registration, request-scoped context, and typed plugin options.
3. Add the web client layer by creating `apps/web/app/lib/trpc.ts` and `apps/web/app/providers/trpc-provider.tsx`, updating `apps/web/app/root.tsx`, `apps/web/app/routes/home.tsx`, and `apps/web/vite.config.ts`, and rendering the first `system.status` query on the home page.
4. Update `docs/architecture.md` and `docs/api-design.md`, then verify with `pnpm typecheck` plus a local `pnpm dev` round trip that shows the `API transport` card resolving successfully.

Validation checkpoints:
- `pnpm --filter @ovu/trpc typecheck`
- `pnpm --filter @ovu/api typecheck`
- `pnpm --filter @ovu/web typecheck`
- `pnpm typecheck`
- manual browser verification at `http://127.0.0.1:5173`

Suggested commit sequence:
- `build: add shared trpc contract package`
- `feat: mount trpc in fastify api`
- `feat: add trpc client to web app`
- `docs: describe trpc as the web api boundary`
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a shared `@ovu/trpc` workspace package and mounted a typed `/trpc` boundary into the Fastify API so the web app can consume one end-to-end typed procedure without duplicating request or response shapes. The web app now provides a TanStack Query + tRPC provider layer at the root, proxies `/trpc` in Vite, and renders the first `system.status` procedure on the home page to prove the new frontend-backend contract.

Updated `docs/architecture.md` and `docs/api-design.md` to clarify that tRPC is now the primary application-facing boundary for the monorepo web app while operational endpoints like `/health` remain plain HTTP. Verification included `pnpm --filter @ovu/trpc typecheck`, `pnpm --filter @ovu/api typecheck`, `pnpm --filter @ovu/web typecheck`, `pnpm typecheck`, and a live request to `GET /trpc/system.status` against the API dev server returning the expected typed payload.
<!-- SECTION:FINAL_SUMMARY:END -->
