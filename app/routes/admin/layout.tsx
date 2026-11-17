import { Link, Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { adminContext, requireAdmin } from "~/lib/auth.server";

export const middleware: Route.MiddlewareFunction[] = [requireAdmin];

export const meta: Route.MetaFunction = () => [{ name: "robots", content: "noindex, nofollow" }];

export function loader({ context }: Route.LoaderArgs) {
  return { admin: context.get(adminContext) };
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="font-sans">
      <div className="mb-8 flex items-center justify-between rounded-md border border-rule bg-surface px-4 py-2 text-sm">
        <Link to="/admin" className="font-medium">
          Admin
        </Link>
        <span className="text-muted">{loaderData.admin?.email}</span>
      </div>
      <Outlet />
    </div>
  );
}
