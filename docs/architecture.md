# ovu Architecture

## Overview

`ovu` is a single-repository task orchestration system that connects a user-facing kanban application with backend automation for task preparation, coding, review, and repository operations. The architecture is designed around a simple MVP constraint set: one app instance, one configured repository, one active execution pipeline, and a permanent audit trail for all meaningful system activity.

The system separates product interactions from execution mechanics. Users work through the web interface to create, refine, and approve tasks. Internal services evaluate readiness, schedule work, run coding and review agents, manage Git operations, and publish live updates back to the UI.

Core entities, ownership rules, and business invariants are described separately in `docs/domain-model.md`.

## Architecture Goals

- keep the user experience simple and centered on tasks rather than developer tooling;
- enforce workflow rules consistently in the backend;
- make all important system activity observable through persistent task history and real-time board updates;
- isolate repository automation behind dedicated services instead of mixing Git logic into UI flows;
- support reliable execution with explicit stage retries and failure visibility.

## System Context

At a high level, the system has five main concerns:

- presenting tasks, comments, and board state to authenticated users;
- storing product and operational state in PostgreSQL;
- enforcing task lifecycle rules and selecting the next eligible task;
- running coding and review agents for the active task;
- managing the underlying Git repository, task branches, and worktrees.

External systems are intentionally limited in the MVP:

- a Git remote receives branch pushes from the system;
- external CI reacts to branch pushes and owns any UAT or production deployment behavior;
- no external notification channel is required.

## High-Level Components

### Frontend Application

The frontend provides the kanban board and task workspace used by basic users. It is responsible for:

- authentication flows;
- task creation and editing while allowed by workflow rules;
- threaded comments and system mention interactions;
- acceptance criteria display and editing;
- a dedicated execution timeline view for task activity;
- state transition controls such as moving tasks to `ready for implementation` or `done`;
- showing execution status, last failure, and manual retry controls for the current failed stage;
- subscribing to real-time updates through a WebSocket-first transport with fallback support.

The frontend should treat the backend as the source of truth for all workflow permissions and task transitions.

### Backend API

The backend API serves the frontend and enforces application rules. It is responsible for:

- basic email/password authentication;
- task, comment, and acceptance criteria CRUD;
- validation of allowed state transitions;
- readiness checks for transitions into `ready for implementation`;
- returning task history, system decisions, retry history, and current execution state;
- exposing endpoints for manual retry of the current failed stage;
- publishing domain events to the real-time delivery layer.

The backend API runs separately from the orchestrator worker and communicates through persisted state and domain events.

### Orchestrator Worker

The orchestrator runs as a separate worker process that coordinates workflow automation. It is responsible for:

- enforcing the single-active-task rule across `in progress` and `review`;
- selecting the next eligible task from `ready for implementation`;
- moving tasks into `in progress` when execution begins;
- triggering coding, review, push, and merge stages;
- managing stage-local retries and backoff;
- deciding when a task moves to `review` or remains blocked on failure.

The orchestrator should be state-driven. It reacts to validated task transitions and stage outcomes rather than relying on direct UI control over internal automation.

### Agent Runner

The agent runner launches and supervises automation agents for the active task. It is responsible for:

- starting the coding agent and review or QA agent processes;
- passing task context, acceptance criteria, and repository workspace information to each run;
- capturing outputs, status, and errors from each stage;
- storing meaningful agent results in persistent history;
- returning normalized stage outcomes to the orchestrator.

The coding agent for the MVP is `opencode`. Review automation may use a separate review or QA agent, but the orchestrator should treat both as stage implementations behind the same interface.

### Git Manager

The Git manager encapsulates all repository operations. It is responsible for:

- using the globally configured repository path for the app instance;
- creating a task worktree and branch named after the task code;
- supporting milestone commits and pushes to the remote;
- rebasing task work onto the latest `main` before merge;
- squash merging accepted task branches into `main`;
- deleting task worktrees 14 days after tasks move to `done`.

All Git access should happen through this layer so repository behavior stays consistent and auditable.

### Persistence Layer

The persistence layer is backed by PostgreSQL and stores both product state and operational history. It is responsible for persisting:

- tasks, statuses, priorities, and task codes;
- task descriptions and acceptance criteria;
- threaded comments and mentions;
- system decisions and readiness feedback;
- stage attempts, retry counters, timestamps, and last errors;
- detailed execution logs for automated stages;
- agent summaries, references to logs, and branch or worktree metadata;
- cleanup job records for delayed repository cleanup work;
- event records needed for real-time updates and audit history.

### Realtime Delivery Layer

The realtime delivery layer pushes updates from backend state changes to connected clients. It is responsible for:

- broadcasting board changes when tasks move between states;
- pushing task-level updates such as new comments, retry attempts, and stage failures;
- keeping the UI synchronized without requiring polling.

The realtime layer should use a WebSocket-first library such as `socket.io`, with fallback support when direct WebSocket connectivity is unavailable.

### Timeline Read Model

The timeline read model provides a single user-facing execution history stream for each task. It is responsible for:

- combining task state transitions, system decisions, stage attempts, failures, retries, and repository milestones;
- presenting operational history separately from threaded comments while keeping both views task-centered;
- supporting the dedicated execution timeline required by the product.

## Core Workflows

### 1. Task Refinement Workflow

1. A user creates a task in `todo`.
2. The backend stores the task and returns the initial record.
3. The system evaluates task completeness and may add clarification comments or suggested acceptance criteria.
4. The user edits the task until it is clear enough to implement.
5. The backend validates readiness before allowing a move to `ready for implementation`.

### 2. Scheduling and Execution Workflow

1. The orchestrator worker observes that no task is active in `in progress` or `review`.
2. The orchestrator worker selects the oldest task among the highest-priority tasks in `ready for implementation`.
3. The orchestrator worker moves the task to `in progress`.
4. The Git manager creates the task worktree and branch.
5. The agent runner starts the coding agent.
6. The Git manager handles stage-related commit and push operations as needed.
7. After a coding pass completes, the agent runner starts review or QA automation.
8. The orchestrator worker repeats coding and review until acceptance criteria are satisfied or a stage fails after retries.

### 3. Review and Completion Workflow

1. When automated execution succeeds, the orchestrator worker moves the task to `review`.
2. The user examines the task outcome and history.
3. The user moves the task to `done` when satisfied.
4. The Git manager rebases the task branch onto `main` and performs a squash merge.
5. The system schedules delayed worktree cleanup for 14 days after completion by creating a cleanup job record.

### 4. Failure and Retry Workflow

1. A stage fails during coding, review, push, or merge.
2. The orchestrator worker records the failure and schedules an automatic retry for that stage.
3. Retries follow the configured backoff schedule of `30s`, `2m`, and `10m`.
4. If the final retry fails, the task remains in its current state and exposes the latest error.
5. The user can trigger manual retry only for the current failed stage.

## Data Model Overview

The exact schema may evolve, but the architecture should preserve these core entities in PostgreSQL:

- `User`: authenticated basic user identity;
- `Task`: title, description, status, priority, task code, timestamps;
- `AcceptanceCriterion`: task-scoped criteria editable by users and suggestible by the system;
- `Comment`: threaded discussion entry with author, mentions, and parent relationship;
- `TaskEvent`: state transition, system decision, agent milestone, or audit event;
- `StageAttempt`: execution attempt for coding, review, push, or merge with status and error data;
- `ExecutionLog`: detailed log output associated with a stage attempt;
- `CleanupJob`: scheduled repository cleanup work for completed tasks;
- `RepositoryBinding`: global repository path and task branch or worktree metadata.

These entities should support both operational control and user-visible history.

## Execution and Concurrency Model

The MVP uses a single execution lane for automation-heavy work. This means:

- multiple tasks can wait in `ready for implementation`;
- only one task can be active across `in progress` and `review`;
- a backend lock or equivalent coordination primitive should protect task selection and stage transitions across API and worker processes;
- automation must be resumable from persisted state after process restarts where possible.

This model simplifies scheduling, repository safety, and user expectations while the product matures.

## Repository Automation Model

Repository automation should be modeled as infrastructure behavior owned by backend services, not user actions. The system should:

- derive branch names from task codes;
- keep repository mutations auditable through task history;
- isolate task work through separate worktrees;
- centralize rebase, merge, push, and cleanup rules in one component.

Because deployments are external, the architecture only needs to guarantee correct branch operations and traceable merge behavior.

## Security and Access Model

- users authenticate with basic email/password authentication;
- the app instance has access to a single configured repository path;
- agents use SSH keys to push to Git remotes;
- repository credentials are infrastructure-managed and not user-managed;
- backend services, not frontend clients, perform all agent and Git operations.

## Observability and Auditability

The product promise depends on clear visibility into system behavior. The architecture should therefore preserve:

- task-level history for status changes and decisions;
- retry and failure records for each stage;
- database-backed execution logs for each automated stage;
- a dedicated execution timeline read model for user-facing operational history;
- real-time events that keep the board and task details in sync.

Users should be able to understand what the system is doing without direct access to developer tooling.

## External Integrations

- Git remote for branch pushes;
- external CI for deployment-related automation;
- no external log storage is required for the MVP.

## Deployment and Runtime Assumptions

- one app instance manages one repository;
- one globally configured repository path exists per app instance;
- one UAT environment and one production environment may exist externally, but they are not controlled by this system;
- the application should tolerate transient agent, network, and Git failures through stage-local retries;
- PostgreSQL is the system of record for product state, execution history, and detailed execution logs;
- the orchestrator runs as a separate worker process from the main backend API.

## Open Questions

- no open architecture questions are currently recorded in this document.
