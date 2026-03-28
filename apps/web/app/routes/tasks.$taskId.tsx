import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import type { Route } from "./+types/tasks.$taskId";

import type { AcceptanceCriterion, TaskComment, TaskPriority } from "@ovu/trpc";

import { isUnauthorizedError } from "~/lib/errors";
import { useTRPC } from "~/lib/trpc";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `ovu task ${params.taskId}` },
    {
      name: "description",
      content: "Refine task details, acceptance criteria, and discussion.",
    },
  ];
}

export default function TaskDetailRoute({ params }: Route.ComponentProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const bootstrapQuery = useQuery({
    ...trpc.app.bootstrap.queryOptions(),
    retry: false,
  });
  const taskQuery = useQuery({
    ...trpc.task.get.queryOptions({ taskId: params.taskId }),
    enabled: bootstrapQuery.isSuccess,
    retry: false,
  });
  const commentsQuery = useQuery({
    ...trpc.task.listComments.queryOptions({ taskId: params.taskId }),
    enabled: bootstrapQuery.isSuccess,
    retry: false,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [newCriterionText, setNewCriterionText] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [activeReplyParentId, setActiveReplyParentId] = useState<string | null>(
    null,
  );
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => {
    if (!taskQuery.data) {
      return;
    }

    setTitle(taskQuery.data.title);
    setDescription(taskQuery.data.description);
    setPriority(taskQuery.data.priority);
  }, [taskQuery.data]);

  const refreshTaskViews = async () => {
    await queryClient.invalidateQueries();
  };

  const updateTaskMutation = useMutation({
    ...trpc.task.update.mutationOptions({
      onSuccess: async (task) => {
        setTitle(task.title);
        setDescription(task.description);
        setPriority(task.priority);
        await refreshTaskViews();
      },
    }),
  });
  const addCriterionMutation = useMutation({
    ...trpc.task.addAcceptanceCriterion.mutationOptions({
      onSuccess: async () => {
        setNewCriterionText("");
        await refreshTaskViews();
      },
    }),
  });
  const updateCriterionMutation = useMutation({
    ...trpc.task.updateAcceptanceCriterion.mutationOptions({
      onSuccess: refreshTaskViews,
    }),
  });
  const deleteCriterionMutation = useMutation({
    ...trpc.task.deleteAcceptanceCriterion.mutationOptions({
      onSuccess: refreshTaskViews,
    }),
  });
  const reorderCriteriaMutation = useMutation({
    ...trpc.task.reorderAcceptanceCriteria.mutationOptions({
      onSuccess: refreshTaskViews,
    }),
  });
  const addCommentMutation = useMutation({
    ...trpc.task.addComment.mutationOptions({
      onSuccess: async () => {
        setCommentBody("");
        await refreshTaskViews();
      },
    }),
  });
  const addReplyMutation = useMutation({
    ...trpc.task.addReply.mutationOptions({
      onSuccess: async () => {
        setReplyBody("");
        setActiveReplyParentId(null);
        await refreshTaskViews();
      },
    }),
  });

  const isSignedOut = isUnauthorizedError(bootstrapQuery.error);
  const comments = commentsQuery.data?.items ?? [];
  const threadRoots = useMemo(() => {
    return comments.filter((comment) => comment.parentCommentId === null);
  }, [comments]);
  const childrenByParentId = useMemo(() => {
    const map = new Map<string, TaskComment[]>();

    for (const comment of comments) {
      if (!comment.parentCommentId) {
        continue;
      }

      const siblings = map.get(comment.parentCommentId) ?? [];
      siblings.push(comment);
      map.set(comment.parentCommentId, siblings);
    }

    return map;
  }, [comments]);

  if (bootstrapQuery.isPending) {
    return (
      <main className="shell shell--fallback">
        <div className="panel panel--loading">
          <p className="eyebrow">ovu</p>
          <h1>Preparing task workspace...</h1>
          <p>Checking your session before loading the task detail view.</p>
        </div>
      </main>
    );
  }

  if (isSignedOut) {
    return (
      <main className="shell shell--fallback">
        <div className="panel panel--error">
          <p className="eyebrow">ovu</p>
          <h1>Sign in required</h1>
          <p>
            The task detail screen is only available to authenticated users.
          </p>
          <Link className="inline-link" to="/">
            Return to sign in
          </Link>
        </div>
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
        </div>
      </main>
    );
  }

  if (taskQuery.isPending || commentsQuery.isPending) {
    return (
      <main className="shell shell--fallback">
        <div className="panel panel--loading">
          <p className="eyebrow">Task detail</p>
          <h1>Loading task detail...</h1>
          <p>
            Pulling the latest task, criteria, and discussion from the backend.
          </p>
        </div>
      </main>
    );
  }

  if (taskQuery.isError) {
    return (
      <main className="shell shell--fallback">
        <div className="panel panel--error">
          <p className="eyebrow">Task detail</p>
          <h1>Task could not load.</h1>
          <p>{taskQuery.error.message}</p>
          <Link className="inline-link" to="/">
            Back to board
          </Link>
        </div>
      </main>
    );
  }

  if (commentsQuery.isError) {
    return (
      <main className="shell shell--fallback">
        <div className="panel panel--error">
          <p className="eyebrow">Task discussion</p>
          <h1>Comments could not load.</h1>
          <p>{commentsQuery.error.message}</p>
          <button onClick={() => commentsQuery.refetch()} type="button">
            Retry comments
          </button>
        </div>
      </main>
    );
  }

  const task = taskQuery.data;
  const canEdit = task.capabilities.canEdit;
  const canComment = task.capabilities.canComment;

  return (
    <main className="shell task-detail-shell">
      <section className="panel task-detail-hero">
        <div className="task-detail-hero__meta">
          <Link className="inline-link" to="/">
            Back to board
          </Link>
          <p className="eyebrow">{task.code}</p>
          <h1>{task.title}</h1>
          <p className="lede">
            Refine the brief while the task remains editable, then keep the
            acceptance criteria and discussion aligned with the saved backend
            record.
          </p>
        </div>
        <div className="task-summary-card">
          <span className="pill">{task.status.replaceAll("_", " ")}</span>
          <span className="pill">{task.priority} priority</span>
          <span className="pill">Version {task.version}</span>
          <p>
            Created by <strong>{task.createdBy.displayName}</strong>
          </p>
          <p>
            Updated <code>{task.updatedAt}</code>
          </p>
        </div>
      </section>

      <section className="task-detail-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Task detail</p>
              <h2>Metadata and brief</h2>
            </div>
            <span
              className={`status-badge ${canEdit ? "" : "status-badge--locked"}`}
            >
              {canEdit ? "Editable" : "Locked"}
            </span>
          </div>
          <form
            className="task-form"
            onSubmit={(event) => {
              event.preventDefault();
              updateTaskMutation.mutate({
                taskId: task.id,
                title,
                description,
                priority,
              });
            }}
          >
            <label>
              <span>Title</span>
              <input
                disabled={!canEdit || updateTaskMutation.isPending}
                onChange={(event) => setTitle(event.target.value)}
                value={title}
              />
            </label>
            <label>
              <span>Description</span>
              <textarea
                disabled={!canEdit || updateTaskMutation.isPending}
                onChange={(event) => setDescription(event.target.value)}
                rows={8}
                value={description}
              />
            </label>
            <label>
              <span>Priority</span>
              <select
                disabled={!canEdit || updateTaskMutation.isPending}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
                value={priority}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <button
              disabled={!canEdit || updateTaskMutation.isPending}
              type="submit"
            >
              {updateTaskMutation.isPending
                ? "Saving changes..."
                : "Save task details"}
            </button>
          </form>
          {!canEdit ? (
            <p className="feedback feedback--warning">
              This task is no longer editable in its current workflow state.
            </p>
          ) : null}
          {updateTaskMutation.isError ? (
            <p className="feedback feedback--error">
              {updateTaskMutation.error.message}
            </p>
          ) : null}
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Acceptance criteria</p>
              <h2>Clarify what done should mean</h2>
            </div>
            <span className="count-chip">{task.acceptanceCriteria.length}</span>
          </div>

          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault();
              addCriterionMutation.mutate({
                taskId: task.id,
                text: newCriterionText,
              });
            }}
          >
            <input
              disabled={!canEdit || addCriterionMutation.isPending}
              onChange={(event) => setNewCriterionText(event.target.value)}
              placeholder="Add another acceptance criterion"
              value={newCriterionText}
            />
            <button
              disabled={!canEdit || addCriterionMutation.isPending}
              type="submit"
            >
              Add criterion
            </button>
          </form>

          {task.acceptanceCriteria.length === 0 ? (
            <div className="empty-state empty-state--compact">
              No acceptance criteria yet.
            </div>
          ) : (
            <div className="criteria-list">
              {task.acceptanceCriteria.map((criterion, index) => (
                <CriterionEditor
                  canEdit={canEdit}
                  criterion={criterion}
                  index={index}
                  isBusy={
                    updateCriterionMutation.isPending ||
                    deleteCriterionMutation.isPending ||
                    reorderCriteriaMutation.isPending
                  }
                  key={criterion.id}
                  onDelete={() =>
                    deleteCriterionMutation.mutate({
                      taskId: task.id,
                      criterionId: criterion.id,
                    })
                  }
                  onMove={(direction) => {
                    const reorderedIds = moveItem(
                      task.acceptanceCriteria.map((item) => item.id),
                      index,
                      direction,
                    );

                    if (!reorderedIds) {
                      return;
                    }

                    reorderCriteriaMutation.mutate({
                      taskId: task.id,
                      orderedCriterionIds: reorderedIds,
                    });
                  }}
                  onSave={(text) =>
                    updateCriterionMutation.mutate({
                      taskId: task.id,
                      criterionId: criterion.id,
                      text,
                    })
                  }
                  total={task.acceptanceCriteria.length}
                />
              ))}
            </div>
          )}

          {addCriterionMutation.isError ? (
            <p className="feedback feedback--error">
              {addCriterionMutation.error.message}
            </p>
          ) : null}
          {updateCriterionMutation.isError ? (
            <p className="feedback feedback--error">
              {updateCriterionMutation.error.message}
            </p>
          ) : null}
          {deleteCriterionMutation.isError ? (
            <p className="feedback feedback--error">
              {deleteCriterionMutation.error.message}
            </p>
          ) : null}
          {reorderCriteriaMutation.isError ? (
            <p className="feedback feedback--error">
              {reorderCriteriaMutation.error.message}
            </p>
          ) : null}
        </article>
      </section>

      <section className="panel discussion-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Discussion</p>
            <h2>Keep the planning conversation attached to the task</h2>
          </div>
          <span
            className={`status-badge ${canComment ? "" : "status-badge--locked"}`}
          >
            {canComment ? "Comments on" : "Comments locked"}
          </span>
        </div>

        <form
          className="task-form"
          onSubmit={(event) => {
            event.preventDefault();
            addCommentMutation.mutate({
              taskId: task.id,
              body: commentBody,
            });
          }}
        >
          <label>
            <span>New comment</span>
            <textarea
              disabled={!canComment || addCommentMutation.isPending}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="Add context, clarifications, or follow-up questions"
              rows={4}
              value={commentBody}
            />
          </label>
          <button
            disabled={!canComment || addCommentMutation.isPending}
            type="submit"
          >
            Post comment
          </button>
        </form>

        {threadRoots.length === 0 ? (
          <div className="empty-state empty-state--compact">
            No discussion yet.
          </div>
        ) : (
          <div className="comment-thread-list">
            {threadRoots.map((comment) => (
              <CommentThread
                activeReplyParentId={activeReplyParentId}
                isReplyPending={addReplyMutation.isPending}
                canComment={canComment}
                childrenByParentId={childrenByParentId}
                comment={comment}
                key={comment.id}
                onReplySubmit={(parentCommentId) => {
                  addReplyMutation.mutate({
                    taskId: task.id,
                    parentCommentId,
                    body: replyBody,
                  });
                }}
                onToggleReply={(parentCommentId) => {
                  setActiveReplyParentId((current) =>
                    current === parentCommentId ? null : parentCommentId,
                  );
                  setReplyBody("");
                }}
                replyBody={replyBody}
                setReplyBody={setReplyBody}
              />
            ))}
          </div>
        )}

        {addCommentMutation.isError ? (
          <p className="feedback feedback--error">
            {addCommentMutation.error.message}
          </p>
        ) : null}
        {addReplyMutation.isError ? (
          <p className="feedback feedback--error">
            {addReplyMutation.error.message}
          </p>
        ) : null}
      </section>
    </main>
  );
}

function CriterionEditor({
  criterion,
  index,
  total,
  canEdit,
  isBusy,
  onMove,
  onSave,
  onDelete,
}: {
  criterion: AcceptanceCriterion;
  index: number;
  total: number;
  canEdit: boolean;
  isBusy: boolean;
  onMove: (direction: "up" | "down") => void;
  onSave: (text: string) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(criterion.text);

  useEffect(() => {
    setDraft(criterion.text);
  }, [criterion.text]);

  return (
    <article className="criterion-card">
      <div className="criterion-card__header">
        <span className="count-chip">#{criterion.position}</span>
        <div className="criterion-card__actions">
          <button
            disabled={!canEdit || isBusy || index === 0}
            onClick={() => onMove("up")}
            type="button"
          >
            Up
          </button>
          <button
            disabled={!canEdit || isBusy || index === total - 1}
            onClick={() => onMove("down")}
            type="button"
          >
            Down
          </button>
        </div>
      </div>
      <textarea
        disabled={!canEdit || isBusy}
        onChange={(event) => setDraft(event.target.value)}
        rows={3}
        value={draft}
      />
      <div className="criterion-card__footer">
        <button
          disabled={!canEdit || isBusy}
          onClick={() => onSave(draft)}
          type="button"
        >
          Save
        </button>
        <button
          className="button-danger"
          disabled={!canEdit || isBusy}
          onClick={onDelete}
          type="button"
        >
          Remove
        </button>
      </div>
    </article>
  );
}

function CommentThread({
  comment,
  childrenByParentId,
  canComment,
  activeReplyParentId,
  replyBody,
  setReplyBody,
  onToggleReply,
  onReplySubmit,
  isReplyPending,
}: {
  comment: TaskComment;
  childrenByParentId: Map<string, TaskComment[]>;
  canComment: boolean;
  activeReplyParentId: string | null;
  replyBody: string;
  setReplyBody: (value: string) => void;
  onToggleReply: (parentCommentId: string) => void;
  onReplySubmit: (parentCommentId: string) => void;
  isReplyPending: boolean;
}) {
  const replies = childrenByParentId.get(comment.id) ?? [];

  return (
    <article className="comment-card">
      <div className="comment-card__header">
        <strong>{comment.author.displayName}</strong>
        <span>{comment.createdAt}</span>
      </div>
      <p>{comment.body}</p>
      <button
        className="button-secondary"
        disabled={!canComment || isReplyPending}
        onClick={() => onToggleReply(comment.id)}
        type="button"
      >
        {activeReplyParentId === comment.id ? "Cancel reply" : "Reply"}
      </button>

      {activeReplyParentId === comment.id ? (
        <form
          className="inline-form inline-form--stacked"
          onSubmit={(event) => {
            event.preventDefault();
            onReplySubmit(comment.id);
          }}
        >
          <textarea
            disabled={!canComment || isReplyPending}
            onChange={(event) => setReplyBody(event.target.value)}
            rows={3}
            value={replyBody}
          />
          <button disabled={!canComment || isReplyPending} type="submit">
            Post reply
          </button>
        </form>
      ) : null}

      {replies.length > 0 ? (
        <div className="comment-card__children">
          {replies.map((reply) => (
            <CommentThread
              activeReplyParentId={activeReplyParentId}
              isReplyPending={isReplyPending}
              canComment={canComment}
              childrenByParentId={childrenByParentId}
              comment={reply}
              key={reply.id}
              onReplySubmit={onReplySubmit}
              onToggleReply={onToggleReply}
              replyBody={replyBody}
              setReplyBody={setReplyBody}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function moveItem<T>(items: T[], index: number, direction: "up" | "down") {
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= items.length) {
    return null;
  }

  const nextItems = [...items];
  const [moved] = nextItems.splice(index, 1);

  if (moved === undefined) {
    return null;
  }

  nextItems.splice(targetIndex, 0, moved);

  return nextItems;
}
