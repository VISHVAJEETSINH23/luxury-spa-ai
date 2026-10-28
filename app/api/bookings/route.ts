import { randomBytes } from "node:crypto";
import { log } from "@/lib/server/log";
import { NextResponse } from "next/server";
import { BRANCHES, type BranchId } from "@/lib/branches";
import { parseBookingInput } from "@/lib/server/bookingInput";
import { createOrder, onlinePaymentAvailable, publicKeyId } from "@/lib/server/razorpay";
import { allow, clientIp, readJson } from "@/lib/server/rateLimit";
import { db } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Open requests one phone number may have at a time. */
const MAX_OPEN_PER_PHONE = 3;

function makeReference(branch: BranchId): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let tail = "";
  for (const byte of bytes) tail += alphabet[byte % alphabet.length];
  return `${BRANCHES[branch].refPrefix}-${tail}`;
}

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** A guest books a slot. The only public write into the bookings table. */
export async function POST(request: Request) {
  if (!(await allow(`booking:${clientIp(request)}`, 10, 10 * 60_000))) return fail("TOO_MANY_REQUESTS", 429);

  let raw: unknown;
  try {
    raw = await readJson(request);
  } catch {
    return fail("BAD_REQUEST");
  }

  const parsed = parseBookingInput(raw);
  if (!parsed.ok) return fail(parsed.error);
  const input = parsed.value;

  if (input.paymentMode === "online" && !onlinePaymentAvailable(input.branch)) {
    return fail("ONLINE_PAYMENT_UNAVAILABLE", 409);
  }

  try {
    const supabase = db();

    // One phone can't flood the board with requests nobody intends to keep.
    const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
    const { count, error: countError } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("guest_phone", input.phone)
      .in("status", ["pending_payment", "pending_confirmation"])
      .gte("created_at", since);
    if (countError) throw new Error(`count failed: ${countError.code}`);
    if ((count ?? 0) >= MAX_OPEN_PER_PHONE) return fail("TOO_MANY_OPEN_BOOKINGS", 429);

    let booking: { id: string; reference: string } | null = null;
    for (let attempt = 0; attempt < 3 && !booking; attempt++) {
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
          payment_mode: input.paymentMode,
          status: input.paymentMode === "online" ? "pending_payment" : "pending_confirmation",
        })
        .select("id, reference")
        .single();
      if (!error) booking = data;
      else if (error.message === "SLOT_FULL") return fail("SLOT_FULL", 409);
      else if (error.code !== "23505") throw new Error(`insert failed: ${error.code}`);
    }
    if (!booking) throw new Error("could not allocate a reference");
    log.info("booking.created", { reference: booking.reference, branch: input.branch, paymentMode: input.paymentMode });

    if (input.paymentMode === "at_spa") {
      return NextResponse.json({
        ok: true,
        reference: booking.reference,
        status: "pending_confirmation",
        amountInr: input.amountInr,
      });
    }

    // Online: open a Razorpay order on this branch's account.
    const amountPaise = input.amountInr * 100;
    let orderId: string;
    try {
      const order = await createOrder(input.branch, amountPaise, booking.reference, {
        reference: booking.reference,
        branch: input.branch,
      });
      orderId = order.id;
      const { error: paymentError } = await supabase.from("payments").insert({
        booking_id: booking.id,
        branch: input.branch,
        razorpay_order_id: orderId,
        amount_paise: amountPaise,
      });
      if (paymentError) throw new Error(`payment insert failed: ${paymentError.code}`);
    } catch (error) {
      await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
      log.error("booking.order_failed", error, { reference: booking.reference, branch: input.branch });
      return fail("PAYMENT_START_FAILED", 502);
    }

    return NextResponse.json({
      ok: true,
      reference: booking.reference,
      status: "pending_payment",
      amountInr: input.amountInr,
      payment: {
        keyId: publicKeyId(input.branch),
        orderId,
        amountPaise,
        currency: "INR",
        name: BRANCHES[input.branch].name,
        description: `${input.therapyTitle} · ${input.minutes} min`,
        prefill: { name: input.name, contact: `+91${input.phone}`, email: input.email ?? undefined },
      },
    });
  } catch (error) {
    log.error("booking.failed", error, { branch: input.branch });
    return fail("SERVER_ERROR", 500);
  }
}
