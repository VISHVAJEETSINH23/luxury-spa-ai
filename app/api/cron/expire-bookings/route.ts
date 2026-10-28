import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { expireStalePendingPayments } from "@/lib/server/expireBookings";
import { log } from "@/lib/server/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vercel Cron calls this with "Authorization: Bearer $CRON_SECRET". */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
  if (!authorized(request)) return new NextResponse(null, { status: 401 });
  try {
    const expired = await expireStalePendingPayments();
    return NextResponse.json({ ok: true, expired });
  } catch (error) {
    log.error("cron.expire_failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
