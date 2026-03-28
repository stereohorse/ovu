import { TRPCError } from "@trpc/server";

import {
  type AcceptanceCriterion,
  type AddAcceptanceCriterionInput,
  type AddCommentInput,
  type AddReplyInput,
  type AppConfigPayload,
  type BoardPayload,
  type CreateTaskInput,
  type DeleteAcceptanceCriterionInput,
  type ReorderAcceptanceCriteriaInput,
  type TaskComment,
  type TaskCommentsPayload,
  type TaskDetail,
  type TaskPriority,
  type TaskStatus,
  type TaskSummary,
  type UpdateAcceptanceCriterionInput,
  type UpdateTaskInput,
  type UserSummary,
  taskPriorities,
  taskStatuses,
} from "@ovu/trpc";

interface DemoUserRecord extends UserSummary {
  password: string;
}

interface TaskRecord {
  id: string;
  code: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  lastError: string | null;
  currentStage: "coding" | "review" | "push" | "merge" | null;
  acceptanceCriteria: AcceptanceCriterion[];
  comments: TaskComment[];
}

const demoUser: DemoUserRecord = {
  id: "d7741f98-50c6-4b86-aeb4-80ca0372831c",
  email: "user@example.com",
  displayName: "Alex Doe",
  password: "secret",
};

const tasks = new Map<string, TaskRecord>();

const appConfig: AppConfigPayload = {
  mainBranchName: "main",
  realtime: {
    provider: "socket.io",
  },
  taskStatuses: [...taskStatuses],
  taskPriorities: [...taskPriorities],
};

const statusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  ready_for_implementation: "Ready for implementation",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
};

let nextTaskNumber = 19;

seedTasks();

export function authenticateUser(email: string, password: string) {
  const matches =
    email.trim().toLowerCase() === demoUser.email &&
    password === demoUser.password;

  return matches ? toUserSummary(demoUser) : null;
}

export function findUserById(userId: string) {
  return userId === demoUser.id ? toUserSummary(demoUser) : null;
}

export function getAppConfig() {
  return appConfig;
}

export function getBoard(): BoardPayload {
  return {
    columns: taskStatuses.map((status) => ({
      status,
      label: statusLabels[status],
      tasks: listTaskRecords()
        .filter((task) => task.status === status)
        .map((task) => toTaskSummary(task)),
    })),
    activeTaskId:
      listTaskRecords().find(
        (task) => task.status === "in_progress" || task.status === "review",
      )?.id ?? null,
  };
}

export function createTask(input: CreateTaskInput, currentUser: UserSummary) {
  const timestamp = now();
  const task: TaskRecord = {
    id: crypto.randomUUID(),
    code: `T-${nextTaskNumber++}`,
    title: input.title.trim(),
    description: input.description.trim(),
    status: "todo",
    priority: input.priority,
    createdByUserId: currentUser.id,
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
    lastError: null,
    currentStage: null,
    acceptanceCriteria: [],
    comments: [],
  };

  tasks.set(task.id, task);
  return toTaskDetail(task);
}

export function getTask(taskId: string) {
  return toTaskDetail(requireTask(taskId));
}

export function updateTask(input: UpdateTaskInput) {
  const task = requireEditableTask(input.taskId);

  task.title = input.title.trim();
  task.description = input.description.trim();
  task.priority = input.priority;
  touchTask(task);

  return toTaskDetail(task);
}

export function addAcceptanceCriterion(input: AddAcceptanceCriterionInput) {
  const task = requireEditableTask(input.taskId);
  const timestamp = now();
  const criterion: AcceptanceCriterion = {
    id: crypto.randomUUID(),
    taskId: task.id,
    text: input.text.trim(),
    source: "user",
    position: task.acceptanceCriteria.length + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  task.acceptanceCriteria.push(criterion);
  touchTask(task);

  return criterion;
}

export function updateAcceptanceCriterion(
  input: UpdateAcceptanceCriterionInput,
) {
  const task = requireEditableTask(input.taskId);
  const criterion =
    task.acceptanceCriteria.find((item) => item.id === input.criterionId) ??
    null;

  if (!criterion) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "The acceptance criterion could not be found.",
    });
  }

  criterion.text = input.text.trim();
  criterion.updatedAt = now();
  touchTask(task);

  return criterion;
}

export function deleteAcceptanceCriterion(
  input: DeleteAcceptanceCriterionInput,
) {
  const task = requireEditableTask(input.taskId);
  const nextCriteria = task.acceptanceCriteria.filter(
    (item) => item.id !== input.criterionId,
  );

  if (nextCriteria.length === task.acceptanceCriteria.length) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "The acceptance criterion could not be found.",
    });
  }

  task.acceptanceCriteria = nextCriteria.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
  touchTask(task);
}

export function reorderAcceptanceCriteria(
  input: ReorderAcceptanceCriteriaInput,
) {
  const task = requireEditableTask(input.taskId);
  const existingIds = task.acceptanceCriteria.map((criterion) => criterion.id);

  if (
    input.orderedCriterionIds.length !== existingIds.length ||
    input.orderedCriterionIds.some((id) => !existingIds.includes(id))
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The requested acceptance criteria order is invalid.",
    });
  }

  const criteriaById = new Map(
    task.acceptanceCriteria.map((criterion) => [criterion.id, criterion]),
  );

  task.acceptanceCriteria = input.orderedCriterionIds.map(
    (criterionId, index) => {
      const criterion = criteriaById.get(criterionId);

      if (!criterion) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The requested acceptance criteria order is invalid.",
        });
      }

      return {
        ...criterion,
        position: index + 1,
        updatedAt: now(),
      };
    },
  );
  touchTask(task);

  return toTaskDetail(task);
}

export function getTaskComments(taskId: string): TaskCommentsPayload {
  const task = requireTask(taskId);

  return {
    items: [...task.comments].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    ),
  };
}

export function addComment(input: AddCommentInput, currentUser: UserSummary) {
  const task = requireCommentableTask(input.taskId);
  const comment = createCommentRecord({
    taskId: task.id,
    author: currentUser,
    body: input.body,
    parentCommentId: null,
  });

  task.comments.push(comment);
  touchTask(task);

  return getTaskComments(task.id);
}

export function addReply(input: AddReplyInput, currentUser: UserSummary) {
  const task = requireCommentableTask(input.taskId);
  const parentComment =
    task.comments.find((comment) => comment.id === input.parentCommentId) ??
    null;

  if (!parentComment) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "The parent comment could not be found for this task.",
    });
  }

  const comment = createCommentRecord({
    taskId: task.id,
    author: currentUser,
    body: input.body,
    parentCommentId: parentComment.id,
  });

  task.comments.push(comment);
  touchTask(task);

  return getTaskComments(task.id);
}

function seedTasks() {
  const seededTasks: TaskRecord[] = [
    {
      id: "6f7d5f7b-f5cc-45d9-97f2-8fbefd78554a",
      code: "T-1",
      title: "Polish task creation form copy",
      description:
        "Tighten the opening copy for the task creation flow so new work feels clearer and less robotic. Keep the editable planning posture obvious and reduce ambiguity about what belongs in title versus description.",
      status: "todo",
      priority: "medium",
      createdByUserId: demoUser.id,
      createdAt: "2026-03-26T03:00:00Z",
      updatedAt: "2026-03-26T03:15:00Z",
      version: 3,
      lastError: null,
      currentStage: null,
      acceptanceCriteria: [
        {
          id: "ac-task-copy-1",
          taskId: "6f7d5f7b-f5cc-45d9-97f2-8fbefd78554a",
          text: "The task creation surface explains what the title should capture in one short sentence.",
          source: "user",
          position: 1,
          createdAt: "2026-03-26T03:03:00Z",
          updatedAt: "2026-03-26T03:03:00Z",
        },
        {
          id: "ac-task-copy-2",
          taskId: "6f7d5f7b-f5cc-45d9-97f2-8fbefd78554a",
          text: "The description helper text encourages problem framing instead of implementation instructions.",
          source: "user",
          position: 2,
          createdAt: "2026-03-26T03:05:00Z",
          updatedAt: "2026-03-26T03:05:00Z",
        },
      ],
      comments: [
        {
          id: "comment-task-copy-1",
          taskId: "6f7d5f7b-f5cc-45d9-97f2-8fbefd78554a",
          authorType: "user",
          author: {
            id: demoUser.id,
            displayName: demoUser.displayName,
          },
          parentCommentId: null,
          body: "Let's keep the tone warm and product-facing instead of writing like internal tooling.",
          createdAt: "2026-03-26T03:06:00Z",
          updatedAt: "2026-03-26T03:06:00Z",
        },
        {
          id: "comment-task-copy-2",
          taskId: "6f7d5f7b-f5cc-45d9-97f2-8fbefd78554a",
          authorType: "user",
          author: {
            id: demoUser.id,
            displayName: demoUser.displayName,
          },
          parentCommentId: "comment-task-copy-1",
          body: "Agreed. The current draft sounds too much like a backend admin form.",
          createdAt: "2026-03-26T03:08:00Z",
          updatedAt: "2026-03-26T03:08:00Z",
        },
      ],
    },
    {
      id: "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
      code: "T-12",
      title: "Add approval notes to review screen",
      description:
        "Show the final implementation summary and leave space for acceptance notes before the user marks a reviewed task as done.",
      status: "ready_for_implementation",
      priority: "high",
      createdByUserId: demoUser.id,
      createdAt: "2026-03-26T03:20:00Z",
      updatedAt: "2026-03-26T03:45:00Z",
      version: 8,
      lastError: null,
      currentStage: null,
      acceptanceCriteria: [],
      comments: [],
    },
    {
      id: "2df1a6e5-459f-4ee3-b5cf-92a7be2dccd3",
      code: "T-14",
      title: "Show latest branch milestone in task history",
      description:
        "Surface branch creation, milestone commits, and merge readiness in the timeline so users understand what happened during execution.",
      status: "review",
      priority: "high",
      createdByUserId: demoUser.id,
      createdAt: "2026-03-26T04:00:00Z",
      updatedAt: "2026-03-26T04:32:00Z",
      version: 5,
      lastError: null,
      currentStage: null,
      acceptanceCriteria: [],
      comments: [],
    },
    {
      id: "6d16b1f9-b77f-4328-bc8b-c2ef2c381967",
      code: "T-16",
      title: "Retry merge after CI branch protection update",
      description:
        "Capture the changed branch protection requirements so merge retries explain why prior attempts failed.",
      status: "done",
      priority: "low",
      createdByUserId: demoUser.id,
      createdAt: "2026-03-25T23:40:00Z",
      updatedAt: "2026-03-26T01:04:00Z",
      version: 9,
      lastError: null,
      currentStage: null,
      acceptanceCriteria: [],
      comments: [],
    },
    {
      id: "9d85d3cb-80fe-4d87-99fb-040d9354c6a1",
      code: "T-18",
      title: "Expose failed review details in the board card",
      description:
        "Make the current review-stage failure visible from the board so users know why automation is blocked before opening the task.",
      status: "in_progress",
      priority: "high",
      createdByUserId: demoUser.id,
      createdAt: "2026-03-26T04:40:00Z",
      updatedAt: "2026-03-26T05:02:00Z",
      version: 11,
      lastError: "Review stage timed out waiting for lint results.",
      currentStage: "review",
      acceptanceCriteria: [],
      comments: [],
    },
  ];

  for (const task of seededTasks) {
    tasks.set(task.id, task);
  }
}

function listTaskRecords() {
  return [...tasks.values()].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
}

function toTaskSummary(task: TaskRecord): TaskSummary {
  return {
    id: task.id,
    code: task.code,
    title: task.title,
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    lastError: task.lastError,
    currentStage: task.currentStage,
    capabilities: getTaskCapabilities(task.status),
  };
}

function toTaskDetail(task: TaskRecord): TaskDetail {
  return {
    ...toTaskSummary(task),
    description: task.description,
    version: task.version,
    createdBy: toUserSummary(demoUser),
    acceptanceCriteria: [...task.acceptanceCriteria].sort(
      (left, right) => left.position - right.position,
    ),
  };
}

function getTaskCapabilities(status: TaskStatus) {
  return {
    canEdit: status === "todo",
    canComment: status === "todo" || status === "review" || status === "done",
    canMoveToReady: status === "todo",
    canMoveToTodo: status === "ready_for_implementation",
    canMoveToDone: status === "review",
    canRetryCurrentStage: status === "in_progress",
  };
}

function requireTask(taskId: string) {
  const task = tasks.get(taskId) ?? null;

  if (!task) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "The requested task could not be found.",
    });
  }

  return task;
}

function requireEditableTask(taskId: string) {
  const task = requireTask(taskId);

  if (!getTaskCapabilities(task.status).canEdit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This task is no longer editable.",
    });
  }

  return task;
}

function requireCommentableTask(taskId: string) {
  const task = requireTask(taskId);

  if (!getTaskCapabilities(task.status).canComment) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Comments are locked for this task.",
    });
  }

  return task;
}

function createCommentRecord({
  taskId,
  author,
  body,
  parentCommentId,
}: {
  taskId: string;
  author: UserSummary;
  body: string;
  parentCommentId: string | null;
}): TaskComment {
  const timestamp = now();

  return {
    id: crypto.randomUUID(),
    taskId,
    authorType: "user",
    author: {
      id: author.id,
      displayName: author.displayName,
    },
    parentCommentId,
    body: body.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function touchTask(task: TaskRecord) {
  task.updatedAt = now();
  task.version += 1;
}

function now() {
  return new Date().toISOString();
}

function toUserSummary(user: DemoUserRecord): UserSummary {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}
