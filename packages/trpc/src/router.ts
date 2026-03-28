import { router } from "./core.js";
import { appDataRouter } from "./routers/app.js";
import { boardRouter } from "./routers/board.js";
import { systemRouter } from "./routers/system.js";

export const appRouter = router({
  app: appDataRouter,
  board: boardRouter,
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
