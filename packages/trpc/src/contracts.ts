export const taskStatuses = [
  "todo",
  "ready_for_implementation",
  "in_progress",
  "review",
  "done",
] as const;

export const taskPriorities = ["high", "medium", "low"] as const;

export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];

export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
}

export interface TaskCapabilities {
  canEdit: boolean;
  canComment: boolean;
  canMoveToReady: boolean;
  canMoveToTodo: boolean;
  canMoveToDone: boolean;
  canRetryCurrentStage: boolean;
}

export interface TaskSummary {
  id: string;
  code: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
  currentStage: "coding" | "review" | "push" | "merge" | null;
  capabilities: TaskCapabilities;
}

export interface BoardColumn {
  status: TaskStatus;
  label: string;
  tasks: TaskSummary[];
}

export interface BoardPayload {
  columns: BoardColumn[];
  activeTaskId: string | null;
}

export interface AppConfigPayload {
  mainBranchName: string;
  realtime: {
    provider: "socket.io";
  };
  taskStatuses: TaskStatus[];
  taskPriorities: TaskPriority[];
}

export interface BootstrapPayload {
  user: UserSummary;
  config: AppConfigPayload;
}
