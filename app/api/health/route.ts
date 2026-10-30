import { NextResponse } from "next/server";
import { log } from "@/lib/server/log";
import { allow, clientIp } from "@/lib/server/rateLimit";
import { db } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * For the uptime monitor: 200 when the site can reach its database, 503 when
 * it can't. Says nothing else — no versions, no row counts.
 */
export async function GET(request: Request) {
  if (!(await allow(`health:${clientIp(request)}`, 30, 60_000))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const { error } = await db().from("bookings").select("id", { head: true }).limit(1);
    if (error) throw new Error(`health query failed: ${error.code}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error("health.db_unreachable", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
