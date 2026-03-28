---
id: OVU-8
title: Start execution and watch progress
status: To Do
assignee: []
created_date: '2026-03-26 07:49'
updated_date: '2026-03-26 07:50'
labels: []
dependencies:
  - OVU-7
documentation:
  - docs/api-design.md
  - docs/engineering-spec.md
  - docs/architecture.md
  - docs/domain-model.md
priority: high
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Connect ready tasks to the automation flow so the product can begin implementation work and users can see the system progressing through execution stages. This slice should turn the documented orchestration behavior into an observable end-to-end experience rather than leaving execution as backend-only state.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 When no task is active, the system selects the correct `ready_for_implementation` task according to the documented priority and age rules and starts execution.
- [ ] #2 The single active-task constraint across `in_progress` and `review` is enforced by the system.
- [ ] #3 Users can open task detail and see current execution status, current stage, and recent progress or failure information for the active task.
- [ ] #4 Task history reflects execution-stage changes in a user-visible timeline consistent with the documented product behavior.
<!-- AC:END -->
