import type { Route } from "./+types/home";

export function meta() {
  return [
    { title: "ovu workspace" },
    { name: "description", content: "Monorepo foundation for the ovu MVP." },
  ];
}

export default function Home() {
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
          <h2>Ready for auth, board data, and execution flow.</h2>
          <p>
            The workspace already separates frontend, backend, and worker
            boundaries, includes shared TypeScript settings, and proxies API
            traffic during local web development.
          </p>
        </article>
      </section>
    </main>
  );
}
