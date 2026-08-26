import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface StoredBooking {
  id: string;
  name: string;
  phone: string;
  therapy: string;
  time: string;
  date: string;
  room: string;
  therapist: string;
  amount: string;
  status: string;
  oil: string;
  isNewOnlineBooking: boolean;
  createdAt: string;
  notes?: string;
  email?: string | null;
}

// In-memory server cache across requests in the current node process
declare global {
  // eslint-disable-next-line no-var
  var __ALEXA_LIVE_BOOKINGS__: StoredBooking[] | undefined;
}

if (!global.__ALEXA_LIVE_BOOKINGS__) {
  global.__ALEXA_LIVE_BOOKINGS__ = [];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function GET() {
  const localList = global.__ALEXA_LIVE_BOOKINGS__ || [];

  // If Supabase is available, try to fetch recent online requests as well
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/booking_requests?select=*&order=created_at.desc&limit=25`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          next: { revalidate: 0 },
        }
      );

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          const mapped: StoredBooking[] = rows.map((r: any) => ({
            id: r.reference || `ALX-${r.id || Date.now().toString().slice(-5)}`,
            name: r.guest_name || "Online Guest",
            phone: r.guest_phone || "",
            therapy: `${r.therapy_name || "Wellness Therapy"} (${r.duration || "60m"})`,
            time: r.requested_time || "12:00 PM",
            date: r.requested_date || new Date().toISOString().split("T")[0],
            room:
              r.room_type === "couple"
                ? "VIP Couple Suite"
                : r.therapy_slug?.includes("facial")
                ? "Facial Suite 03"
                : "Single En-Suite 01",
            therapist:
              r.room_type === "couple"
                ? "Maya Devi & Deepak R."
                : r.therapist_preference === "male"
                ? "Deepak Rawat"
                : "Pooja Sharma",
            amount: `₹${(r.final_price_inr || 2499).toLocaleString("en-IN")}`,
            status: "Confirmed",
            oil: r.aroma_oil || "Alpine Eucalyptus",
            isNewOnlineBooking: true,
            createdAt: r.created_at || new Date().toISOString(),
            notes: r.guest_notes || "Online Web Booking",
            email: r.guest_email || null,
          }));

          // Merge without duplicates
          const seen = new Set<string>();
          const combined: StoredBooking[] = [];

          for (const item of [...localList, ...mapped]) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              combined.push(item);
            }
          }

          global.__ALEXA_LIVE_BOOKINGS__ = combined;
          return NextResponse.json({ ok: true, bookings: combined });
        }
      }
    } catch (err) {
      console.warn("Supabase fetch failed in /api/bookings, using server cache:", err);
    }
  }

  return NextResponse.json({ ok: true, bookings: localList });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.guest_name || !body?.guest_phone) {
      return NextResponse.json({ ok: false, error: "Missing required guest details." }, { status: 400 });
    }

    const assignedRoom =
      body.room_type === "couple"
        ? "VIP Couple Suite"
        : body.therapy_slug?.includes("facial")
        ? "Facial Suite 03"
        : "Single En-Suite 01";

    const assignedTherapist =
      body.room_type === "couple"
        ? "Maya Devi & Deepak R."
        : body.therapy_slug?.includes("facial")
        ? "Sunita Kumari"
        : body.therapist_preference === "male"
        ? "Deepak Rawat"
        : "Pooja Sharma";

    const newBooking: StoredBooking = {
      id: body.reference || `ALX-W${Date.now().toString().slice(-5)}`,
      name: body.guest_name.trim(),
      phone: body.guest_phone.replace(/\D/g, ""),
      therapy: `${body.therapy_name || "Custom Therapy"} (${body.duration || "60 Min"})`,
      time: body.requested_time || "12:00 PM",
      date: body.requested_date || new Date().toISOString().split("T")[0],
      room: assignedRoom,
      therapist: assignedTherapist,
      amount: `₹${(body.final_price_inr || 2499).toLocaleString("en-IN")}`,
      status: "Confirmed",
      oil: body.aroma_oil || "Alpine Eucalyptus",
      isNewOnlineBooking: true,
      createdAt: new Date().toISOString(),
      notes: body.guest_notes || "Online Web Booking",
      email: body.guest_email || null,
    };

    // Prepend to server memory cache
    const current = global.__ALEXA_LIVE_BOOKINGS__ || [];
    global.__ALEXA_LIVE_BOOKINGS__ = [
      newBooking,
      ...current.filter((b) => b.id !== newBooking.id),
    ];

    // Try posting to Supabase in parallel
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/booking_requests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify(body),
        });
      } catch (e) {
        console.warn("Supabase insert error in /api/bookings:", e);
      }
    }

    return NextResponse.json({ ok: true, appointment: newBooking });
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json({ ok: false, error: "Failed to process booking request." }, { status: 500 });
  }
}
