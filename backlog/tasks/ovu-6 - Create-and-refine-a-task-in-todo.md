---
id: OVU-6
title: Create and refine a task in todo
status: Done
assignee:
  - OpenCode
created_date: '2026-03-26 07:48'
updated_date: '2026-03-28 02:52'
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
- [x] #1 A user can create a new task in `todo` and view its detail screen with the persisted title, description, priority, and status.
- [x] #2 A user can edit task details while the task remains editable and the UI reflects saved changes from the backend.
- [x] #3 A user can add, edit, reorder, and remove acceptance criteria for a `todo` task.
- [x] #4 A user can create task comments and replies while the task is editable, and task detail shows the resulting discussion history.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the shared tRPC contract with task detail, acceptance criteria, comments, and typed mutation inputs/outputs for the editable todo workflow.
2. Add a dedicated task router with create/get/update, acceptance criteria CRUD plus reorder, and comment/reply procedures; mount it in the root tRPC router.
3. Expand the MVP in-memory store from board-only summaries into full task records with descriptions, versioning, acceptance criteria, and threaded comments while deriving board summaries from those detail records.
4. Refactor the web board entry point into smaller task-focused UI pieces, add a create-task entry point, and navigate task cards to a dedicated detail route.
5. Build the task detail screen for editable todo tasks, including metadata editing, acceptance criteria management, and threaded comments/replies backed by tRPC mutations and query invalidation.
6. Verify the slice with the repo's relevant checks and document progress/results in the task notes as acceptance criteria are satisfied.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented a new tRPC task vertical slice with shared task detail, acceptance criteria, and threaded comment contracts plus create/get/update/comment procedures wired through the API context and in-memory MVP store.

Expanded the web app from board-only rendering to include task creation on the board, clickable task cards, a dedicated `/tasks/:taskId` detail route, editable task metadata, acceptance criteria management with reorder controls, and threaded comment/reply UI for editable tasks.

Validation completed with `pnpm typecheck`, `pnpm build`, and `pnpm lint`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the editable `todo` task authoring slice end to end. The shared tRPC contract now includes task detail, acceptance criteria, and threaded comments; the API exposes typed task create/get/update plus acceptance-criteria and comment/reply procedures; and the MVP in-memory store now persists full task records instead of only board summaries.

On the web app, the board now includes a create-task form and task cards navigate to a dedicated detail route. The task detail screen supports persisted task metadata edits, acceptance criteria add/edit/reorder/remove flows, and threaded comment/reply discussion while the task remains editable. Validation completed with `pnpm typecheck`, `pnpm build`, and `pnpm lint`.
<!-- SECTION:FINAL_SUMMARY:END -->
