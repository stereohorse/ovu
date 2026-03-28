---
id: OVU-2.1
title: Implement persistence schema and read models for MVP API
status: To Do
assignee: []
created_date: '2026-03-26 05:21'
labels: []
dependencies: []
documentation:
  - docs/api-design.md
  - docs/engineering-spec.md
  - docs/architecture.md
  - docs/domain-model.md
parent_task_id: OVU-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the PostgreSQL-backed persistence foundations needed to support the documented ovu task workflow, including task-centered write models and the read models needed by the board, task detail, execution status, and timeline APIs. This work should establish the durable data structures that the API, worker, and realtime layers depend on.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The persistence layer supports the documented core entities for tasks, acceptance criteria, comments, mentions, task events, stage attempts, execution logs, repository bindings, cleanup jobs, users, and app config.
- [ ] #2 The schema enforces or clearly supports key invariants including unique task codes, machine-friendly task statuses, task-owned execution history, and the single global repository configuration.
- [ ] #3 Read models or equivalent query shapes exist for board, task detail, execution status, and unified task timeline use cases.
- [ ] #4 The persistence design is documented or represented in code clearly enough for dependent API and worker tasks to build on it safely.
<!-- AC:END -->
