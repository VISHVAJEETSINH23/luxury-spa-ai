import { NextResponse } from "next/server";
import { MAX_DAYS_AHEAD, isBranchId } from "@/lib/branches";
import { fullSlotsOn } from "@/lib/server/availability";
import { indiaNow } from "@/lib/server/bookingInput";
import { log } from "@/lib/server/log";
import { allow, clientIp } from "@/lib/server/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Which start times are already full, so the booking form can grey them out
 * before the guest fills in their details. ?branch=&date=YYYY-MM-DD&minutes=
 * Says only "full" — never who booked or how many.
 */
export async function GET(request: Request) {
  if (!(await allow(`availability:${clientIp(request)}`, 60, 10 * 60_000))) {
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  }

  const url = new URL(request.url);
  const branch = url.searchParams.get("branch");
  const date = url.searchParams.get("date") ?? "";
  const minutes = Number(url.searchParams.get("minutes"));
  const today = indiaNow().date;
  if (
    !isBranchId(branch) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    date < today ||
    date > addDays(today, MAX_DAYS_AHEAD) ||
    !Number.isInteger(minutes) ||
    minutes < 10 ||
    minutes > 300
  ) {
    return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    return NextResponse.json({ ok: true, full: await fullSlotsOn(branch, date, minutes) });
  } catch (error) {
    log.error("availability.failed", error, { branch });
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
