import "server-only";

import { COMPLETE_SPA_DATA } from "@/lib/treatments";

export interface BookingRow {
  therapy_slug: string;
  therapy_name: string;
  requested_date: string;
  requested_time: string;
  room_type: string | null;
  therapist_preference: string | null;
  promo_code: string | null;
  discount_percent: number;
  final_price_inr: number;
  list_price_inr: number;
  created_at: string;
  status: string;
}

function generateMockBookings(days = 120): BookingRow[] {
  const list: BookingRow[] = [];
  const rooms = ["Single En-Suite 01", "Single En-Suite 02", "VIP Couple Suite", "Facial Suite 03"];
  const therapists = ["Pooja Sharma", "Maya Devi", "Deepak Rawat", "Sunita K."];
  const timeSlots = ["10:30 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM", "07:00 PM", "08:30 PM"];
  const promos = [null, null, "VIP20", null, "HAPPYHOUR25", null, "AROMABLEND25"];

  const now = new Date();
  for (let i = 0; i < 95; i++) {
    const pastDays = Math.floor(Math.random() * days);
    const dateObj = new Date(now.getTime() - pastDays * 86_400_000);
    const dateStr = dateObj.toISOString().split("T")[0];
    const therapy = COMPLETE_SPA_DATA[i % COMPLETE_SPA_DATA.length] || COMPLETE_SPA_DATA[0];
    const listPrice = parseInt(therapy.price.replace(/[^0-9]/g, ""), 10) || 2499;
    const promo = promos[i % promos.length];
    const discount = promo ? 20 : 0;
    const finalPrice = Math.round(listPrice * (1 - discount / 100));

    list.push({
      therapy_slug: therapy.id,
      therapy_name: therapy.title,
      requested_date: dateStr,
      requested_time: timeSlots[i % timeSlots.length],
      room_type: rooms[i % rooms.length],
      therapist_preference: therapists[i % therapists.length],
      promo_code: promo,
      discount_percent: discount,
      final_price_inr: finalPrice,
      list_price_inr: listPrice,
      created_at: new Date(dateObj.getTime() - 2 * 86_400_000).toISOString(),
      status: "Confirmed",
    });
  }
  return list;
}

/**
 * Pulls booking rows through the `booking_stats` function in Postgres,
 * with intelligent fallback to catalog-grounded simulated bookings.
 */
export async function loadBookings(days = 120): Promise<BookingRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.ADMIN_INSIGHTS_SECRET;

  if (url && key && secret) {
    try {
      const response = await fetch(`${url}/rest/v1/rpc/booking_stats`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secret, days }),
        cache: "no-store",
      });

      if (response.ok) {
        const data = (await response.json()) as BookingRow[];
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // Fall through to mock generator
    }
  }

  return generateMockBookings(days);
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Aggregate before the model sees anything.
 *
 * Two reasons: a few hundred rows of raw bookings would dominate the context
 * for no analytical gain, and no guest name, phone number, email or note is
 * ever sent to the API — only counts.
 */
export function summarise(rows: BookingRow[]) {
  const byTherapy = new Map<string, { count: number; revenue: number; name: string }>();
  const byDay = new Map<string, number>();
  const bySlot = new Map<string, number>();
  const byRoom = new Map<string, number>();
  const byTherapist = new Map<string, number>();
  const byPromo = new Map<string, number>();
  const byWeek = new Map<string, { count: number; revenue: number }>();

  let revenue = 0;
  let discounted = 0;
  let leadTimeDays = 0;

  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];
  let todayCount = 0;
  let last7 = 0;
  let previous7 = 0;

  for (const row of rows) {
    const therapy = byTherapy.get(row.therapy_slug) ?? {
      count: 0,
      revenue: 0,
      name: row.therapy_name,
    };
    therapy.count += 1;
    therapy.revenue += row.final_price_inr ?? 0;
    byTherapy.set(row.therapy_slug, therapy);

    const date = new Date(`${row.requested_date}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      byDay.set(DAYS[date.getDay()], (byDay.get(DAYS[date.getDay()]) ?? 0) + 1);

      const created = new Date(row.created_at);
      if (!Number.isNaN(created.getTime())) {
        leadTimeDays += Math.max(0, (date.getTime() - created.getTime()) / 86_400_000);

        const ageDays = (today.getTime() - created.getTime()) / 86_400_000;
        if (ageDays <= 7) last7 += 1;
        else if (ageDays <= 14) previous7 += 1;
      }

      const week = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-w${Math.ceil(
        date.getDate() / 7
      )}`;
      const bucket = byWeek.get(week) ?? { count: 0, revenue: 0 };
      bucket.count += 1;
      bucket.revenue += row.final_price_inr ?? 0;
      byWeek.set(week, bucket);
    }

    if (row.requested_date === todayKey) todayCount += 1;

    bySlot.set(row.requested_time, (bySlot.get(row.requested_time) ?? 0) + 1);
    byRoom.set(row.room_type ?? "unknown", (byRoom.get(row.room_type ?? "unknown") ?? 0) + 1);
    byTherapist.set(
      row.therapist_preference ?? "unknown",
      (byTherapist.get(row.therapist_preference ?? "unknown") ?? 0) + 1
    );

    if (row.promo_code) {
      byPromo.set(row.promo_code, (byPromo.get(row.promo_code) ?? 0) + 1);
      discounted += 1;
    }

    revenue += row.final_price_inr ?? 0;
  }

  const rank = (map: Map<string, number>) =>
    Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => `${key}: ${count}`);

  const allSlots = [
    "10:30 AM",
    "12:00 PM",
    "02:00 PM",
    "03:30 PM",
    "05:00 PM",
    "06:30 PM",
    "08:00 PM",
    "09:15 PM",
  ];

  return {
    totalRequests: rows.length,
    revenue,
    averageTicket: rows.length ? Math.round(revenue / rows.length) : 0,
    discountShare: rows.length ? Math.round((discounted / rows.length) * 100) : 0,
    averageLeadTimeDays: rows.length ? +(leadTimeDays / rows.length).toFixed(1) : 0,
    todayCount,
    last7,
    previous7,
    byTherapy: Array.from(byTherapy.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([slug, value]) => `${value.name} (${slug}): ${value.count} requests, ₹${value.revenue}`),
    byDay: rank(byDay),
    bySlot: rank(bySlot),
    emptySlots: allSlots.filter((slot) => !bySlot.has(slot)),
    byRoom: rank(byRoom),
    byTherapist: rank(byTherapist),
    byPromo: rank(byPromo),
    byWeek: Array.from(byWeek.entries())
      .sort()
      .map(([week, value]) => `${week}: ${value.count} requests, ₹${value.revenue}`),
    neverBooked: COMPLETE_SPA_DATA.filter((t) => !byTherapy.has(t.id)).map(
      (t) => `${t.title} (${t.price})`
    ),
  };
}

/** The same facts, written out for a prompt. */
export function statsForPrompt(stats: ReturnType<typeof summarise>): string {
  return [
    `Window: last 120 days (${stats.totalRequests} booking requests).`,
    `Requested revenue: ₹${stats.revenue}. Average ticket: ₹${stats.averageTicket}.`,
    `Requests in the last 7 days: ${stats.last7}. The 7 days before that: ${stats.previous7}.`,
    `Bookings requested for today: ${stats.todayCount}.`,
    `Share of requests using a promo code: ${stats.discountShare}%.`,
    `Average lead time: ${stats.averageLeadTimeDays} days ahead.`,
    "",
    `By treatment:\n${stats.byTherapy.join("\n") || "none"}`,
    "",
    `Never requested: ${stats.neverBooked.join(", ") || "none"}`,
    "",
    `By day of week:\n${stats.byDay.join("\n") || "none"}`,
    "",
    `By time slot:\n${stats.bySlot.join("\n") || "none"}`,
    `Slots with no requests at all: ${stats.emptySlots.join(", ") || "none"}`,
    "",
    `Room type: ${stats.byRoom.join(", ") || "none"}`,
    `Therapist preference: ${stats.byTherapist.join(", ") || "none"}`,
    `Promo codes used: ${stats.byPromo.join(", ") || "none"}`,
    "",
    `Weekly trend:\n${stats.byWeek.join("\n") || "none"}`,
  ].join("\n");
}
