import type { TrpcContext } from "@ovu/trpc";
import { TRPCError } from "@trpc/server";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { getSessionUserId, sessionCookieName } from "../auth/session-store.js";
import {
  addAcceptanceCriterion,
  addComment,
  addReply,
  createTask,
  deleteAcceptanceCriterion,
  findUserById,
  getAppConfig,
  getBoard,
  getTask,
  getTaskComments,
  reorderAcceptanceCriteria,
  updateAcceptanceCriterion,
  updateTask,
} from "../mvp/store.js";

export function createContext({
  req,
}: CreateFastifyContextOptions): TrpcContext {
  const sessionToken = req.cookies[sessionCookieName];
  const userId = getSessionUserId(sessionToken);
  const currentUser = userId ? findUserById(userId) : null;

  return {
    requestId: req.id,
    currentUser,
    loadBootstrap() {
      if (!currentUser) {
        throw new Error("Cannot load bootstrap without an authenticated user.");
      }

      return {
        user: currentUser,
        config: getAppConfig(),
      };
    },
    loadBoard() {
      return getBoard();
    },
    createTask(input) {
      return createTask(input, requireCurrentUser(currentUser));
    },
    loadTask(taskId) {
      return getTask(taskId);
    },
    updateTask(input) {
      requireCurrentUser(currentUser);
      return updateTask(input);
    },
    addAcceptanceCriterion(input) {
      requireCurrentUser(currentUser);
      return addAcceptanceCriterion(input);
    },
    updateAcceptanceCriterion(input) {
      requireCurrentUser(currentUser);
      return updateAcceptanceCriterion(input);
    },
    deleteAcceptanceCriterion(input) {
      requireCurrentUser(currentUser);
      deleteAcceptanceCriterion(input);
    },
    reorderAcceptanceCriteria(input) {
      requireCurrentUser(currentUser);
      return reorderAcceptanceCriteria(input);
    },
    loadTaskComments(taskId) {
      return getTaskComments(taskId);
    },
    addComment(input) {
      return addComment(input, requireCurrentUser(currentUser));
    },
    addReply(input) {
      return addReply(input, requireCurrentUser(currentUser));
    },
  };
}

function requireCurrentUser(currentUser: TrpcContext["currentUser"]) {
  if (!currentUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign in is required for this resource.",
    });
  }

  return currentUser;
}
