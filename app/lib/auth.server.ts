import { env } from "cloudflare:workers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { createContext, data, type MiddlewareFunction } from "react-router";

/**
 * /admin is protected twice:
 *  1. Cloudflare Access sits in front of the route and makes you sign in.
 *  2. This middleware verifies the signed JWT Access attaches to every request
 *     (Cf-Access-Jwt-Assertion), so a mis-configured Access policy, or a request
 *     that reaches the Worker another way (e.g. *.workers.dev), still gets refused.
 *
 * Fails closed: if ACCESS_TEAM_DOMAIN / ACCESS_AUD aren't set, nobody gets in.
 * In `npm run dev` the check is skipped so you can work locally.
 */

export type Admin = { email: string };
export const adminContext = createContext<Admin | null>(null);

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

async function verifyAccess(request: Request): Promise<Admin | null> {
  if (import.meta.env.DEV) return { email: "local-dev" };

  const team = (env.ACCESS_TEAM_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const aud = env.ACCESS_AUD;
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!team || !aud || !token) return null;

  const issuer = `https://${team}`;
  jwks ??= createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: aud });
    return { email: typeof payload.email === "string" ? payload.email : "unknown" };
  } catch {
    return null;
  }
}

export const requireAdmin: MiddlewareFunction<Response> = async ({ request, context }) => {
  const admin = await verifyAccess(request);
  if (!admin) throw data("You don't have access to this page.", { status: 403 });

  // Mutations must come from this site's own pages.
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("Origin");
    if (origin !== new URL(request.url).origin) throw data("Bad origin.", { status: 403 });
  }

  context.set(adminContext, admin);
};
