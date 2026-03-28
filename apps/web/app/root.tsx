import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { TrpcProvider } from "./providers/trpc-provider";

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
        {children}
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
  return (
    <TrpcProvider>
      <Outlet />
    </TrpcProvider>
  );
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
