/**
 * Booking requests → Supabase.
 *
 * Posted straight to PostgREST rather than through @supabase/supabase-js: the
 * site makes exactly one kind of write, and a fetch call costs nothing to ship.
 * The publishable key is meant to be public — `booking_requests` has RLS with
 * an insert-only policy for anon, so a key in the bundle can add a request and
 * can never read one back.
 */

export interface BookingRequest {
  reference: string;
  therapy_slug: string;
  therapy_name: string;
  duration: string;
  requested_date: string;
  requested_time: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  guest_notes: string | null;
  therapist_preference: string;
  room_type: string;
  aroma_oil: string;
  list_price_inr: number;
  discount_percent: number;
  final_price_inr: number;
  promo_code: string | null;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** "ALX-4F2K9C" — short enough to read down a phone line. */
export function makeReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  let tail = "";
  for (let i = 0; i < 6; i++) {
    tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ALX-${tail}`;
}

export async function saveBookingRequest(
  request: BookingRequest
): Promise<{ ok: boolean; error?: string }> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { ok: false, error: "Booking storage is not configured." };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/booking_requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, error: detail || `Request failed (${response.status})` };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
