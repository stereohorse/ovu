---
id: OVU-5
title: Sign in and load the board
status: To Do
assignee: []
created_date: '2026-03-26 07:48'
updated_date: '2026-03-26 07:50'
labels: []
dependencies:
  - OVU-4
documentation:
  - README.md
  - docs/api-design.md
  - docs/engineering-spec.md
  - docs/architecture.md
  - docs/domain-model.md
priority: high
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Deliver the first runnable end-to-end user flow for ovu so an authenticated user can enter the app and see the board populated from live backend data. This slice should establish the minimum backend and frontend surfaces needed to move from local startup into a visible product experience.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An unauthenticated user can sign in through the MVP session flow and the app establishes authenticated state for subsequent requests.
- [ ] #2 The frontend loads its bootstrap data and renders the initial application shell after sign-in.
- [ ] #3 The board view reads task data from the backend and shows tasks grouped by their current workflow status.
- [ ] #4 Protected endpoints reject unauthenticated access with the documented structured API error behavior.
<!-- AC:END -->
