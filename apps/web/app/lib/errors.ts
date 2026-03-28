import type { TRPCClientErrorLike } from "@trpc/client";

import type { AppRouter } from "@ovu/trpc";

export function isUnauthorizedError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "data" in error &&
    (error as TRPCClientErrorLike<AppRouter>).data?.code === "UNAUTHORIZED"
  );
}

export async function getApiErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string };
    };

    return (
      payload.error?.message ?? `Request failed with status ${response.status}.`
    );
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}
