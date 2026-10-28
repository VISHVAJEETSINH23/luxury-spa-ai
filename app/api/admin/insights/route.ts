import { NextResponse } from "next/server";
import { FAST_MODEL, generateJSON, getClient } from "@/lib/ai/client";
import { BRANCHES, SLOT_TIMES, formatSlot, type BranchId } from "@/lib/branches";
import { isOwner, sameOrigin, unauthorized } from "@/lib/server/adminAuth";
import { indiaNow } from "@/lib/server/bookingInput";
import { log } from "@/lib/server/log";
import { allow, readJson } from "@/lib/server/rateLimit";
import { db } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Row {
  branch: BranchId;
  therapy_title: string;
  booking_date: string;
  slot_time: string;
  guest_phone: string;
  amount_inr: number;
  payment_mode: "online" | "at_spa";
  status: string;
}

interface Insight {
  headline: string;
  actions: { title: string; detail: string; impact: "high" | "medium" | "low" }[];
  watch: string[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function countBy<T>(items: T[], key: (item: T) => string): [string, number][] {
  const map = new Map<string, number>();
  for (const item of items) map.set(key(item), (map.get(key(item)) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

/**
 * Numbers only — no names, phones or notes ever go to the model. Phones are
 * used here just to count repeat and lapsed guests.
 */
function summarise(rows: Row[], today: string) {
  const past = rows.filter((r) => r.booking_date < today);
  const upcoming = rows.filter((r) => r.booking_date >= today && r.status !== "cancelled");
  const kept = past.filter((r) => r.status !== "cancelled");
  const cancelled = rows.filter((r) => r.status === "cancelled").length;

  const visitsByPhone = new Map<string, { count: number; last: string; spent: number }>();
  for (const r of rows.filter((x) => x.status !== "cancelled")) {
    const v = visitsByPhone.get(r.guest_phone) ?? { count: 0, last: "", spent: 0 };
    v.count += 1;
    v.spent += r.amount_inr;
    if (r.booking_date > v.last) v.last = r.booking_date;
    visitsByPhone.set(r.guest_phone, v);
  }
  const guests = [...visitsByPhone.values()];
  const lapsed = guests.filter((g) => g.count >= 2 && g.last < addDays(today, -30));

  const next7 = upcoming.filter((r) => r.booking_date <= addDays(today, 6));

  return {
    window: "last 60 days and next 14 days",
    bookings_total: rows.length,
    completed_or_kept_past: kept.length,
    upcoming_next_14_days: upcoming.length,
    upcoming_next_7_days: next7.length,
    cancelled,
    cancellation_rate_pct: rows.length ? Math.round((cancelled / rows.length) * 100) : 0,
    revenue_past_inr: kept.reduce((s, r) => s + r.amount_inr, 0),
    revenue_upcoming_inr: upcoming.reduce((s, r) => s + r.amount_inr, 0),
    avg_ticket_inr: kept.length ? Math.round(kept.reduce((s, r) => s + r.amount_inr, 0) / kept.length) : 0,
    online_paid_share_pct: rows.length ? Math.round((rows.filter((r) => r.payment_mode === "online").length / rows.length) * 100) : 0,
    unique_guests: guests.length,
    repeat_guests: guests.filter((g) => g.count >= 2).length,
    lapsed_regulars_30_days: lapsed.length,
    by_branch: (["sangli", "karad"] as BranchId[]).map((b) => ({
      branch: BRANCHES[b].city,
      bookings: rows.filter((r) => r.branch === b && r.status !== "cancelled").length,
      closes_at: BRANCHES[b].closesAt,
    })),
    top_therapies: countBy(rows.filter((r) => r.status !== "cancelled"), (r) => r.therapy_title).slice(0, 6),
    bookings_by_slot: SLOT_TIMES.map((s) => [formatSlot(s), rows.filter((r) => r.slot_time.startsWith(s) && r.status !== "cancelled").length]),
    bookings_by_weekday: WEEKDAYS.map((d, i) => [d, rows.filter((r) => new Date(`${r.booking_date}T00:00:00Z`).getUTCDay() === i && r.status !== "cancelled").length]),
    empty_slots_next_7_days: next7.length === 0 ? "all slots are empty" : `${SLOT_TIMES.length * 7 * 2 - next7.length} of ${SLOT_TIMES.length * 7 * 2} slot-branch combinations have no booking`,
  };
}

/** Plain rules for when Gemini isn't configured or doesn't answer. */
function ruleBased(s: ReturnType<typeof summarise>): Insight {
  const actions: Insight["actions"] = [];
  if (s.bookings_total === 0) {
    return {
      headline: "No bookings in the last 60 days yet — the first job is getting the word out.",
      actions: [
        { title: "Share the booking link", detail: "Post the website link on both branches' WhatsApp status and Justdial/Google listings.", impact: "high" },
        { title: "Ask happy guests for a review", detail: "Reviews on Google and Justdial bring most new spa guests.", impact: "medium" },
      ],
      watch: [],
    };
  }
  const quietSlot = [...s.bookings_by_slot].sort((a, b) => Number(a[1]) - Number(b[1]))[0];
  const quietDay = [...s.bookings_by_weekday].sort((a, b) => Number(a[1]) - Number(b[1]))[0];
  actions.push({ title: `Fill the ${quietSlot[0]} slot`, detail: `It's the least-booked time. A small weekday offer for that slot can fill rooms that are otherwise empty.`, impact: "high" });
  if (s.lapsed_regulars_30_days > 0) {
    actions.push({ title: `Win back ${s.lapsed_regulars_30_days} regulars`, detail: "They've visited at least twice but not in 30 days. A personal WhatsApp from the owner works best.", impact: "high" });
  }
  actions.push({ title: `Boost ${quietDay[0]}s`, detail: `${quietDay[0]} is the quietest day of the week.`, impact: "medium" });
  if (s.top_therapies[0]) {
    actions.push({ title: `Lead with ${s.top_therapies[0][0]}`, detail: "It's the most booked therapy — feature it first on WhatsApp status and the website.", impact: "low" });
  }
  const watch = [];
  if (s.cancellation_rate_pct >= 15) watch.push(`Cancellations are at ${s.cancellation_rate_pct}% — call pay-at-spa guests the day before to confirm.`);
  return {
    headline: `${s.upcoming_next_7_days} bookings in the next 7 days, average bill ₹${s.avg_ticket_inr.toLocaleString("en-IN")}.`,
    actions,
    watch,
  };
}

const SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    actions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          impact: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["title", "detail", "impact"],
      },
    },
    watch: { type: "array", items: { type: "string" } },
  },
  required: ["headline", "actions", "watch"],
};

/** The owner's "what should I do this week?" — from real booking numbers. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  if (!(await isOwner())) return unauthorized();
  if (!(await allow("admin:insights", 30, 3_600_000))) {
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  }

  let language: "en" | "hinglish" = "en";
  try {
    const body = (await readJson(request, 256)) as { language?: unknown };
    if (body?.language === "hinglish") language = "hinglish";
  } catch {
    // default language
  }

  const today = indiaNow().date;
  const { data, error } = await db()
    .from("bookings")
    .select("branch, therapy_title, booking_date, slot_time, guest_phone, amount_inr, payment_mode, status")
    .gte("booking_date", addDays(today, -60))
    .lte("booking_date", addDays(today, 14))
    .limit(5000);
  if (error) {
    log.error("admin.insights.query_failed", new Error(error.code));
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }

  const stats = summarise((data ?? []) as Row[], today);
  const fallback = ruleBased(stats);

  if (!getClient() || stats.bookings_total === 0) {
    return NextResponse.json({ ok: true, source: "rules", stats, insight: fallback });
  }

  const insight = await generateJSON<Insight>({
    model: FAST_MODEL,
    schema: SCHEMA,
    temperature: 0.4,
    maxOutputTokens: 1500,
    system: `You advise the owner of Alexa Salon & Spa, a two-branch massage spa in Sangli and Karad (Maharashtra, India).
Read the booking numbers and give the owner 3–5 concrete actions for the coming week, most valuable first.
Every action must follow from a number in the data; never invent figures, discounts or services.
Keep each detail to one or two short sentences. "watch" lists up to 3 risks worth keeping an eye on (may be empty).
${language === "hinglish" ? "Write in simple Hinglish (Hindi in Latin letters, the way owners chat on WhatsApp)." : "Write in plain, simple English."}`,
    prompt: JSON.stringify(stats),
  });

  return NextResponse.json({ ok: true, source: insight ? "ai" : "rules", stats, insight: insight ?? fallback });
}
