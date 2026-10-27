import "server-only";

import { db, type PaymentRow } from "@/lib/server/supabase";

/**
 * Marking a payment as received. Called from two places that can race —
 * the browser's verify call and Razorpay's webhook — so every write is
 * conditional and running it twice changes nothing.
 */
export async function recordCapturedPayment(
  payment: PaymentRow,
  razorpayPaymentId: string,
  amountPaise: number,
  method: string | null
): Promise<void> {
  if (amountPaise !== payment.amount_paise) {
    throw new Error(`Amount mismatch on order ${payment.razorpay_order_id}`);
  }

  const supabase = db();

  if (payment.status !== "captured") {
    const { error } = await supabase
      .from("payments")
      .update({ status: "captured", razorpay_payment_id: razorpayPaymentId, method })
      .eq("id", payment.id)
      .neq("status", "captured");
    if (error) throw new Error(`payments update failed: ${error.code}`);
  }

  // A paid booking is confirmed — unless the owner already cancelled it, in
  // which case it stays cancelled and shows up as "paid, refund due".
  const { error: bookingError } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", payment.booking_id)
    .eq("status", "pending_payment");
  if (bookingError) throw new Error(`bookings update failed: ${bookingError.code}`);
}

export async function findPaymentByOrder(orderId: string): Promise<PaymentRow | null> {
  const { data, error } = await db()
    .from("payments")
    .select("*")
    .eq("razorpay_order_id", orderId)
    .maybeSingle<PaymentRow>();
  if (error) throw new Error(`payments lookup failed: ${error.code}`);
  return data;
}
