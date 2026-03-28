import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    credentials: true,
    origin: true,
  });

  app.register(cookie, {
    hook: "onRequest",
  });

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
