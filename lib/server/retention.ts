import "server-only";

import { log } from "@/lib/server/log";
import { db } from "@/lib/server/supabase";

/**
 * How long a guest's name, phone, email and notes are kept after their
 * appointment (DPDP Act: no longer than the purpose needs). The booking
 * itself — branch, therapy, date, amount — stays for the accounts.
 * A business decision for the owner; the privacy policy states it.
 */
export const RETENTION_MONTHS = 24;

/** The appointment date before which guest details are removed. */
export function retentionCutoff(todayIso: string, months = RETENTION_MONTHS): string {
  const d = new Date(`${todayIso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

/** Blanks guest details on old bookings. Runs from the daily cron. */
export async function removeOldGuestDetails(todayIso: string): Promise<number> {
  const { data, error } = await db()
    .from("bookings")
    .update({ guest_name: "Removed", guest_phone: null, guest_email: null, notes: null })
    .lt("booking_date", retentionCutoff(todayIso))
    .not("guest_phone", "is", null)
    .select("id");
  if (error) throw new Error(`retention failed: ${error.code}`);

  const count = data?.length ?? 0;
  if (count > 0) log.info("booking.guest_details_removed", { count });
  return count;
}
