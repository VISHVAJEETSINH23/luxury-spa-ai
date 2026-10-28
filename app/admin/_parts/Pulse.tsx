"use client";

import { useMemo } from "react";
import { AlertCircle, BedDouble, CalendarClock, IndianRupee, Phone, Repeat, TrendingUp } from "lucide-react";
import { BRANCHES, SLOT_TIMES, formatSlot, type BranchId } from "@/lib/branches";
import {
  CARD,
  ROOMS_PER_BRANCH,
  STATUS_STYLE,
  addDays,
  dayLabel,
  indiaToday,
  isActive,
  needsAttention,
  openMinutes,
  rupees,
  slotLabel,
  type Booking,
  type BranchFilter,
} from "./shared";

export default function Pulse({
  bookings,
  branch,
  busyRef,
  onConfirm,
  onShowAttention,
}: {
  bookings: Booking[];
  branch: BranchFilter;
  busyRef: string | null;
  onConfirm: (b: Booking) => void;
  onShowAttention: () => void;
}) {
  const today = indiaToday();

  const data = useMemo(() => {
    const active = bookings.filter(isActive);
    const todays = active.filter((b) => b.booking_date === today);
    const branches: BranchId[] = branch === "all" ? ["sangli", "karad"] : [branch];

    // Occupancy: booked treatment minutes vs. rooms × opening hours, today.
    const capacity = branches.reduce((s, b) => s + ROOMS_PER_BRANCH * openMinutes(b), 0);
    const bookedMinutes = todays.reduce((s, b) => s + b.minutes, 0);
    const occupancy = capacity ? Math.min(100, Math.round((bookedMinutes / capacity) * 100)) : 0;

    const last30 = active.filter((b) => b.booking_date < today && b.booking_date >= addDays(today, -30));
    const avgTicket = last30.length ? Math.round(last30.reduce((s, b) => s + b.amount_inr, 0) / last30.length) : 0;

    // Guests by phone, for repeat and lapsed counts.
    const guests = new Map<string, { visits: number; last: string; upcoming: boolean }>();
    for (const b of active) {
      const g = guests.get(b.guest_phone) ?? { visits: 0, last: "", upcoming: false };
      g.visits += 1;
      if (b.booking_date >= today) g.upcoming = true;
      else if (b.booking_date > g.last) g.last = b.booking_date;
      guests.set(b.guest_phone, g);
    }
    const all = [...guests.values()];
    const repeat = all.filter((g) => g.visits >= 2).length;
    const lapsed = all.filter((g) => g.visits >= 2 && !g.upcoming && g.last && g.last < addDays(today, -30)).length;

    // 7 days back, today, 6 days ahead.
    const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 7));
    const revenueByDay = days.map((d) => ({
      date: d,
      amount: active.filter((b) => b.booking_date === d).reduce((s, b) => s + b.amount_inr, 0),
      count: active.filter((b) => b.booking_date === d).length,
    }));
    const maxDay = Math.max(1, ...revenueByDay.map((d) => d.amount));
    const weekBack = revenueByDay.slice(0, 7).reduce((s, d) => s + d.amount, 0);
    const weekAhead = revenueByDay.slice(7).reduce((s, d) => s + d.amount, 0);

    const therapyMap = new Map<string, { count: number; amount: number }>();
    for (const b of active.filter((x) => x.booking_date >= addDays(today, -30))) {
      const t = therapyMap.get(b.therapy_title) ?? { count: 0, amount: 0 };
      t.count += 1;
      t.amount += b.amount_inr;
      therapyMap.set(b.therapy_title, t);
    }
    const therapies = [...therapyMap.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 6);
    const maxTherapy = Math.max(1, ...therapies.map(([, t]) => t.count));

    const slotCounts = SLOT_TIMES.map((s) => ({ slot: s, count: active.filter((b) => b.slot_time.startsWith(s)).length }));
    const maxSlot = Math.max(1, ...slotCounts.map((s) => s.count));

    const recent = active.filter((b) => b.booking_date >= addDays(today, -30));
    const split = (["sangli", "karad"] as BranchId[]).map((id) => ({
      id,
      count: recent.filter((b) => b.branch === id).length,
      amount: recent.filter((b) => b.branch === id).reduce((s, b) => s + b.amount_inr, 0),
    }));

    return {
      todays,
      todayRevenue: todays.reduce((s, b) => s + b.amount_inr, 0),
      todayDone: todays.filter((b) => b.status === "completed").length,
      occupancy,
      freeRoomHours: Math.max(0, Math.round((capacity - bookedMinutes) / 60)),
      avgTicket,
      last30Count: last30.length,
      repeatPct: all.length ? Math.round((repeat / all.length) * 100) : 0,
      repeat,
      lapsed,
      revenueByDay,
      maxDay,
      weekBack,
      weekAhead,
      therapies,
      maxTherapy,
      slotCounts,
      maxSlot,
      split,
      attention: bookings.filter(needsAttention),
    };
  }, [bookings, branch, today]);

  const kpis = [
    { label: "Today's revenue", value: rupees(data.todayRevenue), sub: `${data.todays.length} bookings · ${data.todayDone} done`, icon: IndianRupee, tone: "text-emerald-300" },
    { label: "Room occupancy today", value: `${data.occupancy}%`, sub: `${data.freeRoomHours} room-hours still free`, icon: BedDouble, tone: "text-[#d9bb8e]", meter: data.occupancy },
    { label: "Average bill (30 days)", value: rupees(data.avgTicket), sub: `from ${data.last30Count} visits`, icon: TrendingUp, tone: "text-[#d9bb8e]" },
    { label: "Repeat guests", value: `${data.repeatPct}%`, sub: data.lapsed ? `${data.lapsed} regulars haven't returned in 30 days` : `${data.repeat} guests came back`, icon: Repeat, tone: data.lapsed ? "text-amber-300" : "text-[#d9bb8e]" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`${CARD} space-y-2.5 p-5 transition-all hover:border-[#c5a880]/40 sm:p-6`}>
              <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <span>{k.label}</span>
                <Icon className={`h-5 w-5 ${k.tone}`} />
              </div>
              <div className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">{k.value}</div>
              {k.meter !== undefined && (
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#c5a880] to-[#e4d3ba] transition-all" style={{ width: `${k.meter}%` }} />
                </div>
              )}
              <span className={`block font-mono text-xs font-bold ${k.tone}`}>{k.sub}</span>
            </div>
          );
        })}
      </section>

      {/* Needs attention */}
      {data.attention.length > 0 && (
        <section className="rounded-3xl border border-amber-400/30 bg-amber-400/[0.06] p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-200">
              <AlertCircle className="h-4 w-4" /> {data.attention.length} {data.attention.length === 1 ? "booking needs" : "bookings need"} your attention
            </h2>
            <button onClick={onShowAttention} className="cursor-pointer text-xs text-amber-200/80 underline underline-offset-4">
              Open in Bookings
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {data.attention.slice(0, 8).map((b) => (
              <div key={b.id} className="min-w-[240px] flex-1 rounded-2xl border border-white/10 bg-[#0b0f12]/80 p-3.5">
                <p className="text-sm font-semibold">{b.guest_name}</p>
                <p className="text-xs text-[#e8ded2]/60">
                  {dayLabel(b.booking_date)} · {slotLabel(b)} · {BRANCHES[b.branch].city}
                </p>
                <p className="mt-1 text-xs text-[#e8ded2]/50">{b.therapy_title}</p>
                {b.status === "pending_confirmation" ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={busyRef === b.reference}
                      onClick={() => onConfirm(b)}
                      className="flex-1 cursor-pointer rounded-full bg-[#c5a880] py-1.5 text-xs font-semibold text-[#07090b] disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <a href={`tel:+91${b.guest_phone}`} className="flex items-center justify-center rounded-full border border-white/15 px-3 py-1.5" aria-label={`Call ${b.guest_name}`}>
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <p className="mt-3 rounded-full bg-[#e0785e]/10 px-3 py-1.5 text-center text-xs text-[#e0785e]">Paid but cancelled · refund in Razorpay</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Revenue chart */}
        <div className={`${CARD} p-6 sm:p-8 lg:col-span-7`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl">Revenue flow</h3>
              <p className="font-mono text-xs text-neutral-400">Last 7 days · next 7 days (booked)</p>
            </div>
            <div className="flex gap-5 text-right">
              <div>
                <span className="block font-mono text-[10px] uppercase text-neutral-500">Past week</span>
                <span className="font-serif text-lg">{rupees(data.weekBack)}</span>
              </div>
              <div>
                <span className="block font-mono text-[10px] uppercase text-neutral-500">Coming week</span>
                <span className="font-serif text-lg text-[#d9bb8e]">{rupees(data.weekAhead)}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex h-48 items-end gap-1.5 sm:gap-2">
            {data.revenueByDay.map((d) => {
              const isToday = d.date === today;
              const future = d.date > today;
              const h = d.amount ? Math.max(6, Math.round((d.amount / data.maxDay) * 100)) : 2;
              return (
                <div key={d.date} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-white/10 bg-[#07090b] px-2 py-1 text-[11px] group-hover:block">
                    {dayLabel(d.date)}: {rupees(d.amount)} · {d.count}
                  </div>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isToday
                        ? "bg-gradient-to-t from-[#c5a880] to-[#f0dfc2] shadow-[0_0_20px_rgba(197,168,128,0.45)]"
                        : future
                          ? "border border-dashed border-[#c5a880]/50 bg-[#c5a880]/15"
                          : "bg-[#c5a880]/60 group-hover:bg-[#c5a880]/80"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                  <span className={`font-mono text-[9px] sm:text-[10px] ${isToday ? "font-bold text-[#d9bb8e]" : "text-neutral-500"}`}>
                    {new Date(`${d.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's schedule */}
        <div className={`${CARD} p-6 sm:p-8 lg:col-span-5`}>
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl">Today&apos;s schedule</h3>
            <CalendarClock className="h-5 w-5 text-[#c5a880]" />
          </div>
          {data.todays.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-neutral-400">No bookings today yet.</p>
          ) : (
            <ol className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">
              {data.todays.map((b) => (
                <li key={b.id} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 font-mono text-xs text-[#d9bb8e]">{slotLabel(b)}</span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_STYLE[b.status].dot}`} />
                  <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <p className="truncate text-sm font-semibold">{b.guest_name}</p>
                    <p className="truncate text-xs text-neutral-400">
                      {b.therapy_title} · {b.minutes}m · {BRANCHES[b.branch].city}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top therapies */}
        <div className={`${CARD} p-6`}>
          <h3 className="font-serif text-lg">Top therapies</h3>
          <p className="font-mono text-[11px] text-neutral-500">Last 30 days + upcoming</p>
          {data.therapies.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No data yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.therapies.map(([title, t]) => (
                <li key={title}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate pr-2">{title}</span>
                    <span className="shrink-0 font-mono text-xs text-neutral-400">
                      {t.count} · {rupees(t.amount)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#c5a880]" style={{ width: `${(t.count / data.maxTherapy) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Busiest times */}
        <div className={`${CARD} p-6`}>
          <h3 className="font-serif text-lg">Busiest times</h3>
          <p className="font-mono text-[11px] text-neutral-500">Which slots guests pick</p>
          <ul className="mt-4 space-y-2">
            {data.slotCounts.map((s) => (
              <li key={s.slot} className="flex items-center gap-3">
                <span className="w-16 shrink-0 font-mono text-xs text-neutral-400">{formatSlot(s.slot)}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${s.count === data.maxSlot && s.count > 0 ? "bg-[#e4d3ba]" : "bg-[#c5a880]/60"}`}
                    style={{ width: `${(s.count / data.maxSlot) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-xs">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Branch split */}
        <div className={`${CARD} p-6`}>
          <h3 className="font-serif text-lg">Branch split</h3>
          <p className="font-mono text-[11px] text-neutral-500">Last 30 days + upcoming</p>
          <div className="mt-5 space-y-5">
            {data.split.map((s) => {
              const total = data.split.reduce((a, x) => a + x.count, 0) || 1;
              const pct = Math.round((s.count / total) * 100);
              return (
                <div key={s.id}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-serif text-xl">{BRANCHES[s.id].city}</span>
                    <span className="font-mono text-xs text-neutral-400">{pct}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${s.id === "sangli" ? "bg-[#c5a880]" : "bg-emerald-400/70"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1.5 font-mono text-xs text-neutral-400">
                    {s.count} bookings · {rupees(s.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
