---
id: OVU-2.4
title: Implement acceptance criteria APIs and audit events
status: To Do
assignee: []
created_date: '2026-03-26 05:21'
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
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the nested acceptance-criteria endpoints so users can manage task expectations while tasks are editable, and ensure those changes are reflected in the task audit and timeline model described in the API and domain docs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The acceptance-criteria endpoints support listing, creating, updating, and deleting task-scoped criteria in the documented nested resource shape.
- [ ] #2 Acceptance criteria can only be changed while the task is editable, and locked tasks return the documented `TASK_NOT_EDITABLE` behavior.
- [ ] #3 Criterion ordering is preserved through the documented position model.
- [ ] #4 Acceptance-criteria changes emit structured audit or timeline records consistent with the `TaskEvent`-based history model.
<!-- AC:END -->
