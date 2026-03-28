import type { TrpcContext } from "@ovu/trpc";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { getSessionUserId, sessionCookieName } from "../auth/session-store.js";
import { findUserById, getAppConfig, getBoard } from "../mvp/store.js";

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
  };
}
