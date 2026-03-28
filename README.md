# ovu

`ovu` is a web application that lets non-developers submit, refine, track, and approve software tasks executed by coding agents against a single Git repository.

The product gives users a real-time kanban board, a structured task workflow, and a permanent audit trail of discussions and system decisions. Users stay in control of task intent and approval, while the system handles task preparation, implementation orchestration, automated review loops, and repository operations.

## Monorepo Layout

The MVP now starts from a `pnpm` workspace monorepo so frontend and backend work can evolve together without reworking project setup on every slice.

- `apps/web` - React Router Framework Mode app for the user-facing product UI;
- `apps/api` - Fastify HTTP API for auth, board data, workflow actions, and realtime integration points;
- `apps/worker` - worker stub reserved for orchestration and agent execution flows in later slices.

Shared tooling lives at the workspace root through `mise.toml`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `biome.json`, and root scripts in `package.json`.

## Local Setup

### Prerequisites

- [mise](https://mise.jdx.dev/) for tool version management;
- the Node.js runtime defined in `mise.toml` (current latest LTS line);
- `pnpm`, also managed through `mise`.

### Install tools and dependencies

```bash
mise install
pnpm install
```

### Start the workspace

```bash
pnpm dev
```

This starts:

- web app: `http://localhost:5173`
- API: `http://localhost:3001`

Optional worker stub:

```bash
pnpm --filter @ovu/worker dev
```

### Common workspace commands

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm dev:all
```

`pnpm dev:all` starts the web app, API, and worker stub together.

## Problem

Non-developers often have ideas or requests for software changes but lack a direct, structured way to hand work to coding agents. Existing workflows usually depend on developers to translate requests, manage Git operations, coordinate review, and keep everyone updated on status.

This creates several problems:

- task requests are often incomplete or ambiguous;
- progress is hard to follow without asking for updates;
- implementation context and decisions are lost across chat tools and Git history;
- agent-driven work still requires too much manual coordination.

`ovu` addresses this by giving users a dedicated interface where they can define work, collaborate on requirements, watch execution progress in real time, and approve the final result without managing engineering tooling directly.

## Goals

- enable non-developers to request software work through a web interface;
- improve task clarity before implementation starts;
- increase coding agent autonomy while preserving user oversight;
- make implementation progress visible in real time;
- preserve a permanent record of task discussion, system feedback, and acceptance criteria.

## Non-Goals

- managing more than one repository per app instance;
- supporting multiple user roles in the MVP;
- handling UAT or production deployment inside the product;
- sending notifications outside the real-time board experience;
- replacing external CI systems.

## Target User

The MVP serves authenticated basic users who want to request and track implementation work without using Git or developer tooling directly. These users may understand the product domain well but are not expected to manage branches, worktrees, review loops, or coding agents themselves.

## Product Scope

The MVP includes:

- task creation and kanban-based task tracking;
- task description refinement with system feedback;
- user-editable acceptance criteria;
- threaded task discussions;
- automated implementation and review orchestration;
- real-time board updates;
- persistent task history and audit records.

## Core User Journey

1. A user creates a task in `todo`.
2. The system evaluates whether the task is clear enough to implement, asks clarifying questions when needed, and suggests acceptance criteria.
3. The user updates the task description and acceptance criteria until the task is ready.
4. The user moves the task to `ready for implementation`.
5. The system selects the highest-priority eligible task and starts implementation.
6. The system runs coding and automated review loops until the work satisfies the task acceptance criteria or a stage fails after retries.
7. The task moves to `review` when the automated loop succeeds.
8. The user reviews the outcome and moves the task to `done` when satisfied.

## Success Metrics

- users can create and refine implementation tasks without developer tooling;
- tasks reach `ready for implementation` with clear descriptions and acceptance criteria;
- users can understand current system activity from the board without asking for status updates;
- the system maintains a complete task history that users can review later;
- the product can run the single-task execution pipeline reliably with automatic retries and visible failures.

## Engineering Spec

Detailed workflow, state, repository, and operational requirements live in `docs/engineering-spec.md`.

## Architecture

System structure, component responsibilities, and core data flows live in `docs/architecture.md`.

## Domain Model

Core entities, relationships, lifecycle rules, and invariants live in `docs/domain-model.md`.

## API Design

Public HTTP and realtime API contracts live in `docs/api-design.md`.
