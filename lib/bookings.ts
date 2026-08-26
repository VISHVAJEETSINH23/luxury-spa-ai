/**
 * Booking requests → Server API, LocalStorage & Broadcast Sync.
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

export const BOOKINGS_STORAGE_KEY = "alexa-live-bookings-v1";
export const BOOKINGS_BROADCAST_CHANNEL = "alexa_bookings_sync";

/** "ALX-4F2K9C" — short enough to read down a phone line. */
export function makeReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 6; i++) {
    tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ALX-${tail}`;
}

export function getStoredLiveBookings(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BOOKINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveBookingRequest(
  request: BookingRequest
): Promise<{ ok: boolean; error?: string; appointment?: any }> {
  const assignedRoom =
    request.room_type === "couple"
      ? "VIP Couple Suite"
      : request.therapy_slug?.includes("facial")
      ? "Facial Suite 03"
      : "Single En-Suite 01";

  const assignedTherapist =
    request.room_type === "couple"
      ? "Maya Devi & Deepak R."
      : request.therapy_slug?.includes("facial")
      ? "Sunita Kumari"
      : request.therapist_preference === "male"
      ? "Deepak Rawat"
      : "Pooja Sharma";

  const fallbackAppointment = {
    id: request.reference,
    name: request.guest_name,
    phone: request.guest_phone,
    therapy: `${request.therapy_name} (${request.duration})`,
    time: request.requested_time,
    date: request.requested_date,
    room: assignedRoom,
    therapist: assignedTherapist,
    amount: `₹${request.final_price_inr.toLocaleString("en-IN")}`,
    status: "Confirmed",
    oil: request.aroma_oil,
    isNewOnlineBooking: true,
    createdAt: new Date().toISOString(),
    notes: request.guest_notes || "Online Web Booking",
    email: request.guest_email,
  };

  // 1. Post to Server API `/api/bookings`
  let serverAppointment = fallbackAppointment;
  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.appointment) {
        serverAppointment = data.appointment;
      }
    }
  } catch (err) {
    console.warn("Could not reach /api/bookings, saving locally:", err);
  }

  // 2. Broadcast and Cache in browser for instant 0ms tab synchronization
  if (typeof window !== "undefined") {
    try {
      const existing = getStoredLiveBookings();
      const updated = [serverAppointment, ...existing.filter((b) => b.id !== serverAppointment.id)];
      window.localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));

      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel(BOOKINGS_BROADCAST_CHANNEL);
        channel.postMessage({ type: "NEW_BOOKING", appointment: serverAppointment });
      }

      window.dispatchEvent(
        new CustomEvent("alexa:new-booking", { detail: serverAppointment })
      );
    } catch (err) {
      console.warn("Local storage cache error:", err);
    }
  }

  return { ok: true, appointment: serverAppointment };
}
