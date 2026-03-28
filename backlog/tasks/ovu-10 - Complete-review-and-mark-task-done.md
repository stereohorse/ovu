---
id: OVU-10
title: Complete review and mark task done
status: To Do
assignee: []
created_date: '2026-03-26 07:49'
updated_date: '2026-03-26 07:50'
labels: []
dependencies:
  - OVU-9
  - OVU-3
documentation:
  - README.md
  - docs/api-design.md
  - docs/engineering-spec.md
  - docs/domain-model.md
priority: high
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finish the MVP task lifecycle so users can review completed automated work, accept it, and see the task settle into its final product state. This slice should close the loop from planning to completion and validate that the overall workflow works coherently across the main user surfaces.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A task that has completed automated work can be presented in `review` with enough execution context for the user to assess the result.
- [ ] #2 A user can move a reviewed task to `done` through the documented workflow action and the backend enforces valid transitions.
- [ ] #3 After completion, the board view, task detail, and task history all show a consistent final state for the task.
- [ ] #4 Automated integration or contract coverage exists for the main happy-path workflow from sign-in through task completion.
<!-- AC:END -->
