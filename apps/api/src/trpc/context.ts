import type { TrpcContext } from "@ovu/trpc";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

export function createContext({
  req,
}: CreateFastifyContextOptions): TrpcContext {
  return {
    requestId: req.id,
  };
}
