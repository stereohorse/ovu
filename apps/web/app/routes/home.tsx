import { useQuery } from "@tanstack/react-query";

import type { Route } from "./+types/home";

import { useTRPC } from "~/lib/trpc";

export function meta() {
  return [
    { title: "ovu workspace" },
    { name: "description", content: "Monorepo foundation for the ovu MVP." },
  ];
}

export default function Home() {
  const trpc = useTRPC();
  const systemStatus = useQuery(trpc.system.status.queryOptions());

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
              {systemStatus.isSuccess
                ? systemStatus.data.message
                : systemStatus.isError
                  ? "Connection failed"
                  : "Connecting..."}
            </strong>
            <p>
              {systemStatus.isSuccess
                ? `Request ${systemStatus.data.requestId} served over ${systemStatus.data.transport}.`
                : systemStatus.isError
                  ? "The first typed tRPC query could not reach the API."
                  : "The web app is loading the first typed backend query."}
            </p>
          </article>
          <article>
            <span>Worker</span>
            <strong>Stub package</strong>
            <p>Reserved for orchestration and agent execution slices.</p>
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
          <h2>Ready for typed app queries, auth, and execution flow.</h2>
          <p>
            The workspace now shares a typed tRPC contract between the React
            Router frontend and Fastify API while keeping operational HTTP
            routes available during local development.
          </p>
          {systemStatus.isSuccess ? (
            <p>
              Latest tRPC response at <code>{systemStatus.data.servedAt}</code>.
            </p>
          ) : null}
        </article>
      </section>
    </main>
  );
}
