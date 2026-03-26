---
id: OVU-1
title: Create API design documentation for ovu
status: Done
assignee:
  - OpenCode
created_date: '2026-03-26 03:55'
updated_date: '2026-03-26 03:58'
labels: []
dependencies: []
documentation:
  - README.md
  - docs/engineering-spec.md
  - docs/architecture.md
  - docs/domain-model.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Document the public API for the ovu product so implementation can proceed with a consistent contract across authentication, task workflow actions, comments, acceptance criteria, timeline, board, configuration, and realtime updates. The design must align with the finalized README, engineering spec, architecture, and domain model decisions, including explicit workflow command endpoints, unified task timeline, single active execution lane constraints, and Socket.IO-based realtime delivery.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A new API design document defines the public HTTP API surface for authentication, board, tasks, workflow actions, acceptance criteria, comments, execution status, retry, and timeline access.
- [x] #2 The document specifies request and response shapes for core resources and includes task capability flags and execution summary fields consistent with the product and domain rules.
- [x] #3 The document defines error response structure and enumerates key API error codes for invalid transitions, edit locks, comment locks, retry failures, authorization failures, and active-task conflicts.
- [x] #4 The document defines realtime transport expectations, subscription model, and event types consistent with the documented Socket.IO-first architecture.
- [x] #5 The document is cross-checked against the existing README, engineering spec, architecture, and domain model so terminology and behavior remain consistent.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Review the existing product, engineering, architecture, and domain docs to keep API terminology and workflow rules aligned.
2. Create `docs/api-design.md` as a public-contract document for the MVP API using a REST-ish JSON design with explicit action endpoints for workflow transitions and retries.
3. Document shared API conventions first: auth model, IDs, timestamps, pagination, optimistic concurrency, error envelope, and resource naming.
4. Define the main HTTP surface for auth, board, tasks, workflow actions, acceptance criteria, comments, timeline, execution status, retry, and config/me endpoints, including representative request and response payloads.
5. Define realtime delivery separately with Socket.IO room structure, event names, event payload expectations, and the relationship between HTTP reads and pushed updates.
6. Cross-check the new API design doc against `README.md`, `docs/engineering-spec.md`, `docs/architecture.md`, and `docs/domain-model.md`, then update the backlog notes and acceptance criteria as each requirement is satisfied.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reviewed `README.md`, `docs/engineering-spec.md`, `docs/architecture.md`, and `docs/domain-model.md` to align endpoint naming, workflow transitions, retry behavior, and timeline semantics before drafting the API contract.

Created `docs/api-design.md` as the MVP public API contract covering shared conventions, resource shapes, HTTP endpoints, workflow action commands, timeline/execution reads, structured errors, and Socket.IO rooms/events.

Added a README link to `docs/api-design.md` so the API contract is discoverable alongside the other product and engineering reference docs.

Docs-only change; no automated tests were run.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `docs/api-design.md` as the new MVP API contract for ovu, translating the existing product, engineering, architecture, and domain decisions into a REST-ish JSON HTTP surface plus a Socket.IO realtime model. The document defines shared conventions, task capability flags, workflow action endpoints, acceptance-criteria and comment resources, timeline and execution-status reads, retry behavior, and a structured error model so implementation can proceed against a consistent public interface.

Also updated `README.md` to link to the new API design document with the rest of the core reference set. This was a documentation-only change, so no automated tests were run.
<!-- SECTION:FINAL_SUMMARY:END -->
