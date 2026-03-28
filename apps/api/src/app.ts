import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";

import { registerTrpc } from "./trpc/plugin.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
    routerOptions: {
      maxParamLength: 5000,
    },
  });

  app.register(cors, {
    credentials: true,
    origin: true,
  });

  app.register(cookie, {
    hook: "onRequest",
  });

  registerTrpc(app);

  app.get("/health", async () => {
    return {
      service: "api",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/api", async () => {
    return {
      message: "ovu API is ready for the MVP slices.",
      status: "ok",
      version: 1,
    };
  });

  return app;
}
