---
id: OVU-2.8
title: Implement auth and app bootstrap APIs
status: To Do
assignee: []
created_date: '2026-03-26 05:21'
updated_date: '2026-03-26 05:22'
labels: []
dependencies:
  - OVU-2.1
documentation:
  - docs/api-design.md
  - docs/engineering-spec.md
  - docs/architecture.md
parent_task_id: OVU-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the MVP authentication and bootstrap endpoints so the frontend can establish a session, identify the current user, and load public configuration needed to drive the documented task workflow UI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/me` work for the MVP basic-user session model described in the docs.
- [ ] #2 Unauthenticated access to protected endpoints returns the documented structured `UNAUTHORIZED` error response.
- [ ] #3 `GET /api/config` exposes the public bootstrap data needed by the frontend, including workflow enums and realtime provider metadata, without leaking infrastructure-only configuration such as repository paths.
- [ ] #4 Responses follow the shared API conventions for naming, JSON structure, and error handling described in `docs/api-design.md`.
<!-- AC:END -->
