import { NextResponse } from "next/server";
import { log } from "@/lib/server/log";
import { MAX_DAYS_AHEAD, SLOT_TIMES, slotFits, type BranchId } from "@/lib/branches";
import { isOwner, sameOrigin, unauthorized } from "@/lib/server/adminAuth";
import { indiaNow } from "@/lib/server/bookingInput";
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

/** Bookings that can be moved to another date or time. */
const MOVABLE: Status[] = ["pending_confirmation", "confirmed"];

function reply(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The owner changes a booking: `{ status }` to confirm, complete or cancel it,
 * or `{ date, slot }` to move it. A move goes through the same room-capacity
 * trigger as a new booking.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  if (!sameOrigin(request)) return reply("FORBIDDEN", 403);
  if (!(await isOwner())) return unauthorized();

  const { reference } = await params;
  if (!/^[A-Z]{3}-[A-Z0-9]{6}$/.test(reference)) return reply("UNKNOWN_BOOKING", 404);

  let body: { status?: unknown; date?: unknown; slot?: unknown };
  try {
    body = (await readJson(request, 512)) as typeof body;
  } catch {
    return reply("BAD_REQUEST", 400);
  }

  let supabase;
  try {
    supabase = db();
  } catch (error) {
    log.error("admin.booking_update.db_unavailable", error);
    return reply("SERVER_ERROR", 500);
  }
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, status, branch, minutes")
    .eq("reference", reference)
    .maybeSingle<{ id: string; status: Status; branch: BranchId; minutes: number }>();
  if (error) return reply("SERVER_ERROR", 500);
  if (!booking) return reply("UNKNOWN_BOOKING", 404);

  let changes: Partial<BookingRow>;
  if (body.date !== undefined || body.slot !== undefined) {
    const today = indiaNow().date;
    const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;
    if (!date || date < today || date > addDays(today, MAX_DAYS_AHEAD)) return reply("INVALID_DATE", 400);
    const slot = typeof body.slot === "string" && SLOT_TIMES.includes(body.slot) ? body.slot : null;
    if (!slot || !slotFits(slot, booking.minutes, booking.branch)) return reply("INVALID_SLOT", 400);
    if (!MOVABLE.includes(booking.status)) return reply("INVALID_TRANSITION", 409);
    changes = { booking_date: date, slot_time: slot };
  } else {
    const next = body.status as Status;
    if (!ALLOWED[booking.status]?.includes(next)) return reply("INVALID_TRANSITION", 409);
    changes = { status: next };
  }

  // Conditional on the status we just read, so two tabs can't trample each other.
  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update(changes)
    .eq("id", booking.id)
    .eq("status", booking.status)
    .select("status, booking_date, slot_time")
    .maybeSingle();
  if (updateError?.message === "SLOT_FULL") return reply("SLOT_FULL", 409);
  if (updateError) return reply("SERVER_ERROR", 500);
  if (!updated) return reply("CHANGED_MEANWHILE", 409);

  if (changes.booking_date) log.info("booking.moved_by_owner", { reference, branch: booking.branch });
  return NextResponse.json({ ok: true, status: updated.status, date: updated.booking_date, slot: updated.slot_time });
}
