import "server-only";

import { COMPLETE_SPA_DATA } from "@/lib/treatments";
import { MAX_DAYS_AHEAD, SLOT_TIMES, isBranchId, minutesOfDay, slotFits, type BranchId } from "@/lib/branches";

export interface BookingInput {
  branch: BranchId;
  therapyId: string;
  therapyTitle: string;
  minutes: number;
  amountInr: number;
  date: string;
  slot: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  therapistPref: "female" | "male" | "any";
  paymentMode: "online" | "at_spa";
}

/** Today's date and minute-of-day in India, whatever timezone the server is in. */
export function indiaNow(now = new Date()): { date: string; minuteOfDay: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minuteOfDay: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Strips control characters and trims; returns null for empty. */
function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, max);
}

/**
 * Turns whatever the browser sent into a booking the spa actually offers —
 * or an error code. The price is looked up here from the menu; nothing the
 * browser says about money is read at all.
 */
export function parseBookingInput(
  raw: unknown,
  { byOwner = false }: { byOwner?: boolean } = {}
): { ok: true; value: BookingInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "BAD_REQUEST" };
  const body = raw as Record<string, unknown>;

  if (!isBranchId(body.branch)) return { ok: false, error: "INVALID_BRANCH" };

  const therapy = COMPLETE_SPA_DATA.find((t) => t.id === body.therapyId);
  const option = therapy?.options.find((o) => o.minutes === body.minutes);
  if (!therapy || !option) return { ok: false, error: "INVALID_THERAPY" };

  const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;
  const today = indiaNow();
  if (!date || date < today.date || date > addDays(today.date, MAX_DAYS_AHEAD)) {
    return { ok: false, error: "INVALID_DATE" };
  }

  const slot = typeof body.slot === "string" && SLOT_TIMES.includes(body.slot) ? body.slot : null;
  if (!slot || !slotFits(slot, option.minutes, body.branch)) return { ok: false, error: "INVALID_SLOT" };
  // Guests need 30 minutes' notice; the owner can enter a walk-in for a slot already under way.
  if (!byOwner && date === today.date && minutesOfDay(slot) < today.minuteOfDay + 30) {
    return { ok: false, error: "SLOT_IN_PAST" };
  }

  const name = cleanText(body.name, 80);
  if (!name) return { ok: false, error: "INVALID_NAME" };

  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "") : "";
  if (!/^[6-9]\d{9}$/.test(phone)) return { ok: false, error: "INVALID_PHONE" };

  const email = cleanText(body.email, 120);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "INVALID_EMAIL" };

  const therapistPref =
    body.therapistPref === "female" || body.therapistPref === "male" ? body.therapistPref : "any";

  if (body.paymentMode !== "online" && body.paymentMode !== "at_spa") {
    return { ok: false, error: "INVALID_PAYMENT_MODE" };
  }

  if (!byOwner && body.consent !== true) return { ok: false, error: "CONSENT_REQUIRED" };

  return {
    ok: true,
    value: {
      branch: body.branch,
      therapyId: therapy.id,
      therapyTitle: therapy.title,
      minutes: option.minutes,
      amountInr: option.price,
      date,
      slot,
      name,
      phone,
      email,
      notes: cleanText(body.notes, 500),
      therapistPref,
      paymentMode: body.paymentMode,
    },
  };
}
