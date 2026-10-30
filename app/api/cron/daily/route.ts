import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { indiaNow } from "@/lib/server/bookingInput";
import { expireStalePendingPayments } from "@/lib/server/expireBookings";
import { log } from "@/lib/server/log";
import { removeOldGuestDetails } from "@/lib/server/retention";

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

/** Once a day: cancel unpaid online bookings, and remove old guests' details. */
export async function GET(request: Request) {
  if (!authorized(request)) return new NextResponse(null, { status: 401 });
  try {
    const expired = await expireStalePendingPayments();
    const anonymised = await removeOldGuestDetails(indiaNow().date);
    return NextResponse.json({ ok: true, expired, anonymised });
  } catch (error) {
    log.error("cron.daily_failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
