---
id: OVU-2.10
title: Add contract and integration tests for MVP API
status: To Do
assignee: []
created_date: '2026-03-26 05:22'
updated_date: '2026-03-26 07:47'
labels: []
dependencies:
  - OVU-2.8
  - OVU-2.5
  - OVU-2.9
  - OVU-2.3
  - OVU-2.2
  - OVU-2.6
  - OVU-2.7
documentation:
  - docs/api-design.md
  - docs/engineering-spec.md
  - docs/domain-model.md
parent_task_id: OVU-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add automated coverage for the documented MVP API behavior so workflow transitions, lock rules, structured errors, and key realtime hooks remain reliable as implementation progresses. This task ensures the API contract is enforced by tests rather than only by documentation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Core HTTP endpoints have automated coverage for successful and failing behaviors described in `docs/api-design.md`.
- [ ] #2 Tests verify workflow transition rules, task edit locks, comment locks, optimistic concurrency, and retry constraints.
- [ ] #3 Structured error envelopes and key error codes are asserted in automated tests.
- [ ] #4 Key realtime emissions or integration points are covered well enough to catch regressions in board and task-detail synchronization.
<!-- AC:END -->
