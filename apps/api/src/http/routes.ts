import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import {
  clearSession,
  createSession,
  getSessionUserId,
  sessionCookieName,
} from "../auth/session-store.js";
import {
  authenticateUser,
  findUserById,
  getAppConfig,
  getBoard,
} from "../mvp/store.js";
import { sendApiError } from "./errors.js";

interface LoginBody {
  email?: string;
  password?: string;
}

export function registerHttpRoutes(app: FastifyInstance) {
  app.post<{ Body: LoginBody }>("/api/auth/login", async (request, reply) => {
    const email = request.body?.email?.trim();
    const password = request.body?.password;

    if (!email || !password) {
      return sendApiError(
        reply,
        400,
        "VALIDATION_ERROR",
        "Email and password are required.",
      );
    }

    const user = authenticateUser(email, password);

    if (!user) {
      return sendApiError(
        reply,
        401,
        "UNAUTHORIZED",
        "The provided credentials are invalid.",
      );
    }

    const token = createSession(user.id);

    reply.setCookie(sessionCookieName, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });

    return reply.send({ user });
  });

  app.post("/api/auth/logout", async (request, reply) => {
    const sessionToken = request.cookies[sessionCookieName];
    clearSession(sessionToken);

    reply.clearCookie(sessionCookieName, {
      path: "/",
      sameSite: "lax",
    });

    return reply.status(204).send();
  });

  app.get("/api/me", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user) {
      return;
    }

    return reply.send({ user });
  });

  app.get("/api/config", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user) {
      return;
    }

    return reply.send(getAppConfig());
  });

  app.get("/api/board", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user) {
      return;
    }

    return reply.send(getBoard());
  });
}

function requireUser(request: FastifyRequest, reply: FastifyReply) {
  const sessionToken = request.cookies[sessionCookieName];
  const userId = getSessionUserId(sessionToken);
  const user = userId ? findUserById(userId) : null;

  if (!user) {
    sendApiError(
      reply,
      401,
      "UNAUTHORIZED",
      "Sign in is required for this resource.",
    );
    return null;
  }

  return user;
}
