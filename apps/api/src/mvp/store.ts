import {
  type AppConfigPayload,
  type BoardPayload,
  type TaskStatus,
  type TaskSummary,
  type UserSummary,
  taskPriorities,
  taskStatuses,
} from "@ovu/trpc";

interface DemoUserRecord extends UserSummary {
  password: string;
}

const demoUser: DemoUserRecord = {
  id: "d7741f98-50c6-4b86-aeb4-80ca0372831c",
  email: "user@example.com",
  displayName: "Alex Doe",
  password: "secret",
};

const tasks: TaskSummary[] = [
  {
    id: "6f7d5f7b-f5cc-45d9-97f2-8fbefd78554a",
    code: "T-1",
    title: "Polish task creation form copy",
    status: "todo",
    priority: "medium",
    createdAt: "2026-03-26T03:00:00Z",
    updatedAt: "2026-03-26T03:15:00Z",
    lastError: null,
    currentStage: null,
    capabilities: {
      canEdit: true,
      canComment: true,
      canMoveToReady: true,
      canMoveToTodo: false,
      canMoveToDone: false,
      canRetryCurrentStage: false,
    },
  },
  {
    id: "8a9f5c1e-6aaf-4d2e-b16f-73ef7c7fdb39",
    code: "T-12",
    title: "Add approval notes to review screen",
    status: "ready_for_implementation",
    priority: "high",
    createdAt: "2026-03-26T03:20:00Z",
    updatedAt: "2026-03-26T03:45:00Z",
    lastError: null,
    currentStage: null,
    capabilities: {
      canEdit: false,
      canComment: false,
      canMoveToReady: false,
      canMoveToTodo: true,
      canMoveToDone: false,
      canRetryCurrentStage: false,
    },
  },
  {
    id: "2df1a6e5-459f-4ee3-b5cf-92a7be2dccd3",
    code: "T-14",
    title: "Show latest branch milestone in task history",
    status: "review",
    priority: "high",
    createdAt: "2026-03-26T04:00:00Z",
    updatedAt: "2026-03-26T04:32:00Z",
    lastError: null,
    currentStage: null,
    capabilities: {
      canEdit: false,
      canComment: true,
      canMoveToReady: false,
      canMoveToTodo: false,
      canMoveToDone: true,
      canRetryCurrentStage: false,
    },
  },
  {
    id: "6d16b1f9-b77f-4328-bc8b-c2ef2c381967",
    code: "T-16",
    title: "Retry merge after CI branch protection update",
    status: "done",
    priority: "low",
    createdAt: "2026-03-25T23:40:00Z",
    updatedAt: "2026-03-26T01:04:00Z",
    lastError: null,
    currentStage: null,
    capabilities: {
      canEdit: false,
      canComment: true,
      canMoveToReady: false,
      canMoveToTodo: false,
      canMoveToDone: false,
      canRetryCurrentStage: false,
    },
  },
  {
    id: "9d85d3cb-80fe-4d87-99fb-040d9354c6a1",
    code: "T-18",
    title: "Expose failed review details in the board card",
    status: "in_progress",
    priority: "high",
    createdAt: "2026-03-26T04:40:00Z",
    updatedAt: "2026-03-26T05:02:00Z",
    lastError: "Review stage timed out waiting for lint results.",
    currentStage: "review",
    capabilities: {
      canEdit: false,
      canComment: false,
      canMoveToReady: false,
      canMoveToTodo: false,
      canMoveToDone: false,
      canRetryCurrentStage: true,
    },
  },
];

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
      tasks: tasks.filter((task) => task.status === status),
    })),
    activeTaskId:
      tasks.find(
        (task) => task.status === "in_progress" || task.status === "review",
      )?.id ?? null,
  };
}

function toUserSummary(user: DemoUserRecord): UserSummary {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}
