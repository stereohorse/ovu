import { TRPCError, initTRPC } from "@trpc/server";

import type {
  AcceptanceCriterion,
  AddAcceptanceCriterionInput,
  AddCommentInput,
  AddReplyInput,
  BoardPayload,
  BootstrapPayload,
  CreateTaskInput,
  DeleteAcceptanceCriterionInput,
  ReorderAcceptanceCriteriaInput,
  TaskCommentsPayload,
  TaskDetail,
  UpdateAcceptanceCriterionInput,
  UpdateTaskInput,
  UserSummary,
} from "./contracts.js";

export interface TrpcContext {
  requestId: string;
  currentUser: UserSummary | null;
  loadBootstrap: () => BootstrapPayload;
  loadBoard: () => BoardPayload;
  createTask: (input: CreateTaskInput) => TaskDetail;
  loadTask: (taskId: string) => TaskDetail;
  updateTask: (input: UpdateTaskInput) => TaskDetail;
  addAcceptanceCriterion: (
    input: AddAcceptanceCriterionInput,
  ) => AcceptanceCriterion;
  updateAcceptanceCriterion: (
    input: UpdateAcceptanceCriterionInput,
  ) => AcceptanceCriterion;
  deleteAcceptanceCriterion: (input: DeleteAcceptanceCriterionInput) => void;
  reorderAcceptanceCriteria: (
    input: ReorderAcceptanceCriteriaInput,
  ) => TaskDetail;
  loadTaskComments: (taskId: string) => TaskCommentsPayload;
  addComment: (input: AddCommentInput) => TaskCommentsPayload;
  addReply: (input: AddReplyInput) => TaskCommentsPayload;
}

const t = initTRPC.context<TrpcContext>().create();

const requireUser = t.middleware(({ ctx, next }) => {
  if (!ctx.currentUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign in is required for this resource.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      currentUser: ctx.currentUser,
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(requireUser);
