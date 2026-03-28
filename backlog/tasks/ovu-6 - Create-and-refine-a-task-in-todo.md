---
id: OVU-6
title: Create and refine a task in todo
status: To Do
assignee: []
created_date: '2026-03-26 07:48'
updated_date: '2026-03-26 07:50'
labels: []
dependencies:
  - OVU-5
documentation:
  - README.md
  - docs/api-design.md
  - docs/engineering-spec.md
  - docs/domain-model.md
priority: high
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Enable the editable planning experience for tasks in the `todo` state so users can create work, refine it, capture acceptance criteria, and hold discussion before locking it for implementation. This slice should make task authoring feel complete from the product surface rather than only exposing partial backend resources.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A user can create a new task in `todo` and view its detail screen with the persisted title, description, priority, and status.
- [ ] #2 A user can edit task details while the task remains editable and the UI reflects saved changes from the backend.
- [ ] #3 A user can add, edit, reorder, and remove acceptance criteria for a `todo` task.
- [ ] #4 A user can create task comments and replies while the task is editable, and task detail shows the resulting discussion history.
<!-- AC:END -->
