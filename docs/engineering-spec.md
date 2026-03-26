# ovu Engineering Spec

## Purpose

This document defines the system behavior and engineering constraints for the `ovu` MVP. It complements the product-facing overview in `README.md` and focuses on workflow rules, operational behavior, and repository automation.

System structure, component boundaries, and data flow are described separately in `docs/architecture.md`.
Core entities, relationships, and invariants are described separately in `docs/domain-model.md`.

## System Scope and Constraints

- the system manages exactly one Git repository per app instance;
- the repository directory path is configured globally for the whole app instance;
- PostgreSQL is the system of record for product state, audit history, and execution logs;
- only one user role exists in the MVP: authenticated basic user;
- multiple tasks may be in `ready for implementation`, but at most one task total may be in `in progress` or `review`;
- basic email/password authentication only;
- deployments to UAT and production are out of scope and are handled by external CI on branch pushes.

## Roles and Permissions

### Basic User

Basic users can:

- create tasks;
- edit task descriptions while the task is editable;
- edit acceptance criteria while the task is editable;
- participate in threaded task discussions while comments are enabled for the current status;
- move tasks between allowed statuses;
- trigger manual retry for the current failed automated stage.

There are no separate admin, reviewer, or operator roles in the MVP.

## Task Model

- each task receives a unique code in the format `T-<N>`;
- `N` is an auto-incrementing integer starting from `1`;
- task priorities are `high`, `medium`, and `low`;
- task statuses are `todo`, `ready for implementation`, `in progress`, `review`, and `done`.

## Task State Machine

### `todo`

- initial state for all new tasks;
- users can edit task details;
- comments are enabled;
- the system can ask clarifying questions and suggest acceptance criteria.

### `ready for implementation`

- indicates the task is clear enough for automated implementation;
- multiple tasks may exist in this state;
- task description edits are locked;
- comments are locked;
- users must move the task back to `todo` if changes are needed;
- only the user can move a task out of this state.

### `in progress`

- indicates the system is actively implementing the selected task;
- no other task may be in `in progress` or `review` while one task is in this state.

### `review`

- indicates the automated implementation and review loop completed successfully;
- the task is waiting for user acceptance;
- no other task may be in `in progress` or `review` while one task is in this state.

### `done`

- indicates the user accepted the outcome;
- the system may perform post-completion repository cleanup.

## Task Editing Rules

- users create new tasks in `todo`;
- users may edit task descriptions directly or ask the system to update them while the task is editable;
- the system evaluates task completeness and asks clarifying questions when needed;
- the system can suggest acceptance criteria;
- users can edit acceptance criteria;
- the system allows a task to move to `ready for implementation` only when the latest task content is sufficiently clear.

## Comments and Audit Trail

- task comments support threaded conversations;
- users can mention other users or the system in comments;
- the system responds when mentioned;
- agent comments, system decisions, generated acceptance criteria, retry history, and task discussion history are stored permanently.

## Orchestration Rules

- the orchestrator runs as a separate worker process from the main backend API;
- the backend API and orchestrator worker communicate through persisted state and domain events;
- the system selects the oldest task from `ready for implementation` among the highest-priority available tasks;
- the coding agent is `opencode`;
- the system creates one Git worktree per active task and uses the task code as the branch name;
- the coding agent creates commits and pushes to the remote repository at major milestones;
- agents use SSH keys to push to Git remotes;
- the system starts an automated review or QA agent each time a coding pass completes;
- the coding and review loop continues until acceptance criteria are satisfied;
- when automated implementation and review succeed, the system moves the task to `review`.

## Retry and Failure Handling

- coding, review, push, and merge stages retry automatically;
- the baseline retry policy is 3 attempts per stage;
- the baseline exponential backoff schedule is `30s`, `2m`, and `10m`;
- retry policy should become configurable per app instance after the MVP, while keeping the MVP baseline as the default;
- retries apply independently to each current stage only;
- if all retries fail, the task remains in its current state;
- the UI shows the latest error for the failed stage;
- users can manually retry only the current failed stage;
- a manual retry resets the attempt counter for that stage;
- each retry attempt should be stored with timestamp, stage, short error summary, and detailed execution logs in PostgreSQL.

## Repository and Git Rules

- the system manages one repository with multiple branches;
- the primary integration branch is `main`;
- each active task gets its own worktree and task branch named after the task code;
- when a task reaches `done`, the system rebases the task branch onto the latest `main` and then squash merges it into `main` for a clear history;
- the system deletes the task worktree 14 days after the task moves to `done`.

## Realtime Update Requirements

- users monitor work through the kanban board;
- the board updates in real time using a WebSocket-first transport with fallback support, implemented through a library such as `socket.io`;
- the MVP does not include separate notification channels.

## Task History Experience

- the system should expose a dedicated execution timeline view in addition to comments and board status;
- the execution timeline should surface state transitions, system decisions, automated stage attempts, failures, retries, and repository milestones in one user-facing activity stream.

## External Dependencies and Out of Scope

- UAT deployment management is out of scope;
- production deployment management is out of scope;
- external CI is responsible for any deployment triggered by branch pushes.

## Open Technical Questions

- no open technical questions are currently recorded in this document.
