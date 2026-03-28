# tRPC Frontend-Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared tRPC contract, Fastify `/trpc` server integration, and React Router client providers so the web app can render one typed API query end-to-end while keeping plain operational HTTP routes.

**Architecture:** Create a new workspace package that owns the shared tRPC router contract and reusable initialization helpers. Mount that router into the existing Fastify app with request-scoped context, then add a TanStack Query + tRPC provider layer in the web app so the home route can render the first typed `system.status` query. Update docs so `/trpc` is the primary application boundary and `/health` plus similar plain routes remain operational endpoints.

**Tech Stack:** pnpm workspaces, TypeScript, Fastify 5, `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `@tanstack/react-query`, React Router 7, Vite

---

## File Structure

- `pnpm-workspace.yaml` - include the new shared workspace package.
- `apps/api/package.json` - add backend tRPC dependencies and shared package dependency.
- `apps/web/package.json` - add frontend tRPC and TanStack Query dependencies plus shared package dependency.
- `packages/trpc/package.json` - define the shared router workspace package.
- `packages/trpc/tsconfig.json` - compile and typecheck the shared package.
- `packages/trpc/src/core.ts` - define `TrpcContext`, `router`, and `publicProcedure`.
- `packages/trpc/src/routers/system.ts` - hold the first transport-validation procedure.
- `packages/trpc/src/router.ts` - assemble and export `appRouter` and `AppRouter`.
- `packages/trpc/src/index.ts` - export the shared tRPC package surface for API and web imports.
- `apps/api/src/app.ts` - keep `/health` and `/api`, set `routerOptions.maxParamLength`, and register the tRPC plugin.
- `apps/api/src/trpc/context.ts` - build request-scoped context from Fastify request and reply.
- `apps/api/src/trpc/plugin.ts` - mount `fastifyTRPCPlugin` under `/trpc` with typed options.
- `apps/web/app/lib/trpc.ts` - create `TRPCProvider` and `useTRPC` from the shared `AppRouter` type.
- `apps/web/app/providers/trpc-provider.tsx` - create the `QueryClient`, tRPC client, and provider wrapper.
- `apps/web/app/root.tsx` - wrap the app outlet with the provider.
- `apps/web/app/routes/home.tsx` - render the first typed query and its loading/error/success states.
- `apps/web/vite.config.ts` - proxy `/trpc` to the API during local development.
- `docs/architecture.md` - document the API as a mixed plain-HTTP + tRPC host.
- `docs/api-design.md` - clarify that `/api` remains the conceptual external HTTP model while the web app now prefers `/trpc` for application-facing calls.

### Task 1: Create the shared tRPC workspace package

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`
- Create: `packages/trpc/package.json`
- Create: `packages/trpc/tsconfig.json`
- Create: `packages/trpc/src/index.ts`
- Create: `packages/trpc/src/core.ts`
- Create: `packages/trpc/src/routers/system.ts`
- Create: `packages/trpc/src/router.ts`

- [ ] **Step 1: Update workspace manifests and add a failing shared package surface**

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// apps/api/package.json
{
  "name": "@ovu/api",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx watch --clear-screen=false src/index.ts",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@fastify/cookie": "^11.0.2",
    "@fastify/cors": "^11.1.0",
    "@ovu/trpc": "workspace:*",
    "@trpc/server": "^11.0.0",
    "fastify": "^5.6.1"
  },
  "devDependencies": {
    "@types/node": "^24.6.2",
    "tsx": "^4.20.6",
    "typescript": "^5.9.3"
  }
}
```

```json
// apps/web/package.json
{
  "name": "@ovu/web",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "react-router build",
    "dev": "react-router dev --host 0.0.0.0 --port 5173",
    "start": "vite preview --host 0.0.0.0 --port 4173",
    "typecheck": "react-router typegen && tsc -p tsconfig.json"
  },
  "dependencies": {
    "@ovu/trpc": "workspace:*",
    "@react-router/node": "7.13.2",
    "@tanstack/react-query": "^5.90.3",
    "@trpc/client": "^11.0.0",
    "@trpc/tanstack-react-query": "^11.0.0",
    "isbot": "^5.1.36",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router": "7.13.2"
  },
  "devDependencies": {
    "@react-router/dev": "7.13.2",
    "@react-router/fs-routes": "7.13.2",
    "@tailwindcss/vite": "^4.2.2",
    "@types/node": "^22",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "tailwindcss": "^4.2.2",
    "typescript": "^5.9.3",
    "vite": "^7.1.7",
    "vite-tsconfig-paths": "^5.1.4"
  }
}
```

```json
// packages/trpc/package.json
{
  "name": "@ovu/trpc",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@trpc/server": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3"
  }
}
```

```json
// packages/trpc/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/.tsbuildinfo"
  },
  "include": ["src/**/*.ts"]
}
```

```ts
// packages/trpc/src/index.ts
export { publicProcedure, router } from "./core.js";
export type { TrpcContext } from "./core.js";
export { appRouter } from "./router.js";
export type { AppRouter } from "./router.js";
```

- [ ] **Step 2: Run install and confirm the shared package fails before implementation**

Run: `pnpm install && pnpm --filter @ovu/trpc typecheck`

Expected: install succeeds, then `@ovu/trpc` typecheck fails with module resolution errors for `./core.js` or `./router.js` because the shared package surface exists but the implementation files do not yet.

- [ ] **Step 3: Implement the shared router package**

```ts
// packages/trpc/src/core.ts
import { initTRPC } from "@trpc/server";

export interface TrpcContext {
  requestId: string;
}

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
```

```ts
// packages/trpc/src/routers/system.ts
import { publicProcedure, router } from "../core.js";

export const systemRouter = router({
  status: publicProcedure.query(({ ctx }) => {
    return {
      message: "tRPC is connected to the API",
      requestId: ctx.requestId,
      servedAt: new Date().toISOString(),
      transport: "trpc",
    };
  }),
});
```

```ts
// packages/trpc/src/router.ts
import { router } from "./core.js";
import { systemRouter } from "./routers/system.js";

export const appRouter = router({
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
```

```ts
// packages/trpc/src/index.ts
export { publicProcedure, router } from "./core.js";
export type { TrpcContext } from "./core.js";
export { appRouter } from "./router.js";
export type { AppRouter } from "./router.js";
```

- [ ] **Step 4: Run the shared package typecheck again**

Run: `pnpm --filter @ovu/trpc typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml apps/api/package.json apps/web/package.json packages/trpc
git commit -m "build: add shared trpc contract package"
```

### Task 2: Mount the shared router into the Fastify API

**Files:**
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/src/trpc/context.ts`
- Create: `apps/api/src/trpc/plugin.ts`

- [ ] **Step 1: Wire the API bootstrap to the future plugin and Fastify router options**

```ts
// apps/api/src/app.ts
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

  registerTrpc(app);

  return app;
}
```

- [ ] **Step 2: Run the API typecheck and confirm the missing plugin implementation fails**

Run: `pnpm --filter @ovu/api typecheck`

Expected: FAIL with a module resolution error for `./trpc/plugin.js` because the API bootstrap now depends on the tRPC plugin wiring.

- [ ] **Step 3: Create the API context and Fastify tRPC plugin**

```ts
// apps/api/src/trpc/context.ts
import type { FastifyReply, FastifyRequest } from "fastify";

import type { TrpcContext } from "@ovu/trpc";

export function createTrpcContext(options: {
  req: FastifyRequest;
  res: FastifyReply;
}): TrpcContext {
  return {
    requestId: String(options.req.id),
  };
}
```

```ts
// apps/api/src/trpc/plugin.ts
import type { FastifyInstance } from "fastify";

import { appRouter, type AppRouter } from "@ovu/trpc";
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";

import { createTrpcContext } from "./context.js";

export function registerTrpc(app: FastifyInstance) {
  app.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: {
      router: appRouter,
      createContext: ({ req, res }) => createTrpcContext({ req, res }),
      onError({ path, error }) {
        app.log.error({ err: error, path }, "tRPC request failed");
      },
    } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
  });
}
```

- [ ] **Step 4: Re-run the API typecheck**

Run: `pnpm --filter @ovu/api typecheck`

Expected: PASS with no TypeScript errors and `/health` plus `/api` still present in `apps/api/src/app.ts`.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/app.ts apps/api/src/trpc
git commit -m "feat: mount trpc in fastify api"
```

### Task 3: Add the web tRPC provider and render the first query

**Files:**
- Modify: `apps/web/app/root.tsx`
- Modify: `apps/web/app/routes/home.tsx`
- Modify: `apps/web/vite.config.ts`
- Create: `apps/web/app/lib/trpc.ts`
- Create: `apps/web/app/providers/trpc-provider.tsx`

- [ ] **Step 1: Wire the route and app root to future provider modules, and proxy `/trpc` in Vite**

```ts
// apps/web/vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:3001",
      "/health": "http://127.0.0.1:3001",
      "/trpc": "http://127.0.0.1:3001",
    },
  },
});
```

```tsx
// apps/web/app/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";

import type { Route } from "./+types/root";
import { TrpcProvider } from "./providers/trpc-provider";
import "./app.css";

export const links: Route.LinksFunction = () => [
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <TrpcProvider>{children}</TrpcProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return (
    <main className="shell shell--fallback">
      <div className="panel">
        <p className="eyebrow">ovu</p>
        <h1>Preparing the workspace...</h1>
        <p>The frontend shell is loading.</p>
      </div>
    </main>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="shell shell--fallback">
      <div className="panel panel--error">
        <p className="eyebrow">ovu</p>
        <h1>{message}</h1>
        <p>{details}</p>
      </div>
      {stack && (
        <pre className="stacktrace">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
```

```tsx
// apps/web/app/routes/home.tsx
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/lib/trpc";

export function meta() {
  return [
    { title: "ovu workspace" },
    { name: "description", content: "Monorepo foundation for the ovu MVP." },
  ];
}

export default function Home() {
  const trpc = useTRPC();
  const systemStatusQuery = useQuery(trpc.system.status.queryOptions());

  return (
    <main className="shell">
      <section className="hero panel">
        <div>
          <p className="eyebrow">ovu MVP</p>
          <h1>Monorepo foundation is in place.</h1>
          <p className="lede">
            This React Router app shares one pnpm workspace with the Fastify API
            and a worker stub so the next MVP slices can focus on product
            behavior instead of setup churn.
          </p>
        </div>

        <div className="status-grid" aria-label="Workspace services">
          <article>
            <span>Web</span>
            <strong>React Router Framework Mode</strong>
            <p>SPA-oriented shell running on port 5173.</p>
          </article>
          <article>
            <span>API</span>
            <strong>Fastify</strong>
            <p>Health endpoint and API bootstrap running on port 3001.</p>
          </article>
          <article>
            <span>API transport</span>
            <strong>
              {systemStatusQuery.data?.transport === "trpc"
                ? "tRPC connected"
                : "Connecting..."}
            </strong>
            <p>
              {systemStatusQuery.isPending
                ? "Waiting for the first typed query."
                : systemStatusQuery.isError
                  ? `Request failed: ${systemStatusQuery.error.message}`
                  : `${systemStatusQuery.data.message} (${systemStatusQuery.data.requestId})`}
            </p>
          </article>
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <p className="eyebrow">Run locally</p>
          <h2>One command starts the product surface.</h2>
          <ul className="command-list">
            <li>
              <code>mise install</code>
            </li>
            <li>
              <code>pnpm install</code>
            </li>
            <li>
              <code>pnpm dev</code>
            </li>
          </ul>
        </article>

        <article className="panel">
          <p className="eyebrow">Next slices</p>
          <h2>Ready for auth, board data, and execution flow.</h2>
          <p>
            The workspace already separates frontend, backend, and worker
            boundaries, now with a typed tRPC boundary for new web-facing API
            work.
          </p>
        </article>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Run the web typecheck and confirm the provider modules are still missing**

Run: `pnpm --filter @ovu/web typecheck`

Expected: FAIL with module resolution errors for `./providers/trpc-provider` or `~/lib/trpc` because the route and root now depend on the tRPC client layer.

- [ ] **Step 3: Implement the shared web tRPC client and provider**

```ts
// apps/web/app/lib/trpc.ts
import { createTRPCContext } from "@trpc/tanstack-react-query";

import type { AppRouter } from "@ovu/trpc";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
```

```tsx
// apps/web/app/providers/trpc-provider.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useState } from "react";

import type { AppRouter } from "@ovu/trpc";
import { TRPCProvider } from "~/lib/trpc";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}

function getTrpcUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/trpc`;
  }

  return "http://127.0.0.1:5173/trpc";
}

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getTrpcUrl(),
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: Re-run the web typecheck**

Run: `pnpm --filter @ovu/web typecheck`

Expected: PASS with the home route compiling against the shared `AppRouter` type and the new provider modules.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/root.tsx apps/web/app/routes/home.tsx apps/web/app/lib/trpc.ts apps/web/app/providers/trpc-provider.tsx apps/web/vite.config.ts
git commit -m "feat: add trpc client to web app"
```

### Task 4: Update docs and verify the whole integration

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/api-design.md`

- [ ] **Step 1: Update the architecture and API docs to describe the new boundary**

```md
<!-- docs/architecture.md -->
### Backend API

The backend API serves the frontend and enforces application rules. It hosts two HTTP-facing boundaries:

- a typed tRPC boundary at `/trpc` for the React Router web app;
- plain HTTP endpoints such as `/health` and selected external integration surfaces.

The backend remains responsible for authentication, workflow rules, CRUD operations, retry actions, and publishing domain events. The web app should treat tRPC as its default application API boundary, while plain HTTP endpoints remain available for operational and non-UI integration use cases.
```

```md
<!-- docs/api-design.md -->
## API Conventions

### Base Paths

- application-facing web API path: `/trpc`;
- public HTTP API base path: `/api`;
- operational health path: `/health`.

The REST-style contract in this document continues to describe the conceptual public HTTP interface for external or non-UI integrations. The React Router web app should prefer typed tRPC procedures for frontend-backend interaction, and future product-facing web calls should default to `/trpc` unless there is a specific reason to expose a plain HTTP endpoint.
```

- [ ] **Step 2: Run the repo-wide typecheck**

Run: `pnpm typecheck`

Expected: PASS across `@ovu/trpc`, `@ovu/api`, `@ovu/web`, and any unaffected workspace packages.

- [ ] **Step 3: Run the app locally and verify the visible round trip**

Run: `pnpm dev`

Expected: the API starts on `3001`, the web app starts on `5173`, and visiting `http://127.0.0.1:5173` shows the home page with an `API transport` card that resolves to `tRPC connected` plus the backend message instead of a loading or error state.

- [ ] **Step 4: Commit**

```bash
git add docs/architecture.md docs/api-design.md
git commit -m "docs: describe trpc as the web api boundary"
```

## Self-Review

- Spec coverage: Task 2 covers Fastify `/trpc` integration and preserves `/health`; Task 3 covers the shared web client and visible typed procedure; Task 1 ensures `AppRouter` is shared without duplicate request or response types; Task 4 updates docs and runs repo-wide verification.
- Placeholder scan: no placeholder markers or deferred implementation language remain in the plan.
- Type consistency: the plan uses one shared `TrpcContext`, one `appRouter`, one exported `AppRouter`, one `system.status` query, and one `TrpcProvider` naming scheme across all tasks.
