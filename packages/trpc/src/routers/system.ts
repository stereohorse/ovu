import { publicProcedure, router } from "../core.js";

export const systemRouter = router({
  status: publicProcedure.query(({ ctx }) => {
    return {
      message: "tRPC connected",
      requestId: ctx.requestId,
      servedAt: new Date().toISOString(),
      transport: "trpc" as const,
    };
  }),
});
