# ovu Domain Model

## Overview

This document defines the core domain concepts for the `ovu` MVP. It translates the product behavior in `README.md`, the rules in `docs/engineering-spec.md`, and the component boundaries in `docs/architecture.md` into a concrete model of entities, relationships, ownership, and invariants.

The domain model is intended to guide database design, API shape, orchestration behavior, and state validation without dropping into migration-level or handler-level implementation detail.

## Modeling Goals

- represent the product in terms of task-centered business concepts;
- make task lifecycle rules explicit and enforceable;
- distinguish user-authored data from system-generated operational history;
- support persistent auditability for comments, decisions, retries, and execution logs;
- keep aggregate boundaries clear enough to support a PostgreSQL-backed implementation.

## Core Entities

### `User`

Represents an authenticated basic user of the system.

Suggested fields:

- `id`
- `email`
- `passwordHash`
- `displayName`
- `createdAt`
- `updatedAt`

Responsibilities:

- creates tasks;
- edits task descriptions and acceptance criteria while allowed;
- authors comments;
- performs user-controlled task transitions such as moving work to `ready for implementation` or `done`;
- triggers manual retry for the current failed stage.

### `Task`

`Task` is the primary domain aggregate. It represents a unit of requested implementation work.

Suggested fields:

- `id`
- `code` in the format `T-<N>`
- `title`
- `description`
- `status`
- `priority`
- `createdByUserId`
- `createdAt`
- `updatedAt`
- `readyEvaluatedAt`
- `reviewedAt`
- `doneAt`

Responsibilities:

- acts as the root for most user-visible and operational records;
- owns the lifecycle from `todo` through `done`;
- defines editability and commenting rules based on status;
- anchors acceptance criteria, comments, execution history, and repository mapping.

### `AcceptanceCriterion`

Represents one acceptance condition for a task.

Suggested fields:

- `id`
- `taskId`
- `text`
- `source` such as `user` or `system`
- `position`
- `createdAt`
- `updatedAt`

Responsibilities:

- captures implementation expectations for a task;
- can be suggested by the system and edited by users;
- informs coding completion and automated review behavior.

### `Comment`

Represents one threaded discussion message attached to a task.

Suggested fields:

- `id`
- `taskId`
- `authorType` such as `user`, `system`, or `agent`
- `authorUserId` nullable for non-user authors
- `parentCommentId` nullable for root comments
- `body`
- `createdAt`
- `updatedAt`

Responsibilities:

- supports task discussion and clarification;
- supports threaded conversations;
- stores both human and system-authored messages;
- participates in the task audit record.

### `Mention`

Represents an extracted mention from a comment.

Suggested fields:

- `id`
- `commentId`
- `mentionedType` such as `user` or `system`
- `mentionedUserId` nullable when the mention targets the system
- `token`
- `createdAt`

Responsibilities:

- records structured mention targets;
- enables system responses when the system is mentioned;
- avoids parsing mentions repeatedly at read time.

### `TaskEvent`

Represents an append-only audit event for a task.

Suggested fields:

- `id`
- `taskId`
- `type`
- `actorType`
- `actorUserId` nullable
- `summary`
- `payload` structured JSON
- `createdAt`

Responsibilities:

- captures state transitions;
- records readiness decisions and system feedback;
- captures repository milestones, retries, failures, merges, and cleanup actions;
- provides a durable timeline independent of comments.

### `StageAttempt`

Represents one execution attempt for an automated stage.

Suggested fields:

- `id`
- `taskId`
- `stage` such as `coding`, `review`, `push`, or `merge`
- `attemptNumber`
- `status` such as `running`, `succeeded`, or `failed`
- `triggerType` such as `automatic` or `manual`
- `startedAt`
- `finishedAt`
- `errorSummary` nullable

Responsibilities:

- tracks stage-local retries;
- records whether an attempt was automatic or user-triggered;
- provides the basis for last error display and retry logic.

### `ExecutionLog`

Represents detailed log output associated with a stage attempt. Logs are stored in PostgreSQL.

Suggested fields:

- `id`
- `stageAttemptId`
- `stream` such as `stdout`, `stderr`, or `combined`
- `content`
- `createdAt`

Responsibilities:

- stores detailed execution output for coding, review, push, and merge stages;
- supports auditability and debugging from the application itself;
- keeps detailed logs attached to the owning stage attempt.

### `RepositoryBinding`

Represents task-specific repository metadata derived from the single global repository configuration.

Suggested fields:

- `id`
- `taskId`
- `branchName`
- `worktreePath`
- `mergeCommitRef` nullable
- `cleanupAfter`
- `createdAt`
- `updatedAt`

Responsibilities:

- maps a task to its branch and worktree;
- tracks merge and cleanup-related repository facts;
- stores task-facing repository metadata, but not the cleanup job lifecycle itself;
- avoids storing per-task repository roots because the repository path is global to the app instance.

### `CleanupJob`

Represents scheduled operational work for delayed repository cleanup after task completion.

Suggested fields:

- `id`
- `taskId`
- `repositoryBindingId`
- `jobType` such as `worktree_cleanup`
- `scheduledFor`
- `status` such as `pending`, `running`, `succeeded`, or `failed`
- `attemptCount`
- `lastError` nullable
- `createdAt`
- `updatedAt`

Responsibilities:

- tracks cleanup scheduling independently from repository metadata;
- supports retries and failure reporting for delayed cleanup work;
- preserves a durable record of cleanup execution.

### `AppConfig`

Represents globally scoped configuration for one app instance.

Suggested fields:

- `id`
- `repositoryPath`
- `mainBranchName`
- `createdAt`
- `updatedAt`

Responsibilities:

- stores the globally configured repository path;
- stores stable system-wide defaults such as the integration branch name;
- provides configuration shared by the API, orchestrator worker, and Git manager.

## Entity Relationships

- one `User` creates many `Task` records;
- one `Task` has many `AcceptanceCriterion` records;
- one `Task` has many `Comment` records;
- one `Comment` may have many child `Comment` records through `parentCommentId`;
- one `Comment` may have many `Mention` records;
- one `Task` has many `TaskEvent` records;
- one `Task` has many `StageAttempt` records;
- one `StageAttempt` has many `ExecutionLog` records;
- one `Task` has zero or one active `RepositoryBinding` record;
- one `Task` may have many `CleanupJob` records over time, though only one active cleanup job is expected for the MVP;
- one `AppConfig` record provides the repository root shared by all tasks in the app instance.

## Aggregate Boundaries and Ownership

### Primary Aggregate: `Task`

`Task` should be treated as the main aggregate root because most important business rules are task-scoped. The following records naturally belong under task ownership:

- `AcceptanceCriterion`
- `Comment`
- `TaskEvent`
- `StageAttempt`
- `RepositoryBinding`
- `CleanupJob`

`ExecutionLog` is best modeled as a child of `StageAttempt`, which itself is task-owned.

### Separate Aggregate: `User`

`User` should remain a separate aggregate referenced by ID from task-owned records.

### Global Aggregate: `AppConfig`

`AppConfig` is app-instance-scoped rather than task-scoped. It should not be duplicated across tasks.

## Enumerations

### Task Status

- `todo`
- `ready_for_implementation`
- `in_progress`
- `review`
- `done`

Note: user-facing copy may display `ready for implementation` and `in progress`, but persisted values should use stable machine-friendly identifiers.

### Task Priority

- `high`
- `medium`
- `low`

### Stage Type

- `coding`
- `review`
- `push`
- `merge`

### Stage Attempt Status

- `running`
- `succeeded`
- `failed`

### Cleanup Job Status

- `pending`
- `running`
- `succeeded`
- `failed`

### Actor Type

- `user`
- `system`
- `agent`

## Task Lifecycle

The task lifecycle is the core business flow:

1. A user creates a task in `todo`.
2. The system evaluates completeness, asks clarifying questions, and may suggest acceptance criteria.
3. The user edits task details until the task is clear enough.
4. The system allows transition to `ready_for_implementation` only when the latest task content is sufficiently clear.
5. The user moves the task to `ready_for_implementation`.
6. The orchestrator worker selects the next eligible task and moves it to `in_progress`.
7. Coding and review automation run until acceptance criteria are satisfied or a stage exhausts retries.
8. The system moves the task to `review` after successful automated execution.
9. The user moves the task to `done`.
10. The Git manager rebases and squash merges the task branch into `main`, then schedules worktree cleanup through a dedicated cleanup job record.

## State Transition Rules

Allowed logical transitions:

- `todo` -> `ready_for_implementation`
- `ready_for_implementation` -> `todo`
- `ready_for_implementation` -> `in_progress`
- `in_progress` -> `review`
- `review` -> `done`

Important notes:

- transition into `ready_for_implementation` requires a successful readiness check;
- only the user may move a task out of `ready_for_implementation` when returning it to `todo`;
- transition from `ready_for_implementation` to `in_progress` is system-driven through scheduling;
- transition from `review` to `done` is user-driven;
- merge completion is a post-`done` operational outcome, not a separate user-facing task status.

## Editing and Commenting Rules

### Editable Fields

In editable states, users may update:

- task title;
- task description;
- acceptance criteria.

### Status-Based Rules

- in `todo`, task details are editable and comments are enabled;
- in `ready_for_implementation`, task details are locked and comments are locked;
- changes needed for a task in `ready_for_implementation` require moving it back to `todo` first;
- only the user can initiate that move back to `todo`;
- comments remain part of the permanent audit record even when new comments are locked.

## Execution and Retry Model

Automated work is modeled through `StageAttempt` and `ExecutionLog`.

Rules:

- retries are scoped to the current stage only;
- stages eligible for retries are `coding`, `review`, `push`, and `merge`;
- baseline retry policy is 3 attempts per stage;
- baseline backoff schedule is `30s`, `2m`, and `10m`;
- when all retries fail, the task remains in its current state;
- the user may manually retry only the current failed stage;
- manual retry resets the attempt counter for the current stage;
- each stage attempt should generate corresponding `TaskEvent` records and may generate `ExecutionLog` records.

## Audit and History Model

The system requires a durable audit trail beyond mutable task fields.

Recommended separation of concerns:

- `Comment` stores conversational content;
- `TaskEvent` stores structured lifecycle, decision history, and acceptance-criteria change events;
- `StageAttempt` stores per-attempt execution metadata;
- `ExecutionLog` stores detailed technical output;
- `RepositoryBinding` stores repository lifecycle facts tied to the task;
- `CleanupJob` stores delayed cleanup scheduling and execution history.

This separation keeps user conversation distinct from machine execution records while preserving a coherent full history.

Acceptance criteria changes should rely on generic audit events rather than a dedicated revision-history model. When criteria are created, updated, deleted, or reordered, the system should emit corresponding `TaskEvent` records with enough structured payload to reconstruct the meaningful change history.

## Repository Mapping

Repository data should be modeled with two scopes:

- app-instance scope through `AppConfig.repositoryPath`;
- task scope through `RepositoryBinding.branchName` and `RepositoryBinding.worktreePath`.

Delayed cleanup execution should be modeled separately through `CleanupJob`, while `RepositoryBinding.cleanupAfter` can remain useful as task-facing metadata if retained.

Repository rules reflected in the model:

- branch name is derived from task code;
- each active task has its own worktree;
- merge target is `main`;
- task branches are rebased onto the latest `main` before squash merge;
- worktree cleanup occurs 14 days after the task reaches `done`.

## Key Invariants

- `Task.code` is unique within the app instance;
- only one task total may be active across `in_progress` and `review`;
- `ready_for_implementation` tasks cannot be edited;
- `ready_for_implementation` tasks cannot receive new comments;
- only the user can move a task from `ready_for_implementation` back to `todo`;
- every `AcceptanceCriterion`, `Comment`, `TaskEvent`, `StageAttempt`, and `RepositoryBinding` belongs to exactly one `Task`;
- every `ExecutionLog` belongs to exactly one `StageAttempt`;
- detailed execution logs are stored in PostgreSQL only;
- repository root path is global to the app instance, not per task;
- task branch naming must match the task code.

## Suggested Read Model Views

The write model above will likely be projected into several read-oriented views:

- `BoardTaskView` for kanban columns and summary cards;
- `TaskDetailView` for task description, acceptance criteria, comments, and latest status;
- `TaskHistoryView` for state transitions, retries, and system decisions;
- `ExecutionStatusView` for current stage, attempt counts, and last error.
- `TaskTimelineView` for a unified activity stream combining `TaskEvent`, `StageAttempt`, cleanup milestones, and repository milestones.

These do not need to be stored as separate primary entities, but they are useful for API and UI design.

The recommended UI approach is to expose operational history through a unified timeline rather than splitting `TaskEvent` and `StageAttempt` into separate tabs. Comments remain a separate conversational surface, while the timeline acts as the canonical activity stream for execution history.

## Open Questions

- no open domain-model questions are currently recorded in this document.
