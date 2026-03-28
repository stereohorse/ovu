---
id: OVU-2.3
title: Implement comments and threaded replies APIs
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
Implement the task comment endpoints so users and the system can participate in threaded task discussions while preserving the flat response shape, parent linkage, mention handling, and status-based comment locks described in the specs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Comment reads return a flat paginated list with `parentCommentId` rather than a nested tree.
- [ ] #2 The API supports creating root comments and replies, and reply creation validates that the parent comment belongs to the same task.
- [ ] #3 Comment creation is blocked in `ready_for_implementation` and returns the documented `COMMENTS_LOCKED` behavior.
- [ ] #4 Comment records preserve author, mention, and threading data consistent with the domain model.
<!-- AC:END -->
