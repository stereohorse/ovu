import { router } from "./core.js";
import { systemRouter } from "./routers/system.js";

export const appRouter = router({
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
