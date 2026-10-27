import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/server/adminAuth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
