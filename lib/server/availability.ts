import "server-only";

import { SLOT_TIMES, minutesOfDay, slotFits, type BranchId } from "@/lib/branches";
import { db } from "@/lib/server/supabase";

/** How long an unpaid online booking keeps its room. Same as the database trigger. */
export const PAYMENT_HOLD_MINUTES = 30;

export interface HeldBooking {
  slot_time: string;
  minutes: number;
  status: string;
  created_at: string;
}

function holdsRoom(b: HeldBooking, now: number): boolean {
  if (b.status === "pending_confirmation" || b.status === "confirmed") return true;
  return b.status === "pending_payment" && now - new Date(b.created_at).getTime() < PAYMENT_HOLD_MINUTES * 60_000;
}

/**
 * Start times on one day where a therapy of `minutes` would find every room
 * taken. The same overlap rule as the enforce_slot_capacity trigger, which
 * stays the final word when the booking is actually saved.
 */
export function fullSlots(
  bookings: HeldBooking[],
  rooms: number,
  minutes: number,
  branch: BranchId,
  now = Date.now()
): string[] {
  const active = bookings.filter((b) => holdsRoom(b, now));
  return SLOT_TIMES.filter((slot) => {
    if (!slotFits(slot, minutes, branch)) return false;
    const start = minutesOfDay(slot);
    const end = start + minutes;
    const taken = active.filter((b) => {
      const bStart = minutesOfDay(b.slot_time.slice(0, 5));
      return bStart < end && bStart + b.minutes > start;
    }).length;
    return taken >= rooms;
  });
}

export async function fullSlotsOn(branch: BranchId, date: string, minutes: number): Promise<string[]> {
  const supabase = db();
  const [{ data: capacity, error: capacityError }, { data: bookings, error }] = await Promise.all([
    supabase.from("branch_capacity").select("rooms").eq("branch", branch).maybeSingle<{ rooms: number }>(),
    supabase
      .from("bookings")
      .select("slot_time, minutes, status, created_at")
      .eq("branch", branch)
      .eq("booking_date", date)
      .in("status", ["pending_payment", "pending_confirmation", "confirmed"]),
  ]);
  if (capacityError) throw new Error(`capacity lookup failed: ${capacityError.code}`);
  if (error) throw new Error(`availability lookup failed: ${error.code}`);
  if (!capacity) return [];
  return fullSlots((bookings ?? []) as HeldBooking[], capacity.rooms, minutes, branch);
}
