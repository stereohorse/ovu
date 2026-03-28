# tRPC Frontend-Backend Design

## Overview

This design introduces tRPC as the primary application-facing contract between the React Router web app and the Fastify API. The goal is to give the frontend end-to-end typed access to backend procedures without maintaining duplicated request and response types across `apps/web` and `apps/api`.

The change is intentionally incremental. Infrastructure-style HTTP routes such as `/health` remain plain Fastify handlers, while product-facing web interactions move to tRPC under a dedicated `/trpc` prefix. The first slice should prove the transport, typing, and provider wiring with one simple query before broader task and board APIs are added.

## Goals

- make the web app treat tRPC as its default application API boundary;
- preserve simple plain-HTTP endpoints for infrastructure and operational checks;
- share one typed router contract between backend and frontend;
- align the implementation with current tRPC v11 guidance for Fastify and React clients;
- keep the adoption path small enough that future product slices can build on it without a large migration upfront.

## Non-Goals

- replacing every documented REST endpoint immediately;
- changing the planned realtime direction from Socket.IO to tRPC subscriptions in this slice;
- introducing auth-specific procedure middleware before the app has real authenticated product flows;
- exposing internal worker or Git-manager operations directly to the web app.

## Current Context

The repository currently has:

- `apps/api` using Fastify v5 with plain routes in `apps/api/src/app.ts`;
- `apps/web` using React Router 7 on Vite with a dev proxy for `/api` and `/health` in `apps/web/vite.config.ts`;
- project documentation that describes a broader REST-style public API in `docs/api-design.md`, even though the runtime code only exposes bootstrap routes today.

Current tRPC documentation changes the preferred frontend recommendation for new React projects. In tRPC v11, the classic `@trpc/react-query` integration remains supported, but new projects are directed to the newer TanStack integration via `@trpc/tanstack-react-query`. The Fastify adapter remains first-class and requires Fastify v5+, which matches the current API package.

## Recommended Approach

Use a hybrid boundary:

1. Keep Fastify as the API host and continue serving plain HTTP infrastructure endpoints such as `/health`.
2. Mount a tRPC adapter under `/trpc` for application-facing procedures.
3. Export the root router type as the shared contract consumed by the web app.
4. Wire the web app to the recommended tRPC v11 TanStack integration.
5. Migrate future web-facing product features to tRPC by default instead of adding new REST handlers.

This approach gives end-to-end typing where it matters most for frontend-backend development, while avoiding unnecessary churn for health checks and other non-UI endpoints.

## Architecture

### Server Boundary

`apps/api` remains the runtime owner of HTTP transport, cookies, CORS, logging, and lifecycle management. It should add a tRPC Fastify plugin registration alongside the existing plain routes.

The backend should:

- create a request-scoped tRPC context from Fastify request and reply objects;
- assemble a root `appRouter` from focused subrouters rather than placing all procedures in one file;
- register `fastifyTRPCPlugin` under `/trpc`;
- set `routerOptions.maxParamLength` on the Fastify server to avoid batch-request path issues documented by tRPC for Fastify.

Plain Fastify endpoints remain appropriate for:

- `/health`;
- future operational or integration endpoints that are not part of the React app's typed application contract.

### Shared Contract Boundary

The tRPC router type should be exported from a shared workspace boundary rather than duplicated in frontend code. The important outcome is that `apps/web` imports `AppRouter` directly from a shared module and never redefines request or response types for tRPC procedures.

The shared boundary should include:

- tRPC initialization helpers that are safe to share across server router files;
- the root router type export;
- shared validators and domain-facing input or output schemas when they are part of the tRPC contract.

The shared boundary should not force the frontend to import server runtime concerns such as Fastify instance creation or plugin registration.

### Frontend Boundary

`apps/web` should own a small API client layer that does three things:

- creates the tRPC client using `@trpc/client`;
- integrates it with TanStack Query using `@trpc/tanstack-react-query`;
- exposes app-level providers near the React root so route modules can consume typed query options or hooks.

The web app should stop thinking in terms of ad hoc `fetch` wrappers for application data. Instead, route modules and components should call typed procedures through the shared tRPC client layer.

### First Procedure

The first end-to-end tRPC procedure should be intentionally small, such as `system.status` or `system.hello`.

It should prove:

- Fastify adapter registration works;
- request context creation works;
- the web app provider setup works;
- typed procedure input and output flow from API to UI without duplicated interfaces;
- the dev proxy and local development flow support `/trpc` calls correctly.

The first procedure should not attempt to model the full task domain. It is a transport-validation slice, not a feature-complete API migration.

## Request Flow

The new request path should be:

1. a React Router route component or child component requests data through the shared tRPC client layer;
2. the tRPC TanStack integration constructs the query or mutation request;
3. the request is sent to `/trpc` through the web app's configured link;
4. Fastify routes the request through the tRPC plugin;
5. the procedure executes against the request-scoped context and returns typed data;
6. the typed result is cached and exposed back to the UI through TanStack Query.

This keeps the backend as the source of truth while allowing the frontend to consume procedure results without manually synchronizing TypeScript shapes.

## Error Handling

Error handling should stay split by boundary:

- infrastructure routes use plain HTTP responses appropriate to their operational purpose;
- tRPC procedures use tRPC's structured error handling model.

The first iteration should avoid elaborate custom error formatting. A minimal setup is enough as long as:

- server errors are logged at the API layer;
- tRPC errors are surfaced consistently to the frontend;
- the context and router structure leave room for future auth, validation, and domain-specific error mapping.

This is intentionally conservative because the current codebase does not yet have rich domain flows that justify a more complex shared error envelope inside tRPC.

## Documentation Impact

The repo documentation should be updated to reflect a deliberate distinction between two external interfaces:

- tRPC is now the primary application API used by the web app;
- plain HTTP endpoints remain available for infrastructure checks and selected non-UI integrations.

Specifically:

- `docs/architecture.md` should describe the backend API as hosting both the tRPC app boundary and plain operational endpoints;
- `docs/api-design.md` should clarify that its REST-style resource contract is the conceptual public API model for external HTTP surfaces, while the web app's implementation boundary now prefers tRPC for frontend-backend interaction.

This prevents the documentation from implying that every future web-facing feature must be implemented as a hand-written REST endpoint.

## Migration Strategy

Adoption should proceed in small steps:

1. add shared tRPC dependencies and server wiring;
2. expose one simple query procedure from the API;
3. add the tRPC TanStack provider setup in the web app;
4. render the first procedure result in the UI so the integration is visible and testable;
5. treat tRPC as the default boundary for future product-facing frontend work.

The existing `/api` bootstrap route can remain during transition if it is still useful, but new web-facing app behavior should prefer `/trpc` rather than expanding the plain REST surface.

This keeps the migration incremental and avoids prematurely rewriting the broader documented API before the real task and board features exist.

## Testing and Verification

Normal development workflows should verify the new boundary.

Required verification:

- repo `typecheck` catches router-type drift between backend and frontend packages;
- the API package typechecks with the new tRPC and context wiring;
- the web package typechecks with the new providers and typed procedure usage;
- a visible frontend render proves one successful browser-facing round trip over `/trpc`.

If test coverage is introduced later, it should preserve the same intent: validate both server registration and frontend consumption, not just isolated helper functions.

## File and Module Direction

The exact filenames can follow repo conventions, but responsibilities should be separated roughly as follows:

- API server bootstrap file: Fastify instance options, plain route registration, plugin wiring;
- tRPC context file: request-scoped context creation for Fastify requests;
- tRPC router module or modules: procedure definitions grouped by concern;
- shared contract export: `AppRouter` type and any shared tRPC helpers;
- web client module: tRPC client creation and link configuration;
- web provider module: QueryClient and tRPC provider setup;
- route component: initial visible consumer of one typed procedure.

These boundaries keep runtime hosting concerns, transport concerns, and UI concerns separate while still sharing the router contract.

## Trade-Offs and Rationale

### Why not keep REST as the primary app contract?

The current codebase is early enough that introducing tRPC now avoids building and maintaining duplicated types as real task and board features arrive. Using REST as the primary frontend boundary would preserve a broader conceptual public API, but it would not deliver the main reason for introducing tRPC: faster and safer iteration between `apps/api` and `apps/web`.

### Why not replace all HTTP endpoints immediately?

Some endpoints are better expressed as plain HTTP routes because they are operational, infrastructural, or potentially useful outside the typed web app boundary. Replacing those endpoints would add churn without a meaningful developer-experience gain.

### Why not start with subscriptions?

The project architecture already points toward Socket.IO for realtime UI synchronization. Starting with tRPC subscriptions would complicate the first slice and blur the planned realtime direction before the basic typed request-response boundary is proven.

## Final Decision

Adopt tRPC incrementally as the primary application-facing API for the React Router frontend, using:

- Fastify + `@trpc/server` on the backend;
- `@trpc/client` + `@trpc/tanstack-react-query` on the frontend;
- a shared exported `AppRouter` contract between API and web;
- plain Fastify routes retained for `/health` and similar operational endpoints.

This gives the project a clear typed frontend-backend boundary now, without overcommitting to a full API migration before richer product features exist.
