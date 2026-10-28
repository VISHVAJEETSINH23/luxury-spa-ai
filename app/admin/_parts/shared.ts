import { BRANCHES, OPENS_AT, formatSlot, minutesOfDay, type BranchId } from "@/lib/branches";

/** Shared types and helpers for the owner's dashboard tabs. */

export type Status = "pending_payment" | "pending_confirmation" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  reference: string;
  branch: BranchId;
  therapy_id: string;
  therapy_title: string;
  minutes: number;
  booking_date: string;
  slot_time: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  notes: string | null;
  therapist_pref: "female" | "male" | "any";
  amount_inr: number;
  payment_mode: "online" | "at_spa";
  status: Status;
  created_at: string;
  payments: { status: string; razorpay_payment_id: string | null; method: string | null }[];
}

export type BranchFilter = BranchId | "all";

/** Treatment rooms per branch, for occupancy. Keep in step with the branch_capacity table. */
export const ROOMS_PER_BRANCH = 3;

/** An online booking whose payment hasn't arrived after this long is stale
    (the room is released then; the booking is auto-cancelled at 90). */
const PAYMENT_WAIT_MINUTES = 30;

export function indiaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function prettyDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** "Today", "Tomorrow", "Yesterday", or the date. */
export function dayLabel(iso: string): string {
  const today = indiaToday();
  if (iso === today) return "Today";
  if (iso === addDays(today, 1)) return "Tomorrow";
  if (iso === addDays(today, -1)) return "Yesterday";
  return prettyDate(iso);
}

export function rupees(value: number): string {
  return "₹" + value.toLocaleString("en-IN");
}

export function slotLabel(b: Booking): string {
  return formatSlot(b.slot_time.slice(0, 5));
}

export function isActive(b: Booking): boolean {
  return b.status !== "cancelled";
}

export function isPaid(b: Booking): boolean {
  return b.payments?.some((p) => p.status === "captured") ?? false;
}

export function needsAttention(b: Booking): boolean {
  return (
    b.status === "pending_confirmation" ||
    (b.status === "cancelled" && isPaid(b) && !b.payments.some((p) => p.status === "refunded"))
  );
}

/** Minutes a branch is open each day. */
export function openMinutes(branch: BranchId): number {
  return minutesOfDay(BRANCHES[branch].closesAt) - minutesOfDay(OPENS_AT);
}

export function paymentState(b: Booking): { label: string; className: string } {
  const refunded = b.payments?.some((p) => p.status === "refunded");
  if (refunded) return { label: "Refunded", className: "text-[#e8ded2]/60 border-white/15" };
  if (isPaid(b) && b.status === "cancelled") return { label: "Paid · refund due", className: "text-[#e0785e] border-[#e0785e]/50 bg-[#e0785e]/10" };
  if (isPaid(b)) return { label: "Paid online ✓", className: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" };
  if (b.payment_mode === "at_spa") return { label: "Pay at spa", className: "text-[#d9bb8e] border-[#c5a880]/40" };
  const ageMin = (Date.now() - new Date(b.created_at).getTime()) / 60000;
  return ageMin < PAYMENT_WAIT_MINUTES
    ? { label: "Waiting for payment", className: "text-[#e8ded2]/70 border-white/20" }
    : { label: "Payment not completed", className: "text-[#e0785e] border-[#e0785e]/40" };
}

export const STATUS_STYLE: Record<Status, { label: string; dot: string; bar: string; badge: string }> = {
  pending_confirmation: { label: "Needs confirmation", dot: "bg-amber-400", bar: "bg-amber-400", badge: "bg-amber-400/15 text-amber-300 border-amber-400/30" },
  pending_payment: { label: "Awaiting payment", dot: "bg-sky-400", bar: "bg-sky-400/70", badge: "bg-sky-400/10 text-sky-300 border-sky-400/30" },
  confirmed: { label: "Confirmed", dot: "bg-emerald-400", bar: "bg-emerald-400", badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30" },
  completed: { label: "Done", dot: "bg-[#c5a880]", bar: "bg-[#c5a880]/60", badge: "bg-[#c5a880]/10 text-[#d9bb8e] border-[#c5a880]/30" },
  cancelled: { label: "Cancelled", dot: "bg-white/30", bar: "bg-white/15", badge: "bg-white/5 text-[#e8ded2]/50 border-white/10" },
};

export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
}

/** A ready-to-send WhatsApp message for the guest, matching the booking's state. */
export function bookingWhatsapp(b: Booking): string {
  const when = `${prettyDate(b.booking_date)}, ${slotLabel(b)}`;
  const branch = BRANCHES[b.branch];
  const lines =
    b.status === "cancelled"
      ? [`Hello ${b.guest_name}, your booking ${b.reference} at ${branch.name} for ${when} has been cancelled.`]
      : [
          `Hello ${b.guest_name}, your booking at ${branch.name} is confirmed.`,
          `${b.therapy_title} · ${b.minutes} min`,
          when,
          `Ref: ${b.reference}`,
          ...(branch.mapsUrl ? [`Directions: ${branch.mapsUrl}`] : []),
          "See you soon!",
        ];
  return whatsappUrl(b.guest_phone, lines.join("\n"));
}

/** Rows as a spreadsheet the owner can open in Excel. */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = "﻿" + [header, ...rows].map((r) => r.map(escape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function bookingsCsv(list: Booking[]) {
  downloadCsv(
    `alexa-bookings-${indiaToday()}.csv`,
    ["Reference", "Branch", "Date", "Time", "Guest", "Phone", "Email", "Therapy", "Minutes", "Amount", "Payment", "Status", "Therapist", "Notes", "Booked at"],
    list.map((b) => [
      b.reference,
      BRANCHES[b.branch].city,
      b.booking_date,
      b.slot_time.slice(0, 5),
      b.guest_name,
      b.guest_phone,
      b.guest_email ?? "",
      b.therapy_title,
      b.minutes,
      b.amount_inr,
      paymentState(b).label,
      STATUS_STYLE[b.status].label,
      b.therapist_pref,
      b.notes ?? "",
      new Date(b.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    ])
  );
}

/** Shared card look for the dashboard. */
export const CARD = "rounded-3xl border border-white/10 bg-[#0c1015] shadow-xl";
