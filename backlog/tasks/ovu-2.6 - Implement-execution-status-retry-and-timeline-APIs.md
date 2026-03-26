---
id: OVU-2.6
title: 'Implement execution status, retry, and timeline APIs'
status: To Do
assignee: []
created_date: '2026-03-26 05:21'
updated_date: '2026-03-26 05:22'
labels: []
dependencies:
  - OVU-2.1
  - OVU-2.2
  - OVU-2.9
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
Implement the task execution endpoints that expose current automation state, allow manual retry of the current failed stage, and provide the unified operational timeline separate from conversational comments. This work connects persisted workflow history to the user-facing API contract.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `GET /api/tasks/:taskId/timeline` returns a unified operational activity stream that excludes conversational comments and includes the documented execution and repository milestone categories.
- [ ] #2 `GET /api/tasks/:taskId/execution-status` returns the current stage state, attempt counts, retry timing, and last-error information in the documented shape.
- [ ] #3 `POST /api/tasks/:taskId/actions/retry-current-stage` allows manual retry only for the current failed stage and returns the documented retry error cases when no retry is allowed.
- [ ] #4 Timeline and execution-status responses remain consistent with the persisted worker and task-event model rather than ad hoc computed state.
<!-- AC:END -->
