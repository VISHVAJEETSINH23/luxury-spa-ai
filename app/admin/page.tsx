"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, LogOut, MessageCircle, Phone, RefreshCw } from "lucide-react";
import { BRANCHES, formatSlot, type BranchId } from "@/lib/branches";

type Status = "pending_payment" | "pending_confirmation" | "confirmed" | "completed" | "cancelled";

interface Booking {
  id: string;
  reference: string;
  branch: BranchId;
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

type BranchFilter = BranchId | "all";
type Range = "today" | "upcoming" | "past";

const ACTIONS: Record<Status, { to: Status; label: string; tone: "primary" | "plain" | "danger" }[]> = {
  pending_confirmation: [
    { to: "confirmed", label: "Confirm", tone: "primary" },
    { to: "cancelled", label: "Cancel", tone: "danger" },
  ],
  pending_payment: [{ to: "cancelled", label: "Cancel", tone: "danger" }],
  confirmed: [
    { to: "completed", label: "Done", tone: "primary" },
    { to: "cancelled", label: "Cancel", tone: "danger" },
  ],
  completed: [],
  cancelled: [],
};

/** An online booking whose payment hasn't arrived after this long is stale
    (the room is released then; the booking is auto-cancelled at 90). */
const PAYMENT_WAIT_MINUTES = 30;

function indiaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function prettyDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function rupees(value: number): string {
  return "₹" + value.toLocaleString("en-IN");
}

function paymentState(b: Booking): { label: string; className: string } {
  const paid = b.payments?.some((p) => p.status === "captured");
  const refunded = b.payments?.some((p) => p.status === "refunded");
  if (refunded) return { label: "Refunded", className: "text-[#e8ded2]/60 border-white/15" };
  if (paid && b.status === "cancelled") return { label: "Paid · refund due", className: "text-[#e0785e] border-[#e0785e]/50" };
  if (paid) return { label: "Paid online ✓", className: "text-emerald-400 border-emerald-400/40" };
  if (b.payment_mode === "at_spa") return { label: "Pay at spa", className: "text-[#c5a880] border-[#c5a880]/40" };
  const ageMin = (Date.now() - new Date(b.created_at).getTime()) / 60000;
  return ageMin < PAYMENT_WAIT_MINUTES
    ? { label: "Waiting for payment", className: "text-[#e8ded2]/70 border-white/20" }
    : { label: "Payment not completed", className: "text-[#e0785e] border-[#e0785e]/40" };
}

/** A ready-to-send WhatsApp message for the guest, matching the booking's state. */
function whatsappLink(b: Booking): string {
  const when = `${prettyDate(b.booking_date)}, ${formatSlot(b.slot_time.slice(0, 5))}`;
  const branch = BRANCHES[b.branch];
  const lines =
    b.status === "cancelled"
      ? [`Hello ${b.guest_name}, your booking ${b.reference} at ${branch.name} for ${when} has been cancelled.`]
      : [
          `Hello ${b.guest_name}, your booking at ${branch.name} is confirmed.`,
          `${b.therapy_title} · ${b.minutes} min`,
          `${when}`,
          `Ref: ${b.reference}`,
          ...(branch.mapsUrl ? [`Directions: ${branch.mapsUrl}`] : []),
          "See you soon!",
        ];
  return `https://wa.me/91${b.guest_phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

const STATUS_LABEL: Record<Status, string> = {
  pending_payment: "Online, unpaid",
  pending_confirmation: "Needs confirmation",
  confirmed: "Confirmed",
  completed: "Done",
  cancelled: "Cancelled",
};

export default function AdminBookingsPage() {
  const [branch, setBranch] = useState<BranchFilter>("all");
  const [range, setRange] = useState<Range>("today");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyRef, setBusyRef] = useState<string | null>(null);

  const load = useCallback(async () => {
    const today = indiaToday();
    const params = new URLSearchParams({ branch });
    if (range === "today") {
      params.set("from", today);
      params.set("to", today);
    } else if (range === "upcoming") {
      params.set("from", today);
      params.set("to", addDays(today, 60));
    } else {
      params.set("from", addDays(today, -30));
      params.set("to", addDays(today, -1));
    }

    try {
      const response = await fetch(`/api/admin/bookings?${params}`, { cache: "no-store" });
      if (response.status === 401) {
        window.location.replace("/admin/login");
        return;
      }
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error();
      setBookings(range === "past" ? [...data.bookings].reverse() : data.bookings);
      setError("");
    } catch {
      setError("Couldn't load bookings. Retrying…");
    } finally {
      setLoading(false);
    }
  }, [branch, range]);

  useEffect(() => {
    setLoading(true);
    void load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  const changeStatus = async (b: Booking, to: Status) => {
    if (to === "cancelled" && !window.confirm(`Cancel ${b.guest_name}'s booking (${b.reference})?`)) return;
    setBusyRef(b.reference);
    try {
      const response = await fetch(`/api/admin/bookings/${b.reference}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      if (response.status === 401) {
        window.location.replace("/admin/login");
        return;
      }
      if (!response.ok) window.alert("That change didn't go through. The list will refresh.");
    } finally {
      setBusyRef(null);
      void load();
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.replace("/admin/login");
  };

  const summary = useMemo(() => {
    const active = bookings.filter((b) => b.status !== "cancelled");
    return {
      total: active.length,
      needsAction: bookings.filter((b) => b.status === "pending_confirmation").length,
      paidOnline: bookings
        .filter((b) => b.payments?.some((p) => p.status === "captured") && b.status !== "cancelled")
        .reduce((sum, b) => sum + b.amount_inr, 0),
    };
  }, [bookings]);

  const byDate = useMemo(() => {
    const groups = new Map<string, Booking[]>();
    for (const b of bookings) groups.set(b.booking_date, [...(groups.get(b.booking_date) ?? []), b]);
    return [...groups.entries()];
  }, [bookings]);

  const pill = (active: boolean) =>
    `cursor-pointer rounded-full px-4 py-2 text-sm transition-colors ${
      active ? "bg-[#c5a880] font-semibold text-[#07090b]" : "border border-white/15 text-[#e8ded2]/75 hover:border-[#c5a880]/60"
    }`;

  return (
    <main className="min-h-screen bg-[#07090b] px-4 pb-16 pt-6 text-[#f7f4ee] sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#c5a880]">Alexa Salon & Spa</span>
            <h1 className="font-serif text-2xl sm:text-3xl">Bookings</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void load()} aria-label="Refresh" className="cursor-pointer rounded-full border border-white/15 p-2.5 hover:border-[#c5a880]/60">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={logout} className="flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:border-[#c5a880]/60">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {(["all", "sangli", "karad"] as BranchFilter[]).map((id) => (
            <button key={id} onClick={() => setBranch(id)} className={pill(branch === id)}>
              {id === "all" ? "Both branches" : BRANCHES[id].city}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            ["today", "Today"],
            ["upcoming", "Upcoming"],
            ["past", "Last 30 days"],
          ] as [Range, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setRange(id)} className={pill(range === id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ["Bookings", String(summary.total)],
            ["Need confirmation", String(summary.needsAction)],
            ["Paid online", rupees(summary.paidOnline)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[#0b0f12] p-4">
              <span className="block text-[11px] text-[#e8ded2]/55">{label}</span>
              <span className="mt-1 block font-mono text-xl text-[#c5a880]">{value}</span>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-[#e0785e]">{error}</p>}

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-[#e8ded2]/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : bookings.length === 0 ? (
          <p className="rounded-2xl border border-white/10 p-8 text-center text-sm text-[#e8ded2]/60">No bookings here yet.</p>
        ) : (
          byDate.map(([date, list]) => (
            <section key={date} className="space-y-3">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#e8ded2]/55">{prettyDate(date)}</h2>
              {list.map((b) => {
                const payment = paymentState(b);
                return (
                  <article
                    key={b.id}
                    className={`rounded-2xl border bg-[#0b0f12] p-4 sm:p-5 ${
                      b.status === "pending_confirmation" ? "border-[#c5a880]/60" : "border-white/10"
                    } ${b.status === "cancelled" ? "opacity-60" : ""}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-lg text-[#c5a880]">{formatSlot(b.slot_time.slice(0, 5))}</span>
                          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px]">{BRANCHES[b.branch].city}</span>
                          <span className="text-[11px] text-[#e8ded2]/50">{STATUS_LABEL[b.status]}</span>
                        </div>
                        <p className="text-base font-semibold">{b.guest_name}</p>
                        <p className="text-sm text-[#e8ded2]/75">
                          {b.therapy_title} · {b.minutes} min
                          {b.therapist_pref !== "any" && ` · ${b.therapist_pref} therapist`}
                        </p>
                        {b.notes && <p className="text-sm text-[#e8ded2]/60">“{b.notes}”</p>}
                        <p className="font-mono text-[11px] text-[#e8ded2]/40">{b.reference}</p>
                      </div>
                      <div className="space-y-2 text-right">
                        <span className="block font-mono text-lg">{rupees(b.amount_inr)}</span>
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] ${payment.className}`}>
                          {payment.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <a href={`tel:+91${b.guest_phone}`} className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-sm hover:border-[#c5a880]/60">
                        <Phone className="h-3.5 w-3.5" /> {b.guest_phone}
                      </a>
                      <a
                        href={whatsappLink(b)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-sm hover:border-[#25D366]/60"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                      <span className="flex-1" />
                      {ACTIONS[b.status].map((action) => (
                        <button
                          key={action.to}
                          disabled={busyRef === b.reference}
                          onClick={() => void changeStatus(b, action.to)}
                          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-wait disabled:opacity-50 ${
                            action.tone === "primary"
                              ? "bg-[#c5a880] text-[#07090b]"
                              : action.tone === "danger"
                                ? "border border-[#e0785e]/50 text-[#e0785e]"
                                : "border border-white/15"
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </section>
          ))
        )}
      </div>
    </main>
  );
}
