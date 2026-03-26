---
id: OVU-2.5
title: Implement task and board read-write APIs
status: To Do
assignee: []
created_date: '2026-03-26 05:21'
updated_date: '2026-03-26 05:22'
labels: []
dependencies:
  - OVU-2.1
  - OVU-2.8
documentation:
  - docs/api-design.md
  - docs/engineering-spec.md
  - docs/domain-model.md
parent_task_id: OVU-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the core HTTP endpoints that let the frontend create tasks, read board state, list tasks, fetch task details, and edit mutable task fields while the task remains editable. This work should establish the main task-facing API surface used throughout the MVP.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `GET /api/board`, `GET /api/tasks`, `POST /api/tasks`, `GET /api/tasks/:taskId`, and `PATCH /api/tasks/:taskId` behave according to the documented API contract.
- [ ] #2 New tasks are created in `todo` with task codes and persisted fields consistent with the domain and engineering specs.
- [ ] #3 Task summary and detail responses include server-derived capability flags and execution summary fields in the documented shapes.
- [ ] #4 Mutable task writes enforce optimistic concurrency and return the documented conflict behavior when version expectations do not match.
<!-- AC:END -->
