import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy } from "@/lib/csp";
import { SESSION_COOKIE, isActiveSessionToken } from "@/lib/server/session";

/** Lets the request through with a fresh script nonce for this page load. */
function pass(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

/**
 * Sets the CSP on every page, and is the front gate for everything owner-only.
 * The admin route handlers check the session again themselves — this is the
 * first lock, not the only one.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ownerOnly = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!ownerOnly || pathname === "/admin/login" || pathname === "/api/admin/login") {
    return pass(request);
  }

  if (await isActiveSessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return pass(request);
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const login = new URL("/admin/login", request.url);
  return NextResponse.redirect(login);
}

export const config = {
  // Pages and owner APIs; not static files or the public JSON APIs.
  matcher: ["/((?!_next/static|_next/image|frames/|images/|audio/|video/|logo.png|favicon|robots.txt|sitemap.xml|api/(?!admin)).*)"],
};
