"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, Copy, Download, Loader2, MessageCircle, Phone, Search, Sparkles, X } from "lucide-react";
import { BRANCHES } from "@/lib/branches";
import {
  CARD,
  STATUS_STYLE,
  addDays,
  bookingWhatsapp,
  bookingsCsv,
  dayLabel,
  indiaToday,
  needsAttention,
  paymentState,
  prettyDate,
  rupees,
  slotLabel,
  type Booking,
  type Status,
} from "./shared";

type Range = "today" | "upcoming" | "past";
type StatusFilter = "all" | "attention" | "confirmed" | "completed" | "cancelled";

const ACTIONS: Record<Status, { to: Status; label: string; tone: "primary" | "danger" }[]> = {
  pending_confirmation: [
    { to: "confirmed", label: "Confirm", tone: "primary" },
    { to: "cancelled", label: "Cancel", tone: "danger" },
  ],
  pending_payment: [{ to: "cancelled", label: "Cancel", tone: "danger" }],
  confirmed: [
    { to: "completed", label: "Mark done", tone: "primary" },
    { to: "cancelled", label: "Cancel", tone: "danger" },
  ],
  completed: [],
  cancelled: [],
};

export default function BookingsBoard({
  bookings,
  fresh,
  busyRef,
  onChangeStatus,
  onMove,
  query,
  onQuery,
  statusFilter,
  onStatusFilter,
}: {
  bookings: Booking[];
  fresh: Set<string>;
  busyRef: string | null;
  onChangeStatus: (b: Booking, to: Status) => void;
  onMove: (b: Booking) => void;
  query: string;
  onQuery: (q: string) => void;
  statusFilter: StatusFilter;
  onStatusFilter: (s: StatusFilter) => void;
}) {
  // Upcoming includes today, so a request for tomorrow is never out of sight.
  const [range, setRange] = useState<Range>("upcoming");
  const [copied, setCopied] = useState<string | null>(null);
  const today = indiaToday();

  const inRange = useMemo(() => {
    const list = bookings.filter((b) =>
      range === "today"
        ? b.booking_date === today
        : range === "upcoming"
          ? b.booking_date >= today
          : b.booking_date < today && b.booking_date >= addDays(today, -30)
    );
    return range === "past" ? [...list].reverse() : list;
  }, [bookings, range, today]);

  const counts = useMemo(
    () => ({
      all: inRange.length,
      attention: inRange.filter(needsAttention).length,
      confirmed: inRange.filter((b) => b.status === "confirmed").length,
      completed: inRange.filter((b) => b.status === "completed").length,
      cancelled: inRange.filter((b) => b.status === "cancelled").length,
    }),
    [inRange]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return inRange.filter((b) => {
      if (statusFilter === "attention" && !needsAttention(b)) return false;
      if (statusFilter !== "all" && statusFilter !== "attention" && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.guest_name.toLowerCase().includes(q) ||
        b.reference.toLowerCase().includes(q) ||
        b.therapy_title.toLowerCase().includes(q) ||
        (digits.length >= 3 && b.guest_phone.includes(digits))
      );
    });
  }, [inRange, statusFilter, query]);

  const byDate = useMemo(() => {
    const groups = new Map<string, Booking[]>();
    for (const b of visible) groups.set(b.booking_date, [...(groups.get(b.booking_date) ?? []), b]);
    return [...groups.entries()];
  }, [visible]);

  const copyReference = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(reference);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard blocked
    }
  };

  const segment = (active: boolean) =>
    `cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all ${
      active ? "bg-[#c5a880] font-semibold text-[#07090b] shadow-[0_6px_20px_-8px_rgba(197,168,128,0.8)]" : "text-[#e8ded2]/70 hover:text-[#f7f4ee]"
    }`;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <section className={`${CARD} space-y-3 p-3 sm:p-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-x-auto rounded-full border border-white/10 bg-black/30 p-1">
            {([
              ["today", "Today"],
              ["upcoming", "Upcoming"],
              ["past", "Last 30 days"],
            ] as [Range, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setRange(id)} className={segment(range === id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e8ded2]/40" />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search name, phone, reference…"
              className="w-full rounded-full border border-white/10 bg-black/30 py-2.5 pl-10 pr-9 text-sm text-[#f7f4ee] placeholder:text-[#e8ded2]/35 focus:border-[#c5a880]/60 focus:outline-none"
            />
            {query && (
              <button onClick={() => onQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#e8ded2]/50">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => bookingsCsv(visible)}
            disabled={visible.length === 0}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm transition-colors hover:border-[#c5a880]/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {([
            ["all", "All"],
            ["attention", "Needs attention"],
            ["confirmed", "Confirmed"],
            ["completed", "Done"],
            ["cancelled", "Cancelled"],
          ] as [StatusFilter, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => onStatusFilter(id)}
              className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                statusFilter === id ? "border-[#c5a880] bg-[#c5a880]/15 text-[#f7f4ee]" : "border-white/10 text-[#e8ded2]/65 hover:border-white/25"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-px text-[10px] ${statusFilter === id ? "bg-[#c5a880] text-[#07090b]" : "bg-white/10"}`}>
                {counts[id]}
              </span>
            </button>
          ))}
        </div>
      </section>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center">
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-[#c5a880]" />
          <p className="text-sm text-[#e8ded2]/70">
            {query || statusFilter !== "all" ? "No bookings match these filters." : range === "today" ? "No bookings for today yet." : "No bookings here yet."}
          </p>
          {(query || statusFilter !== "all") && (
            <button
              onClick={() => {
                onQuery("");
                onStatusFilter("all");
              }}
              className="mt-3 cursor-pointer text-sm text-[#c5a880] underline underline-offset-4"
            >
              Clear filters
            </button>
          )}
          {range === "today" && !query && statusFilter === "all" && (
            <button onClick={() => setRange("upcoming")} className="mt-3 cursor-pointer text-sm text-[#c5a880] underline underline-offset-4">
              See upcoming bookings
            </button>
          )}
        </div>
      ) : (
        byDate.map(([date, list]) => {
          const dayTotal = list.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.amount_inr, 0);
          return (
            <section key={date} className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-white/[0.06] pb-2">
                <h2 className="font-serif text-xl">
                  {dayLabel(date)}
                  {dayLabel(date) !== prettyDate(date) && <span className="ml-2 font-sans text-xs text-[#e8ded2]/45">{prettyDate(date)}</span>}
                </h2>
                <span className="font-mono text-xs text-[#e8ded2]/55">
                  {list.length} {list.length === 1 ? "booking" : "bookings"} · {rupees(dayTotal)}
                </span>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                {list.map((b) => {
                  const payment = paymentState(b);
                  const style = STATUS_STYLE[b.status];
                  return (
                    <article
                      key={b.id}
                      className={`relative overflow-hidden rounded-3xl border bg-[#0c1015] p-4 pl-6 transition-colors sm:p-5 sm:pl-7 ${
                        b.status === "pending_confirmation" ? "border-amber-400/40" : "border-white/10 hover:border-white/20"
                      } ${b.status === "cancelled" ? "opacity-60" : ""}`}
                    >
                      <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${style.bar}`} />

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif text-2xl text-[#c5a880]">{slotLabel(b)}</span>
                            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px]">{BRANCHES[b.branch].city}</span>
                            {fresh.has(b.id) && (
                              <span className="rounded-full bg-[#c5a880] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#07090b]">New</span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-lg font-semibold">{b.guest_name}</p>
                          <p className="text-sm text-[#e8ded2]/70">
                            {b.therapy_title} · {b.minutes} min
                            {b.therapist_pref !== "any" && <span className="text-[#d9bb8e]"> · {b.therapist_pref} therapist</span>}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="block font-serif text-2xl">{rupees(b.amount_inr)}</span>
                          <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] ${style.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} /> {style.label}
                          </span>
                        </div>
                      </div>

                      {b.notes && <p className="mt-3 rounded-2xl bg-white/[0.04] px-3.5 py-2.5 text-sm italic text-[#e8ded2]/70">“{b.notes}”</p>}

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`rounded-full border px-2.5 py-0.5 ${payment.className}`}>{payment.label}</span>
                        <button
                          onClick={() => void copyReference(b.reference)}
                          className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[#e8ded2]/55 hover:text-[#f7f4ee]"
                          title="Copy reference"
                        >
                          {copied === b.reference ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                          {b.reference}
                        </button>
                        <span className="text-[#e8ded2]/40">
                          booked {new Date(b.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
                        <a
                          href={`tel:+91${b.guest_phone}`}
                          className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-sm transition-colors hover:border-[#c5a880]/60"
                        >
                          <Phone className="h-3.5 w-3.5" /> {b.guest_phone}
                        </a>
                        <a
                          href={bookingWhatsapp(b)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-full bg-[#25D366]/15 px-3.5 py-2 text-sm text-[#5ee08f] transition-colors hover:bg-[#25D366]/25"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                        <span className="flex-1" />
                        {(b.status === "pending_confirmation" || b.status === "confirmed") && (
                          <button
                            disabled={busyRef === b.reference}
                            onClick={() => onMove(b)}
                            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-sm transition-colors hover:border-[#c5a880]/60 disabled:opacity-50"
                          >
                            <CalendarClock className="h-3.5 w-3.5" /> Move
                          </button>
                        )}
                        {ACTIONS[b.status].map((action) => (
                          <button
                            key={action.to}
                            disabled={busyRef === b.reference}
                            onClick={() => onChangeStatus(b, action.to)}
                            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all disabled:cursor-wait disabled:opacity-50 ${
                              action.tone === "primary"
                                ? "bg-[#c5a880] text-[#07090b] hover:brightness-110"
                                : "border border-[#e0785e]/40 text-[#e0785e] hover:bg-[#e0785e]/10"
                            }`}
                          >
                            {busyRef === b.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : action.label}
                          </button>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

export type { StatusFilter };
