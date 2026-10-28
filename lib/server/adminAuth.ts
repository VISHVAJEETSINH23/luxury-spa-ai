import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, isActiveSessionToken } from "@/lib/server/session";

/** True when the request carries a valid, not-logged-out owner session cookie. */
export async function isOwner(): Promise<boolean> {
  const store = await cookies();
  return isActiveSessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Cross-site request guard for state-changing admin calls. The cookie is
 * SameSite=Strict already; this is the second lock.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export function unauthorized() {
  return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
}
