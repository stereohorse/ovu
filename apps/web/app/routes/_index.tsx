import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import type { Route } from "./+types/_index";

import type { TaskPriority } from "@ovu/trpc";

import { getApiErrorMessage, isUnauthorizedError } from "~/lib/errors";
import { useTRPC } from "~/lib/trpc";

export function meta() {
  return [
    { title: "ovu board" },
    {
      name: "description",
      content: "Create work, refine tasks, and move through the MVP board.",
    },
  ];
}

export default function Home() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const bootstrapQuery = useQuery({
    ...trpc.app.bootstrap.queryOptions(),
    retry: false,
  });
  const boardQuery = useQuery({
    ...trpc.board.get.queryOptions(),
    enabled: bootstrapQuery.isSuccess,
    retry: false,
  });
  const systemStatus = useQuery(trpc.system.status.queryOptions());
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("secret");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] =
    useState<TaskPriority>("medium");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response));
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response));
      }
    },
    onSuccess: async () => {
      queryClient.clear();
      await queryClient.invalidateQueries();
    },
  });

  const createTaskMutation = useMutation({
    ...trpc.task.create.mutationOptions({
      onSuccess: async (task) => {
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskPriority("medium");
        await queryClient.invalidateQueries();
        navigate(`/tasks/${task.id}`);
      },
    }),
  });

  const isSignedOut = isUnauthorizedError(bootstrapQuery.error);
  const boardStats = useMemo(() => {
    if (!boardQuery.data) {
      return [];
    }

    return boardQuery.data.columns.map((column) => ({
      label: column.label,
      count: column.tasks.length,
    }));
  }, [boardQuery.data]);

  if (bootstrapQuery.isPending && !loginMutation.isPending) {
    return (
      <main className="shell shell--fallback">
        <div className="panel panel--loading">
          <p className="eyebrow">ovu</p>
          <h1>Checking for an active session...</h1>
          <p>The board shell is waiting for the backend bootstrap response.</p>
        </div>
      </main>
    );
  }

  if (isSignedOut) {
    return (
      <main className="shell shell--auth">
        <section className="auth-hero">
          <div className="panel panel--hero">
            <p className="eyebrow">ovu MVP</p>
            <h1>Sign in and step into the live board.</h1>
            <p className="lede">
              This slice restores the session model, loads typed bootstrap data,
              and gives you an editable task planning surface for `todo` work.
            </p>
            <div className="pill-row" aria-label="Current integration status">
              <span className="pill">Session cookies</span>
              <span className="pill">Typed tRPC</span>
              <span className="pill">Seeded MVP data</span>
            </div>
          </div>

          <div className="panel panel--signin">
            <p className="eyebrow">Demo access</p>
            <h2>Use the seeded MVP account.</h2>
            <form
              className="sign-in-form"
              onSubmit={(event) => {
                event.preventDefault();
                loginMutation.mutate();
              }}
            >
              <label>
                <span>Email</span>
                <input
                  autoComplete="username"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  value={email}
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                />
              </label>
              <button disabled={loginMutation.isPending} type="submit">
                {loginMutation.isPending ? "Signing in..." : "Sign in to ovu"}
              </button>
            </form>
            {loginMutation.isError ? (
              <p className="feedback feedback--error">
                {loginMutation.error.message}
              </p>
            ) : null}
            <p className="credential-hint">
              Default credentials: <code>user@example.com</code> /{" "}
              <code>secret</code>
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (bootstrapQuery.isError) {
    return (
      <main className="shell shell--fallback">
        <div className="panel panel--error">
          <p className="eyebrow">ovu</p>
          <h1>Bootstrap could not load.</h1>
          <p>{bootstrapQuery.error.message}</p>
          <button onClick={() => bootstrapQuery.refetch()} type="button">
            Retry bootstrap
          </button>
        </div>
      </main>
    );
  }

  const bootstrapData = bootstrapQuery.data;

  if (!bootstrapData) {
    return null;
  }

  return (
    <main className="shell">
      <section className="topbar panel">
        <div>
          <p className="eyebrow">Authenticated workspace</p>
          <h1>Board loaded for {bootstrapData.user.displayName}.</h1>
          <p className="lede">
            Create a task, open its detail route, and keep refining the plan
            while the work remains in <code>todo</code>.
          </p>
        </div>
        <div className="topbar-actions">
          <div className="identity-card">
            <strong>{bootstrapData.user.displayName}</strong>
            <span>{bootstrapData.user.email}</span>
          </div>
          <button
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            type="button"
          >
            {logoutMutation.isPending ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </section>

      <section className="board-overview">
        <div className="overview-grid">
          <article className="panel stat-card">
            <span>Transport</span>
            <strong>
              {systemStatus.isSuccess
                ? systemStatus.data.transport.toUpperCase()
                : "..."}
            </strong>
            <p>
              {systemStatus.isSuccess
                ? `Request ${systemStatus.data.requestId} reached the API.`
                : "Checking API transport status."}
            </p>
          </article>
          <article className="panel stat-card">
            <span>Main branch</span>
            <strong>{bootstrapData.config.mainBranchName}</strong>
            <p>Loaded from protected bootstrap configuration.</p>
          </article>
          <article className="panel stat-card">
            <span>Realtime</span>
            <strong>{bootstrapData.config.realtime.provider}</strong>
            <p>
              Live sync comes later; this slice focuses on persisted editing.
            </p>
          </article>
          <article className="panel stat-card">
            <span>Workflow lanes</span>
            <strong>{boardStats.length}</strong>
            <p>
              {boardStats
                .map((item) => `${item.label}: ${item.count}`)
                .join(" · ")}
            </p>
          </article>
        </div>
      </section>

      <section className="board-shell">
        <div className="board-shell__header">
          <div>
            <p className="eyebrow">Board</p>
            <h2>Current MVP task flow</h2>
          </div>
          {boardQuery.data?.activeTaskId ? (
            <p className="active-task-badge">
              Active task id <code>{boardQuery.data.activeTaskId}</code>
            </p>
          ) : null}
        </div>

        <section className="panel create-task-panel">
          <div>
            <p className="eyebrow">Create task</p>
            <h3>Start new work in the editable planning lane.</h3>
            <p>
              New tasks open directly in their dedicated detail screen so you
              can refine the brief, acceptance criteria, and discussion.
            </p>
          </div>
          <form
            className="task-form task-form--create"
            onSubmit={(event) => {
              event.preventDefault();
              createTaskMutation.mutate({
                title: newTaskTitle,
                description: newTaskDescription,
                priority: newTaskPriority,
              });
            }}
          >
            <label>
              <span>Title</span>
              <input
                name="title"
                onChange={(event) => setNewTaskTitle(event.target.value)}
                placeholder="Make task authoring feel complete"
                value={newTaskTitle}
              />
            </label>
            <label>
              <span>Description</span>
              <textarea
                name="description"
                onChange={(event) => setNewTaskDescription(event.target.value)}
                placeholder="Describe the user outcome, key context, and what should become clearer before implementation begins."
                rows={4}
                value={newTaskDescription}
              />
            </label>
            <label>
              <span>Priority</span>
              <select
                name="priority"
                onChange={(event) =>
                  setNewTaskPriority(event.target.value as TaskPriority)
                }
                value={newTaskPriority}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <button disabled={createTaskMutation.isPending} type="submit">
              {createTaskMutation.isPending
                ? "Creating task..."
                : "Create task"}
            </button>
          </form>
          {createTaskMutation.isError ? (
            <p className="feedback feedback--error">
              {createTaskMutation.error.message}
            </p>
          ) : null}
        </section>

        {boardQuery.isPending ? (
          <div className="panel panel--loading">
            <p>Loading board columns...</p>
          </div>
        ) : boardQuery.isError ? (
          <div className="panel panel--error">
            <p>{boardQuery.error.message}</p>
            <button onClick={() => boardQuery.refetch()} type="button">
              Retry board load
            </button>
          </div>
        ) : (
          <div className="board-columns" aria-label="Task board columns">
            {boardQuery.data.columns.map((column) => (
              <section className="board-column panel" key={column.status}>
                <div className="board-column__header">
                  <div>
                    <p className="eyebrow">
                      {column.status.replaceAll("_", " ")}
                    </p>
                    <h3>{column.label}</h3>
                  </div>
                  <span className="count-chip">{column.tasks.length}</span>
                </div>

                {column.tasks.length === 0 ? (
                  <div className="empty-state">No tasks in this lane yet.</div>
                ) : (
                  <div className="task-list">
                    {column.tasks.map((task) => (
                      <Link
                        className="task-card"
                        key={task.id}
                        to={`/tasks/${task.id}`}
                      >
                        <div className="task-card__meta">
                          <span>{task.code}</span>
                          <span>{task.priority}</span>
                        </div>
                        <h4>{task.title}</h4>
                        <p>
                          Updated <code>{task.updatedAt}</code>
                        </p>
                        <div className="task-card__capabilities">
                          {task.capabilities.canEdit ? (
                            <span className="pill pill--soft">Editable</span>
                          ) : null}
                          {task.capabilities.canComment ? (
                            <span className="pill pill--soft">Comments on</span>
                          ) : null}
                        </div>
                        {task.currentStage ? (
                          <p className="task-card__stage">
                            Stage: <strong>{task.currentStage}</strong>
                          </p>
                        ) : null}
                        {task.lastError ? (
                          <p className="feedback feedback--warning">
                            {task.lastError}
                          </p>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
