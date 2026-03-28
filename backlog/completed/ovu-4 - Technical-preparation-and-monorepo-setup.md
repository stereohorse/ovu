---
id: OVU-4
title: Technical preparation and monorepo setup
status: Done
assignee:
  - OpenCode
created_date: '2026-03-26 07:48'
updated_date: '2026-03-28 01:40'
labels: []
dependencies: []
documentation:
  - README.md
  - docs/architecture.md
  - docs/engineering-spec.md
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Establish the baseline workspace structure for the ovu MVP so frontend and backend delivery can happen inside one stable monorepo instead of repeatedly solving setup and tooling gaps. This task should leave the project ready for day-to-day development with a clear package layout, shared scripts, and a reproducible local startup flow.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The repository has a committed monorepo structure that clearly separates frontend and backend app code while supporting shared workspace-level configuration.
- [x] #2 Developers can install required dependencies and start the frontend and backend from the monorepo using documented project scripts.
- [x] #3 The baseline toolchain required for MVP development is present and wired into the workspace so later slices can build on it without reworking project setup.
- [x] #4 The README or equivalent project documentation explains the local setup and boot flow well enough for a new engineer to get both apps running.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved implementation plan:
1. Establish a pnpm workspace monorepo rooted at the repository with apps/web, apps/api, and apps/worker so the documented frontend/backend/worker architecture has concrete package boundaries from the start.
2. Configure runtime and shared tooling at the workspace level: latest Node LTS via mise, shared TypeScript base config, common root scripts for dev/build/lint/typecheck, and package manager metadata for reproducible local setup.
3. Scaffold apps/web using current React Router framework-mode conventions on top of Vite, keeping the initial app minimal and SPA-oriented with a bootable root route and app shell.
4. Scaffold apps/api with Fastify and TypeScript, including a minimal health endpoint and API bootstrap ready for later session-auth and board endpoints.
5. Add a minimal apps/worker stub so later orchestration work can build on an existing package boundary without reshaping the monorepo.
6. Update README with prerequisites, mise/pnpm setup, package layout, and the documented local boot flow for starting web and api together.
7. Validate the baseline by running install plus relevant workspace build/typecheck/lint commands and confirming the root dev workflow is wired correctly.

User-approved defaults:
- Package manager: pnpm
- Runtime: latest Node LTS managed with mise
- Frontend: React Router framework mode
- Backend: Fastify
- Monorepo should anticipate later MVP slices without adding database/auth implementation in this task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User approved proceeding with latest Node LTS and mise for version management.

Implemented a pnpm workspace monorepo with `apps/web`, `apps/api`, and `apps/worker`, shared root tooling (`mise.toml`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `biome.json`), and root scripts for dev/build/typecheck/lint.

Scaffolded `apps/web` with React Router framework mode in SPA configuration, `apps/api` with Fastify plus health/bootstrap routes, and a minimal `apps/worker` stub for future orchestration work.

Updated `README.md` with monorepo layout, prerequisites, local setup, startup commands, and common workspace commands for new engineers.

Validated the baseline with `mise install`, `pnpm install`, `mise exec -- pnpm lint`, `mise exec -- pnpm typecheck`, and `mise exec -- pnpm build`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Set up the OVU monorepo foundation so frontend, API, and worker development can proceed in one reproducible workspace instead of re-solving tooling on each slice. The repo now has shared Node/pnpm management via mise, workspace scripts and TypeScript/Biome config, a bootable React Router web app, a Fastify API baseline, a worker stub, and README setup docs verified by install/lint/typecheck/build runs.
<!-- SECTION:FINAL_SUMMARY:END -->
