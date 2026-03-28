import { protectedProcedure, router } from "../core.js";

export const boardRouter = router({
  get: protectedProcedure.query(({ ctx }) => {
    return ctx.loadBoard();
  }),
});
