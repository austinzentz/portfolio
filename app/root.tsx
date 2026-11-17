import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "react-router";

import type { Route } from "./+types/root";
import { site } from "./lib/site";
import "./app.css";

export const links: Route.LinksFunction = () => [
  // SVG for modern browsers (it switches colors in dark mode); .ico and PNG as fallbacks.
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "alternate", type: "application/rss+xml", title: `${site.name} — Writing`, href: "/rss.xml" },
];

export const meta: Route.MetaFunction = () => [
  { title: site.name },
  { name: "description", content: site.description },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fbfaf7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#151513" media="(prefers-color-scheme: dark)" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-dvh bg-bg text-fg">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const navClass = ({ isActive }: { isActive: boolean }) => `hover:text-fg ${isActive ? "text-fg" : "text-muted"}`;

/**
 * Pages are a narrow reading column by default, under the site header.
 * A route can opt into a wide, app-style page instead:
 *   export const handle = { layout: "wide", parent: { to: "/sandbox", label: "Sandbox" } } satisfies RouteHandle;
 * Wide pages swap the header for a compact bar (logo / parent section) that spans the page,
 * so the change reads as "you're inside a tool" rather than the header shifting position.
 */
export type RouteHandle = { layout?: "wide"; parent?: { to: string; label: string } };

function useWideHandle() {
  const matches = useMatches();
  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i].handle as RouteHandle | undefined;
    if (handle?.layout === "wide") return handle;
  }
  return null;
}

function Shell({ children }: { children: React.ReactNode }) {
  const wide = useWideHandle();
  const frame = wide ? "max-w-6xl" : "max-w-[42rem]";
  return (
    <div className="flex min-h-dvh flex-col px-5 sm:px-6">
      {wide ? (
        <header className="-mx-5 mb-8 border-b border-rule px-5 sm:-mx-6 sm:mb-10 sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl items-baseline gap-2 py-3.5 text-sm">
            <Link to="/" className="font-serif text-base font-medium tracking-tight no-underline">
              {site.name}
            </Link>
            {wide.parent && (
              <>
                <span aria-hidden className="text-rule">
                  /
                </span>
                <Link to={wide.parent.to} className="text-muted hover:text-fg">
                  {wide.parent.label}
                </Link>
              </>
            )}
          </div>
        </header>
      ) : (
        <header className="mx-auto flex w-full max-w-[42rem] items-baseline justify-between gap-4 py-8 sm:py-10">
          <Link to="/" className="font-serif text-xl font-medium tracking-tight no-underline">
            {site.name}
          </Link>
          <nav className="flex gap-5 text-sm">
            <NavLink to="/posts" className={navClass}>
              Writing
            </NavLink>
            <NavLink to="/sandbox" className={navClass}>
              Sandbox
            </NavLink>
          </nav>
        </header>
      )}
      <main className={`mx-auto w-full flex-1 pb-16 ${frame}`}>{children}</main>
      <footer
        className={`mx-auto flex w-full flex-wrap justify-between gap-2 border-t border-rule py-8 text-sm text-muted ${frame}`}
      >
        <a href={`mailto:${site.email}`} className="hover:text-fg">
          {site.email}
        </a>
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let heading = "Something went wrong";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    heading = error.status === 404 ? "Page not found" : `${error.status} error`;
    details =
      error.status === 404
        ? "There's nothing at this address."
        : typeof error.data === "string"
          ? error.data
          : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Shell>
      <title>{`${heading} · ${site.name}`}</title>
      <h1 className="font-serif text-3xl font-medium tracking-tight">{heading}</h1>
      <p className="mt-3 text-muted">{details}</p>
      <p className="mt-6">
        <Link to="/" className="text-accent underline">
          Go to the home page
        </Link>
      </p>
      {stack && (
        <pre className="mt-6 overflow-x-auto rounded-md bg-surface p-4 text-xs">
          <code>{stack}</code>
        </pre>
      )}
    </Shell>
  );
}
