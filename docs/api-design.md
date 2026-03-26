# ovu API Design

## Overview

This document defines the MVP public API contract for `ovu`. It translates the product behavior in `README.md`, the workflow rules in `docs/engineering-spec.md`, the component boundaries in `docs/architecture.md`, and the entity model in `docs/domain-model.md` into a concrete HTTP and realtime interface.

The API is intentionally REST-ish rather than purely resource-generic. Standard reads and edits use resource endpoints, while workflow transitions and retry operations use explicit action endpoints so business rules remain visible in the contract.

## Design Goals

- keep the public API aligned with task-centered product language;
- make workflow permissions explicit through capability flags and action endpoints;
- separate conversational data from operational history;
- support realtime UI synchronization without exposing internal worker control APIs;
- preserve room for implementation changes behind a stable MVP contract.

## Scope

This document covers:

- authenticated user API access;
- board and task read models;
- task creation and editing;
- workflow action endpoints;
- acceptance criteria and comment APIs;
- execution status, retry, and timeline APIs;
- Socket.IO-based realtime subscriptions and events;
- shared request, response, pagination, and error conventions.

This document does not expose internal backend-to-worker coordination, agent runner internals, or Git-manager-only operations as public API surfaces.

## API Conventions

### Base Path

- public HTTP API base path: `/api`;
- JSON request and response bodies use `application/json`;
- all timestamps use ISO 8601 UTC strings;
- all primary public IDs use UUIDs;
- task codes remain human-readable values in `T-<N>` format.

### Authentication Model

- the MVP uses session-based authentication backed by email and password;
- `POST /api/auth/login` creates the authenticated session;
- `POST /api/auth/logout` clears the session;
- authenticated reads and writes rely on the session rather than bearer tokens.

### Status and Enum Conventions

- API responses should expose stable machine values for enums;
- task status values are `todo`, `ready_for_implementation`, `in_progress`, `review`, and `done`;
- task priority values are `high`, `medium`, and `low`;
- stage values are `coding`, `review`, `push`, and `merge`.

The UI may render user-friendly labels such as `ready for implementation`, but the wire contract should stay machine-oriented.

### Optimistic Concurrency

Mutable task-scoped write operations should support optimistic concurrency.

Recommended contract:

- mutable resources include `updatedAt` and `version` fields;
- `PATCH` and action requests may send `expectedVersion`;
- if the expected version does not match current state, the API returns `409 Conflict` with code `VERSION_MISMATCH`.

### Pagination

Cursor pagination should be used for collections that can grow without bound.

Required for MVP:

- task comments;
- task timeline.

Recommended response shape:

```json
{
  "items": [],
  "pageInfo": {
    "nextCursor": "opaque-cursor",
    "hasMore": true
  }
}
```

### Error Envelope

All non-2xx responses should use a consistent error body.

```json
{
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Task cannot move to review from its current state.",
    "details": {
      "taskId": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
      "currentStatus": "todo"
    }
  }
}
```

Core MVP error codes:

- `UNAUTHORIZED`;
- `FORBIDDEN`;
- `VALIDATION_ERROR`;
- `VERSION_MISMATCH`;
- `TASK_NOT_FOUND`;
- `TASK_NOT_EDITABLE`;
- `COMMENTS_LOCKED`;
- `INVALID_TRANSITION`;
- `READINESS_CHECK_FAILED`;
- `NO_FAILED_STAGE`;
- `RETRY_NOT_ALLOWED`;
- `CONFLICT_ACTIVE_TASK_EXISTS`.

## Shared Resource Shapes

### `UserSummary`

```json
{
  "id": "d7741f98-50c6-4b86-aeb4-80ca0372831c",
  "email": "user@example.com",
  "displayName": "Alex Doe"
}
```

### `TaskSummary`

Returned in board and task list responses.

```json
{
  "id": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
  "code": "T-12",
  "title": "Add approval notes to review screen",
  "status": "ready_for_implementation",
  "priority": "high",
  "createdAt": "2026-03-26T03:00:00Z",
  "updatedAt": "2026-03-26T03:15:00Z",
  "lastError": null,
  "currentStage": null,
  "capabilities": {
    "canEdit": false,
    "canComment": false,
    "canMoveToReady": false,
    "canMoveToTodo": true,
    "canMoveToDone": false,
    "canRetryCurrentStage": false
  }
}
```

### `TaskDetail`

Returned by `GET /api/tasks/:taskId`.

```json
{
  "id": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
  "code": "T-12",
  "title": "Add approval notes to review screen",
  "description": "Allow users to record approval context before marking a task done.",
  "status": "review",
  "priority": "high",
  "createdAt": "2026-03-26T03:00:00Z",
  "updatedAt": "2026-03-26T03:20:00Z",
  "version": 7,
  "createdBy": {
    "id": "d7741f98-50c6-4b86-aeb4-80ca0372831c",
    "email": "user@example.com",
    "displayName": "Alex Doe"
  },
  "execution": {
    "currentStage": null,
    "currentStageStatus": null,
    "attemptCount": 0,
    "lastError": null,
    "lastUpdatedAt": "2026-03-26T03:20:00Z"
  },
  "capabilities": {
    "canEdit": false,
    "canComment": true,
    "canMoveToReady": false,
    "canMoveToTodo": false,
    "canMoveToDone": true,
    "canRetryCurrentStage": false
  }
}
```

Notes:

- acceptance criteria, comments, and timeline are fetched through dedicated endpoints rather than embedded by default;
- capability flags are server-derived and represent current allowed actions for the authenticated user;
- `execution` summarizes current operational state without replacing the full timeline.

### `AcceptanceCriterion`

```json
{
  "id": "5d5a2e59-00ce-48d4-b7c9-f4df02f6d167",
  "taskId": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
  "text": "Users can mark a reviewed task as done after reading the latest execution outcome.",
  "source": "user",
  "position": 1,
  "createdAt": "2026-03-26T03:05:00Z",
  "updatedAt": "2026-03-26T03:05:00Z"
}
```

### `Comment`

Comments are returned as a flat list with `parentCommentId` rather than a nested tree.

```json
{
  "id": "80b430d8-df89-4a9f-b190-78365d9ff7ba",
  "taskId": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
  "authorType": "user",
  "author": {
    "id": "d7741f98-50c6-4b86-aeb4-80ca0372831c",
    "displayName": "Alex Doe"
  },
  "parentCommentId": null,
  "body": "Please keep the review step visible in the final UI.",
  "createdAt": "2026-03-26T03:06:00Z",
  "updatedAt": "2026-03-26T03:06:00Z",
  "mentions": [
    {
      "type": "system",
      "token": "@system"
    }
  ]
}
```

### `TimelineEntry`

The timeline is a unified operational activity stream backed by task events, stage attempts, cleanup milestones, and repository milestones.

```json
{
  "id": "74d7f11f-f35b-4b82-a4a8-6684d11b7a53",
  "taskId": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
  "type": "stage_attempt_failed",
  "occurredAt": "2026-03-26T03:18:00Z",
  "actorType": "system",
  "summary": "Review stage attempt 2 failed.",
  "stage": "review",
  "attemptNumber": 2,
  "status": "failed",
  "triggerType": "automatic",
  "errorSummary": "Lint command exited with status 1",
  "metadata": {
    "retryScheduledFor": "2026-03-26T03:20:00Z"
  }
}
```

## HTTP API

### Authentication

#### `POST /api/auth/login`

Authenticates a user and creates a session.

Request:

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

Response `200 OK`:

```json
{
  "user": {
    "id": "d7741f98-50c6-4b86-aeb4-80ca0372831c",
    "email": "user@example.com",
    "displayName": "Alex Doe"
  }
}
```

Errors:

- `UNAUTHORIZED` for invalid credentials;
- `VALIDATION_ERROR` for malformed input.

#### `POST /api/auth/logout`

Clears the authenticated session.

Response `204 No Content`.

#### `GET /api/me`

Returns the current authenticated user and app-level capabilities needed at boot.

Response `200 OK`:

```json
{
  "user": {
    "id": "d7741f98-50c6-4b86-aeb4-80ca0372831c",
    "email": "user@example.com",
    "displayName": "Alex Doe"
  }
}
```

### Board

#### `GET /api/board`

Returns the kanban board grouped by status. This is the main board read model used by the realtime UI.

Response `200 OK`:

```json
{
  "columns": [
    {
      "status": "todo",
      "label": "Todo",
      "tasks": []
    },
    {
      "status": "ready_for_implementation",
      "label": "Ready for implementation",
      "tasks": []
    },
    {
      "status": "in_progress",
      "label": "In progress",
      "tasks": []
    },
    {
      "status": "review",
      "label": "Review",
      "tasks": []
    },
    {
      "status": "done",
      "label": "Done",
      "tasks": []
    }
  ],
  "activeTaskId": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39"
}
```

### Tasks

#### `GET /api/tasks`

Returns a paged task list for non-board views.

Supported query params:

- `status`;
- `priority`;
- `cursor`;
- `limit`.

Response `200 OK`:

```json
{
  "items": [
    {
      "id": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
      "code": "T-12",
      "title": "Add approval notes to review screen",
      "status": "review",
      "priority": "high",
      "createdAt": "2026-03-26T03:00:00Z",
      "updatedAt": "2026-03-26T03:20:00Z",
      "lastError": null,
      "currentStage": null,
      "capabilities": {
        "canEdit": false,
        "canComment": true,
        "canMoveToReady": false,
        "canMoveToTodo": false,
        "canMoveToDone": true,
        "canRetryCurrentStage": false
      }
    }
  ],
  "pageInfo": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

#### `POST /api/tasks`

Creates a new task in `todo`.

Request:

```json
{
  "title": "Add approval notes to review screen",
  "description": "Allow users to record approval context before marking a task done.",
  "priority": "high"
}
```

Response `201 Created` returns `TaskDetail`.

#### `GET /api/tasks/:taskId`

Returns `TaskDetail` for one task.

Errors:

- `TASK_NOT_FOUND`.

#### `PATCH /api/tasks/:taskId`

Updates editable task fields while the task is editable.

Allowed mutable fields:

- `title`;
- `description`;
- `priority`.

Request:

```json
{
  "title": "Add approval notes to review screen",
  "description": "Allow users to record approval context before marking a task done.",
  "priority": "medium",
  "expectedVersion": 7
}
```

Response `200 OK` returns updated `TaskDetail`.

Errors:

- `TASK_NOT_FOUND`;
- `TASK_NOT_EDITABLE` when the task is locked by workflow state;
- `VERSION_MISMATCH`.

### Workflow Actions

Workflow transitions use explicit command endpoints instead of generic status patching.

#### `POST /api/tasks/:taskId/actions/move-to-ready`

Valid only from `todo`.

Request:

```json
{
  "expectedVersion": 7
}
```

Response `200 OK`:

```json
{
  "task": {
    "id": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
    "status": "ready_for_implementation",
    "version": 8
  }
}
```

Errors:

- `TASK_NOT_FOUND`;
- `INVALID_TRANSITION`;
- `READINESS_CHECK_FAILED` with structured details about what remains unclear;
- `VERSION_MISMATCH`.

#### `POST /api/tasks/:taskId/actions/move-to-todo`

Valid only from `ready_for_implementation` and user-triggered only.

Request:

```json
{
  "expectedVersion": 8
}
```

Response `200 OK` returns updated task summary or detail.

Errors:

- `TASK_NOT_FOUND`;
- `INVALID_TRANSITION`;
- `FORBIDDEN` when caller lacks permission.

#### `POST /api/tasks/:taskId/actions/move-to-done`

Valid only from `review`.

Request:

```json
{
  "expectedVersion": 11
}
```

Response `200 OK` returns updated task with `status: "done"`.

Errors:

- `TASK_NOT_FOUND`;
- `INVALID_TRANSITION`;
- `VERSION_MISMATCH`.

Notes:

- transition from `ready_for_implementation` to `in_progress` is system-driven and has no public write endpoint;
- transition from `in_progress` to `review` is system-driven and has no public write endpoint.

### Acceptance Criteria

Acceptance criteria are modeled as nested task resources.

#### `GET /api/tasks/:taskId/acceptance-criteria`

Response `200 OK`:

```json
{
  "items": [
    {
      "id": "5d5a2e59-00ce-48d4-b7c9-f4df02f6d167",
      "taskId": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
      "text": "Users can mark a reviewed task as done after reading the latest execution outcome.",
      "source": "user",
      "position": 1,
      "createdAt": "2026-03-26T03:05:00Z",
      "updatedAt": "2026-03-26T03:05:00Z"
    }
  ]
}
```

#### `POST /api/tasks/:taskId/acceptance-criteria`

Creates one criterion while the task is editable.

Request:

```json
{
  "text": "Users can mark a reviewed task as done after reading the latest execution outcome."
}
```

Response `201 Created` returns the new `AcceptanceCriterion`.

Errors:

- `TASK_NOT_FOUND`;
- `TASK_NOT_EDITABLE`.

#### `PATCH /api/tasks/:taskId/acceptance-criteria/:criterionId`

Updates one criterion while the task is editable.

Request:

```json
{
  "text": "Users can add approval notes before marking a task done.",
  "position": 2
}
```

Response `200 OK` returns the updated `AcceptanceCriterion`.

Errors:

- `TASK_NOT_FOUND`;
- `VALIDATION_ERROR`;
- `TASK_NOT_EDITABLE`.

#### `DELETE /api/tasks/:taskId/acceptance-criteria/:criterionId`

Deletes one criterion while the task is editable.

Response `204 No Content`.

Notes:

- a future bulk replace or reorder endpoint can be added later if UI needs justify it;
- acceptance-criteria changes should generate task timeline audit events even though they are managed through dedicated endpoints.

### Comments

Comments remain a separate conversational surface from the execution timeline.

#### `GET /api/tasks/:taskId/comments`

Supported query params:

- `cursor`;
- `limit`.

Response `200 OK`:

```json
{
  "items": [
    {
      "id": "80b430d8-df89-4a9f-b190-78365d9ff7ba",
      "taskId": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
      "authorType": "user",
      "author": {
        "id": "d7741f98-50c6-4b86-aeb4-80ca0372831c",
        "displayName": "Alex Doe"
      },
      "parentCommentId": null,
      "body": "Please keep the review step visible in the final UI.",
      "createdAt": "2026-03-26T03:06:00Z",
      "updatedAt": "2026-03-26T03:06:00Z",
      "mentions": []
    }
  ],
  "pageInfo": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

#### `POST /api/tasks/:taskId/comments`

Creates a root comment while comments are enabled for the task.

Request:

```json
{
  "body": "Please keep the review step visible in the final UI."
}
```

Response `201 Created` returns `Comment`.

Errors:

- `TASK_NOT_FOUND`;
- `COMMENTS_LOCKED`.

#### `POST /api/tasks/:taskId/comments/:commentId/replies`

Creates a reply comment while comments are enabled.

Request:

```json
{
  "body": "Noted. I will keep that visible."
}
```

Response `201 Created` returns `Comment` with `parentCommentId` set.

Errors:

- `TASK_NOT_FOUND`;
- `COMMENTS_LOCKED`;
- `VALIDATION_ERROR` if the parent comment is not part of the task.

### Timeline and Execution

#### `GET /api/tasks/:taskId/timeline`

Returns the unified operational activity stream for the task. This endpoint intentionally excludes conversational comments.

Supported query params:

- `cursor`;
- `limit`;
- optional `types[]` filter.

Response `200 OK`:

```json
{
  "items": [
    {
      "id": "74d7f11f-f35b-4b82-a4a8-6684d11b7a53",
      "taskId": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
      "type": "stage_attempt_failed",
      "occurredAt": "2026-03-26T03:18:00Z",
      "actorType": "system",
      "summary": "Review stage attempt 2 failed.",
      "stage": "review",
      "attemptNumber": 2,
      "status": "failed",
      "triggerType": "automatic",
      "errorSummary": "Lint command exited with status 1",
      "metadata": {
        "retryScheduledFor": "2026-03-26T03:20:00Z"
      }
    }
  ],
  "pageInfo": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

Recommended entry categories include:

- task status transitions;
- readiness decisions;
- stage attempt started, succeeded, and failed events;
- retry scheduled and retry triggered events;
- repository milestones such as branch created, pushed, merged, and cleanup scheduled or completed.

#### `GET /api/tasks/:taskId/execution-status`

Returns the current execution state optimized for task-detail UI refresh.

Response `200 OK`:

```json
{
  "taskId": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
  "status": "in_progress",
  "activeStage": "review",
  "activeStageStatus": "failed",
  "attemptCount": 2,
  "maxAttempts": 3,
  "lastError": {
    "stage": "review",
    "message": "Lint command exited with status 1",
    "failedAt": "2026-03-26T03:18:00Z"
  },
  "nextRetryAt": "2026-03-26T03:20:00Z",
  "canRetryCurrentStage": true,
  "updatedAt": "2026-03-26T03:18:00Z"
}
```

This endpoint should reflect only the currently relevant execution state, not the full history.

#### `POST /api/tasks/:taskId/actions/retry-current-stage`

Triggers a manual retry for the current failed stage only.

Request:

```json
{
  "expectedVersion": 12
}
```

Response `202 Accepted`:

```json
{
  "taskId": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
  "retriedStage": "review",
  "status": "queued"
}
```

Errors:

- `TASK_NOT_FOUND`;
- `NO_FAILED_STAGE`;
- `RETRY_NOT_ALLOWED`;
- `VERSION_MISMATCH`.

### Configuration and App Bootstrap

#### `GET /api/config`

Returns public app configuration needed by the UI.

Response `200 OK`:

```json
{
  "mainBranchName": "main",
  "realtime": {
    "provider": "socket.io"
  },
  "taskStatuses": [
    "todo",
    "ready_for_implementation",
    "in_progress",
    "review",
    "done"
  ],
  "taskPriorities": [
    "high",
    "medium",
    "low"
  ]
}
```

Notes:

- the repository path is intentionally excluded from public API responses because it is infrastructure configuration;
- the endpoint exists to help frontend bootstrapping and avoid hard-coding enum catalogs in multiple places.

## Realtime API

Realtime delivery should use Socket.IO as the primary transport with fallback support, matching the architecture document.

### Connection Model

- clients authenticate before subscribing to task or board rooms;
- the realtime connection supplements HTTP reads rather than replacing them;
- clients should use HTTP for initial state and Socket.IO for incremental updates.

### Rooms

- `board` for kanban-wide updates;
- `task:{taskId}` for task detail, comments, execution state, and timeline updates.

### Event Types

Recommended event names:

- `task.created`;
- `task.updated`;
- `task.moved`;
- `task.acceptance_criteria.updated`;
- `task.comment.created`;
- `task.execution.updated`;
- `task.retry.updated`;
- `task.timeline.updated`.

### Event Payload Guidance

Realtime payloads should be small and bias toward refetch-friendly deltas.

Example:

```json
{
  "event": "task.moved",
  "taskId": "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
  "status": "review",
  "updatedAt": "2026-03-26T03:20:00Z"
}
```

Guidelines:

- board-level events should include enough summary data to update columns without a full reload when practical;
- task-level events may include either updated fragments or signals that the client should refetch `GET /api/tasks/:taskId`, `GET /api/tasks/:taskId/comments`, `GET /api/tasks/:taskId/timeline`, or `GET /api/tasks/:taskId/execution-status`;
- timeline and execution events should remain separate from comments even when triggered by the same underlying stage outcome.

## Authorization and Business Rule Notes

- all public endpoints except login require authentication;
- only editable tasks may be updated through `PATCH /api/tasks/:taskId` or acceptance-criteria writes;
- comments are locked in `ready_for_implementation` and must return `COMMENTS_LOCKED` on create attempts;
- only the user-facing workflow endpoints may trigger user-controlled transitions;
- no public endpoint should directly set a task to `in_progress` or `review` because those transitions are owned by the orchestrator;
- the single active execution lane remains an internal scheduling rule, but APIs should surface its effects through board state, execution status, and `CONFLICT_ACTIVE_TASK_EXISTS` when relevant.

## Consistency With Existing Docs

This API design intentionally aligns with the current documentation set:

- `README.md` supplies the user-facing workflow of task creation, refinement, readying, review, and done approval;
- `docs/engineering-spec.md` supplies the task states, edit locks, comment locks, retry policy, user-triggered transitions, and execution timeline requirement;
- `docs/architecture.md` supplies the backend API boundary, separate orchestrator worker, Socket.IO-first realtime model, and separation between public API and internal automation;
- `docs/domain-model.md` supplies the underlying entities for tasks, comments, acceptance criteria, task events, stage attempts, execution logs, repository milestones, and capability-relevant invariants.

If implementation details evolve, this document should remain the source of truth for the public API contract unless and until a versioned OpenAPI spec replaces it.
