import "server-only";

import { log } from "@/lib/server/log";
import { db } from "@/lib/server/supabase";

/** How long an online booking waits for its payment before it's let go. */
export const PAYMENT_WINDOW_MINUTES = 90;

/**
 * Cancels online bookings whose guest never paid. If the money does arrive
 * later (a slow UPI confirmation), the webhook still records it and the
 * booking shows on the board as cancelled-but-paid, so the owner can refund
 * or reinstate it.
 *
 * Runs from the daily cron and every time the owner opens the board.
 */
export async function expireStalePendingPayments(now = Date.now()): Promise<number> {
  const cutoff = new Date(now - PAYMENT_WINDOW_MINUTES * 60_000).toISOString();
  const { data, error } = await db()
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("status", "pending_payment")
    .lt("created_at", cutoff)
    .select("reference");
  if (error) throw new Error(`expire failed: ${error.code}`);

  const count = data?.length ?? 0;
  if (count > 0) log.info("booking.expired_unpaid", { count });
  return count;
}
