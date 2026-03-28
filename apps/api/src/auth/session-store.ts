import { randomUUID } from "node:crypto";

const sessions = new Map<string, string>();

export const sessionCookieName = "ovu_session";

export function createSession(userId: string) {
  const token = randomUUID();
  sessions.set(token, userId);
  return token;
}

export function getSessionUserId(token: string | undefined) {
  if (!token) {
    return null;
  }

  return sessions.get(token) ?? null;
}

export function clearSession(token: string | undefined) {
  if (!token) {
    return;
  }

  sessions.delete(token);
}
