import { protectedProcedure, router } from "../core.js";

export const appDataRouter = router({
  bootstrap: protectedProcedure.query(({ ctx }) => {
    return ctx.loadBootstrap();
  }),
});
