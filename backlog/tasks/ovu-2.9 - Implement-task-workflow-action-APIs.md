---
id: OVU-2.9
title: Implement task workflow action APIs
status: To Do
assignee: []
created_date: '2026-03-26 05:22'
updated_date: '2026-03-26 05:22'
labels: []
dependencies:
  - OVU-2.1
  - OVU-2.5
documentation:
  - docs/api-design.md
  - docs/engineering-spec.md
  - docs/domain-model.md
parent_task_id: OVU-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the explicit workflow command endpoints that let users move tasks through the allowed user-controlled parts of the lifecycle while keeping readiness checks, edit locks, and system-owned transitions consistent with the documented business rules.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `POST /api/tasks/:taskId/actions/move-to-ready`, `POST /api/tasks/:taskId/actions/move-to-todo`, and `POST /api/tasks/:taskId/actions/move-to-done` enforce the documented allowed transitions.
- [ ] #2 Moving a task to ready runs the documented readiness validation and returns `READINESS_CHECK_FAILED` with structured feedback when the task is not ready.
- [ ] #3 System-owned transitions into `in_progress` and `review` are not exposed as public write endpoints.
- [ ] #4 Invalid transitions, permission failures, and optimistic concurrency conflicts return the documented structured error codes and envelopes.
<!-- AC:END -->
