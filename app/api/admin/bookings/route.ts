import { NextResponse } from "next/server";
import { expireStalePendingPayments } from "@/lib/server/expireBookings";
import { log } from "@/lib/server/log";
import { isBranchId } from "@/lib/branches";
import { isOwner, sameOrigin, unauthorized } from "@/lib/server/adminAuth";
import { parseBookingInput } from "@/lib/server/bookingInput";
import { readJson } from "@/lib/server/rateLimit";
import { makeReference } from "@/lib/server/reference";
import { db, type BookingRow, type PaymentRow } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The owner's booking board. ?branch=sangli|karad|all &from=YYYY-MM-DD &to=YYYY-MM-DD */
export async function GET(request: Request) {
  if (!(await isOwner())) return unauthorized();

  const url = new URL(request.url);
  const branch = url.searchParams.get("branch") ?? "all";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let supabase;
  try {
    supabase = db();
  } catch (error) {
    log.error("admin.bookings.db_unavailable", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }

  try {
    await expireStalePendingPayments();
  } catch (error) {
    // The board still loads; stale requests just stay pending until next time.
    log.error("admin.bookings.expire_failed", error);
  }

  let query = supabase
    .from("bookings")
    .select("*, payments(razorpay_order_id, razorpay_payment_id, amount_paise, status, method, updated_at)")
    .order("booking_date", { ascending: true })
    .order("slot_time", { ascending: true })
    .limit(2000);

  if (isBranchId(branch)) query = query.eq("branch", branch);
  if (from && ISO_DATE.test(from)) query = query.gte("booking_date", from);
  if (to && ISO_DATE.test(to)) query = query.lte("booking_date", to);

  const { data, error } = await query;
  if (error) {
    log.error("admin.bookings.query_failed", new Error(error.code));
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, bookings: data as (BookingRow & { payments: Partial<PaymentRow>[] })[] },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * The owner enters a booking taken by phone or at the desk. Same checks as a
 * guest booking (menu price, branch hours, room capacity), but it is saved as
 * confirmed and pay-at-spa, and a walk-in may take a slot already under way.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  if (!(await isOwner())) return unauthorized();

  let raw: unknown;
  try {
    raw = await readJson(request);
  } catch {
    return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
  }

  const parsed = parseBookingInput({ ...(raw as object), paymentMode: "at_spa" }, { byOwner: true });
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  const input = parsed.value;

  try {
    const supabase = db();
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          reference: makeReference(input.branch),
          branch: input.branch,
          therapy_id: input.therapyId,
          therapy_title: input.therapyTitle,
          minutes: input.minutes,
          booking_date: input.date,
          slot_time: input.slot,
          guest_name: input.name,
          guest_phone: input.phone,
          guest_email: input.email,
          notes: input.notes,
          therapist_pref: input.therapistPref,
          amount_inr: input.amountInr,
          payment_mode: "at_spa",
          status: "confirmed",
        })
        .select("reference")
        .single();
      if (!error) {
        log.info("booking.created_by_owner", { reference: data.reference, branch: input.branch });
        return NextResponse.json({ ok: true, reference: data.reference });
      }
      if (error.message === "SLOT_FULL") return NextResponse.json({ ok: false, error: "SLOT_FULL" }, { status: 409 });
      if (error.code !== "23505") throw new Error(`insert failed: ${error.code}`);
    }
    throw new Error("could not allocate a reference");
  } catch (error) {
    log.error("admin.booking_create_failed", error, { branch: input.branch });
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
