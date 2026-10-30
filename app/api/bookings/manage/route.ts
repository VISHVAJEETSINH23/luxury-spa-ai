import { NextResponse } from "next/server";
import { log } from "@/lib/server/log";
import { guestCancelRule } from "@/lib/server/guestBooking";
import { allow, clientIp, readJson } from "@/lib/server/rateLimit";
import { db, type BookingRow } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

type Row = Pick<
  BookingRow,
  | "id"
  | "reference"
  | "branch"
  | "therapy_title"
  | "minutes"
  | "booking_date"
  | "slot_time"
  | "guest_name"
  | "amount_inr"
  | "payment_mode"
  | "status"
> & { payments: { status: string }[] };

/** What a guest is shown about their own booking — nothing the owner wrote. */
function view(b: Row) {
  const rule = guestCancelRule(b);
  return {
    reference: b.reference,
    branch: b.branch,
    therapyTitle: b.therapy_title,
    minutes: b.minutes,
    date: b.booking_date,
    slot: b.slot_time.slice(0, 5),
    name: b.guest_name,
    amountInr: b.amount_inr,
    paymentMode: b.payment_mode,
    paid: b.payments.some((p) => p.status === "captured"),
    status: b.status,
    canCancel: rule.ok,
    cancelBlockedBy: rule.ok ? null : rule.reason,
  };
}

/**
 * A guest looks up — and may cancel — their own booking with its reference
 * and the mobile number it was made with. Both must match; a wrong pair gets
 * the same NOT_FOUND as a missing one, and the IP limit keeps guessing slow.
 *
 * { action: "view" | "cancel", reference, phone }
 */
export async function POST(request: Request) {
  if (!(await allow(`manage:${clientIp(request)}`, 10, 10 * 60_000))) return fail("TOO_MANY_REQUESTS", 429);

  let body: Record<string, unknown>;
  try {
    body = (await readJson(request, 512)) as Record<string, unknown>;
  } catch {
    return fail("BAD_REQUEST");
  }

  const action = body.action === "cancel" ? "cancel" : "view";
  const reference = typeof body.reference === "string" ? body.reference.trim().toUpperCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "") : "";
  if (!/^[A-Z]{3}-[A-Z0-9]{6}$/.test(reference) || !/^[6-9]\d{9}$/.test(phone)) return fail("NOT_FOUND", 404);

  try {
    const supabase = db();
    const { data, error } = await supabase
      .from("bookings")
      .select("id, reference, branch, therapy_title, minutes, booking_date, slot_time, guest_name, amount_inr, payment_mode, status, payments(status)")
      .eq("reference", reference)
      .eq("guest_phone", phone)
      .maybeSingle<Row>();
    if (error) throw new Error(`lookup failed: ${error.code}`);
    if (!data) return fail("NOT_FOUND", 404);

    if (action === "view") return NextResponse.json({ ok: true, booking: view(data) });

    const rule = guestCancelRule(data);
    if (!rule.ok) return fail(rule.reason, 409);

    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .eq("status", data.status)
      .select("status")
      .maybeSingle();
    if (updateError) throw new Error(`cancel failed: ${updateError.code}`);
    if (!updated) return fail("CHANGED_MEANWHILE", 409);

    log.info("booking.cancelled_by_guest", { reference, branch: data.branch });

    return NextResponse.json({ ok: true, booking: view({ ...data, status: "cancelled" }) });
  } catch (error) {
    log.error("booking.manage_failed", error, { action });
    return fail("SERVER_ERROR", 500);
  }
}
