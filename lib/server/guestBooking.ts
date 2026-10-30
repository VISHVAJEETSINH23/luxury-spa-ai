import "server-only";

import { CANCEL_HOURS } from "@/lib/branches";
import type { BookingRow } from "@/lib/server/supabase";

/** When the appointment starts, as epoch ms (India time). */
export function startsAt(b: Pick<BookingRow, "booking_date" | "slot_time">): number {
  return Date.parse(`${b.booking_date}T${b.slot_time.slice(0, 5)}:00+05:30`);
}

/**
 * Whether a guest may cancel online, and if not, why. Pay-at-spa and unpaid
 * bookings can be cancelled until they start; a paid one only up to
 * CANCEL_HOURS before, as the refund policy says — after that it's a
 * conversation with the spa, not a button.
 */
export function guestCancelRule(
  b: Pick<BookingRow, "status" | "payment_mode" | "booking_date" | "slot_time">,
  now = Date.now()
): { ok: true } | { ok: false; reason: "NOT_ACTIVE" | "STARTED" | "TOO_LATE_FOR_REFUND" } {
  if (b.status === "cancelled" || b.status === "completed") return { ok: false, reason: "NOT_ACTIVE" };
  const start = startsAt(b);
  if (now >= start) return { ok: false, reason: "STARTED" };
  const paid = b.payment_mode === "online" && b.status === "confirmed";
  if (paid && start - now < CANCEL_HOURS * 3_600_000) return { ok: false, reason: "TOO_LATE_FOR_REFUND" };
  return { ok: true };
}
