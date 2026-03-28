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

export interface AcceptanceCriterion {
  id: string;
  taskId: string;
  text: string;
  source: "user" | "system";
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentAuthorSummary {
  id: string;
  displayName: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorType: "user" | "system" | "agent";
  author: CommentAuthorSummary;
  parentCommentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCommentsPayload {
  items: TaskComment[];
}

export interface TaskDetail extends TaskSummary {
  description: string;
  version: number;
  createdBy: UserSummary;
  acceptanceCriteria: AcceptanceCriterion[];
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
}

export interface UpdateTaskInput {
  taskId: string;
  title: string;
  description: string;
  priority: TaskPriority;
}

export interface AddAcceptanceCriterionInput {
  taskId: string;
  text: string;
}

export interface UpdateAcceptanceCriterionInput {
  taskId: string;
  criterionId: string;
  text: string;
}

export interface DeleteAcceptanceCriterionInput {
  taskId: string;
  criterionId: string;
}

export interface ReorderAcceptanceCriteriaInput {
  taskId: string;
  orderedCriterionIds: string[];
}

export interface AddCommentInput {
  taskId: string;
  body: string;
}

export interface AddReplyInput {
  taskId: string;
  parentCommentId: string;
  body: string;
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
