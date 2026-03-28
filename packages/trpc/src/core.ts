import { TRPCError, initTRPC } from "@trpc/server";

import type {
  BoardPayload,
  BootstrapPayload,
  UserSummary,
} from "./contracts.js";

export interface TrpcContext {
  requestId: string;
  currentUser: UserSummary | null;
  loadBootstrap: () => BootstrapPayload;
  loadBoard: () => BoardPayload;
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
