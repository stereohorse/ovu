import { router } from "./core.js";
import { appDataRouter } from "./routers/app.js";
import { boardRouter } from "./routers/board.js";
import { systemRouter } from "./routers/system.js";
import { taskRouter } from "./routers/task.js";

export const appRouter = router({
  app: appDataRouter,
  board: boardRouter,
  system: systemRouter,
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
