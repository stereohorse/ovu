---
id: OVU-9
title: Review failures and retry the current stage
status: To Do
assignee: []
created_date: '2026-03-26 07:49'
updated_date: '2026-03-26 07:50'
labels: []
dependencies:
  - OVU-8
documentation:
  - docs/api-design.md
  - docs/engineering-spec.md
  - docs/domain-model.md
priority: high
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make automation failures actionable from the product so users can understand what went wrong and safely retry the current failed stage without corrupting workflow state. This slice should turn retry handling from an internal implementation concern into a usable recovery experience.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 When an execution stage fails, task detail shows the current failed stage and the latest failure information in a user-understandable form.
- [ ] #2 A user can manually retry the current failed stage through the documented workflow action when retry is allowed.
- [ ] #3 Retry history and stage-attempt information remain visible so users can understand what has already been attempted.
- [ ] #4 Retry behavior preserves consistent task and execution state when no failed stage exists, retries are exhausted, or a retry is not allowed.
<!-- AC:END -->
