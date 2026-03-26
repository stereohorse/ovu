---
id: OVU-2.2
title: Implement orchestrator and workflow domain services
status: To Do
assignee: []
created_date: '2026-03-26 05:21'
updated_date: '2026-03-26 05:22'
labels: []
dependencies:
  - OVU-2.1
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
Implement the backend workflow services and separate worker behavior that own task selection, system-driven transitions, stage-local retry scheduling, and synchronization of execution state with persisted task history. This work turns the documented execution rules into running orchestration logic.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The system selects the oldest task among the highest-priority tasks in `ready_for_implementation` when no task is active.
- [ ] #2 The implementation enforces the single active execution lane across `in_progress` and `review`.
- [ ] #3 System-driven workflow changes, stage attempts, retry scheduling, and failure outcomes are persisted in a way that supports the documented execution-status and timeline APIs.
- [ ] #4 Stage-local retries follow the documented MVP policy and keep failed tasks in their current state after retries are exhausted.
<!-- AC:END -->
