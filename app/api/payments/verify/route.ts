import { NextResponse } from "next/server";
import { recordCapturedPayment, findPaymentByOrder } from "@/lib/server/payments";
import { fetchCapturedPayment, verifyCheckoutSignature } from "@/lib/server/razorpay";
import { allow, clientIp, readJson } from "@/lib/server/rateLimit";
import { db } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/**
 * The browser reports a finished Checkout. We trust none of it on its own:
 * the signature must match this branch's secret, and Razorpay itself must say
 * the payment is captured, for this order, for the full amount.
 */
export async function POST(request: Request) {
  if (!allow(`verify:${clientIp(request)}`, 20, 10 * 60_000)) return fail("TOO_MANY_REQUESTS", 429);

  let body: Record<string, unknown>;
  try {
    body = (await readJson(request, 2_048)) as Record<string, unknown>;
  } catch {
    return fail("BAD_REQUEST");
  }

  const reference = typeof body.reference === "string" ? body.reference : "";
  const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
  if (!reference || !/^order_\w+$/.test(orderId) || !/^pay_\w+$/.test(paymentId) || !signature) {
    return fail("BAD_REQUEST");
  }

  try {
    const payment = await findPaymentByOrder(orderId);
    if (!payment) return fail("UNKNOWN_ORDER", 404);

    const { data: booking } = await db()
      .from("bookings")
      .select("id, reference, status")
      .eq("id", payment.booking_id)
      .single();
    if (!booking || booking.reference !== reference) return fail("UNKNOWN_ORDER", 404);

    if (!verifyCheckoutSignature(payment.branch, orderId, paymentId, signature)) {
      return fail("BAD_SIGNATURE");
    }

    const razorpayPayment = await fetchCapturedPayment(payment.branch, paymentId);
    if (
      razorpayPayment.order_id !== orderId ||
      razorpayPayment.status !== "captured" ||
      razorpayPayment.amount !== payment.amount_paise ||
      razorpayPayment.currency !== "INR"
    ) {
      return fail("PAYMENT_NOT_CAPTURED", 402);
    }

    await recordCapturedPayment(payment, paymentId, razorpayPayment.amount, razorpayPayment.method ?? null);

    const { data: updated } = await db().from("bookings").select("status").eq("id", payment.booking_id).single();
    return NextResponse.json({ ok: true, reference, status: updated?.status ?? "confirmed" });
  } catch (error) {
    console.error("verify: failed", (error as Error).message);
    return fail("SERVER_ERROR", 500);
  }
}
