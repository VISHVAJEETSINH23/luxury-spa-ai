import { NextResponse } from "next/server";
import { log } from "@/lib/server/log";
import { isOwner, sameOrigin, unauthorized } from "@/lib/server/adminAuth";
import { readJson } from "@/lib/server/rateLimit";
import { db, type BookingRow } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Status = BookingRow["status"];

/** Which moves the owner can make from each state. */
const ALLOWED: Record<Status, Status[]> = {
  pending_confirmation: ["confirmed", "cancelled"],
  pending_payment: ["cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function PATCH(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  if (!(await isOwner())) return unauthorized();

  const { reference } = await params;
  if (!/^[A-Z]{3}-[A-Z0-9]{6}$/.test(reference)) {
    return NextResponse.json({ ok: false, error: "UNKNOWN_BOOKING" }, { status: 404 });
  }

  let next: Status;
  try {
    const body = (await readJson(request, 512)) as { status?: unknown };
    next = body.status as Status;
  } catch {
    return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = db();
  } catch (error) {
    log.error("admin.booking_update.db_unavailable", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("reference", reference)
    .maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  if (!booking) return NextResponse.json({ ok: false, error: "UNKNOWN_BOOKING" }, { status: 404 });

  if (!ALLOWED[booking.status as Status]?.includes(next)) {
    return NextResponse.json({ ok: false, error: "INVALID_TRANSITION" }, { status: 409 });
  }

  // Conditional on the status we just read, so two tabs can't trample each other.
  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: next })
    .eq("id", booking.id)
    .eq("status", booking.status)
    .select("status")
    .maybeSingle();
  if (updateError) return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  if (!updated) return NextResponse.json({ ok: false, error: "CHANGED_MEANWHILE" }, { status: 409 });

  return NextResponse.json({ ok: true, status: updated.status });
}
