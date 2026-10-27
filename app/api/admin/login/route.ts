import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/server/adminAuth";
import { allow, clientIp, readJson } from "@/lib/server/rateLimit";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions, verifyOwnerPassword } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  // 5 tries per 15 minutes per address.
  if (!allow(`login:${clientIp(request)}`, 5, 15 * 60_000)) {
    return NextResponse.json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, { status: 429 });
  }

  let password = "";
  try {
    const body = (await readJson(request, 1_024)) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
  }

  if (!password || !verifyOwnerPassword(password)) {
    // Slow every wrong guess down.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.json({ ok: false, error: "WRONG_PASSWORD" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions());
  return response;
}
