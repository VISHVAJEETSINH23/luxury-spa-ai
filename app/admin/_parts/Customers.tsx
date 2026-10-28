"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Crown, Download, MessageCircle, Phone, Search, Users, X } from "lucide-react";
import { BRANCHES, BRAND, type BranchId } from "@/lib/branches";
import { CARD, addDays, dayLabel, downloadCsv, indiaToday, isActive, prettyDate, rupees, whatsappUrl, type Booking } from "./shared";

type Segment = "all" | "vip" | "regular" | "new" | "lapsed";

interface Guest {
  phone: string;
  name: string;
  email: string | null;
  visits: number;
  spent: number;
  lastVisit: string | null;
  nextVisit: string | null;
  favourite: string;
  branch: BranchId;
  cancelled: number;
  segment: Exclude<Segment, "all">;
}

const SEGMENT_STYLE: Record<Exclude<Segment, "all">, { label: string; className: string }> = {
  vip: { label: "VIP", className: "bg-gradient-to-r from-[#c5a880] to-[#f0dfc2] text-[#07090b]" },
  regular: { label: "Regular", className: "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30" },
  new: { label: "New", className: "bg-sky-400/10 text-sky-300 border border-sky-400/30" },
  lapsed: { label: "Lapsed", className: "bg-amber-400/15 text-amber-300 border border-amber-400/30" },
};

/** VIP: 4+ visits or ₹10,000+ spent. Lapsed: came back before, nothing in 30 days, nothing booked. */
function buildGuests(bookings: Booking[], today: string): Guest[] {
  const map = new Map<string, Booking[]>();
  for (const b of bookings) map.set(b.guest_phone, [...(map.get(b.guest_phone) ?? []), b]);

  return [...map.entries()].map(([phone, list]) => {
    const kept = list.filter(isActive);
    const past = kept.filter((b) => b.booking_date < today || b.status === "completed");
    const future = kept.filter((b) => b.booking_date >= today && b.status !== "completed");
    const latest = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const therapyCount = new Map<string, number>();
    for (const b of kept) therapyCount.set(b.therapy_title, (therapyCount.get(b.therapy_title) ?? 0) + 1);
    const favourite = [...therapyCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? latest.therapy_title;
    const lastVisit = past.map((b) => b.booking_date).sort().pop() ?? null;
    const nextVisit = future.map((b) => b.booking_date).sort()[0] ?? null;
    const spent = kept.reduce((s, b) => s + b.amount_inr, 0);
    const visits = kept.length;

    let segment: Guest["segment"] = "new";
    if (visits >= 4 || spent >= 10_000) segment = "vip";
    else if (visits >= 2) segment = "regular";
    if (visits >= 2 && !nextVisit && lastVisit && lastVisit < addDays(today, -30)) segment = "lapsed";

    return {
      phone,
      name: latest.guest_name,
      email: latest.guest_email,
      visits,
      spent,
      lastVisit,
      nextVisit,
      favourite,
      branch: latest.branch,
      cancelled: list.length - kept.length,
      segment,
    };
  });
}

function winBackMessage(g: Guest): string {
  const branch = BRANCHES[g.branch];
  return [
    `Hello ${g.name}, it's been a while since your last visit to ${BRAND.name}, ${branch.city}.`,
    `Your ${g.favourite} is waiting for you — reply here and we'll keep your favourite slot ready.`,
  ].join("\n");
}

export default function Customers({ bookings, onViewBookings }: { bookings: Booking[]; onViewBookings: (phone: string) => void }) {
  const [segment, setSegment] = useState<Segment>("all");
  const [query, setQuery] = useState("");
  const today = indiaToday();

  const guests = useMemo(() => buildGuests(bookings, today).sort((a, b) => b.spent - a.spent), [bookings, today]);

  const counts = useMemo(() => {
    const c: Record<Segment, number> = { all: guests.length, vip: 0, regular: 0, new: 0, lapsed: 0 };
    for (const g of guests) c[g.segment] += 1;
    return c;
  }, [guests]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return guests.filter(
      (g) =>
        (segment === "all" || g.segment === segment) &&
        (!q || g.name.toLowerCase().includes(q) || (digits.length >= 3 && g.phone.includes(digits)))
    );
  }, [guests, segment, query]);

  const lifetime = guests.reduce((s, g) => s + g.spent, 0);

  const exportGuests = () =>
    downloadCsv(
      `alexa-guests-${today}.csv`,
      ["Name", "Phone", "Email", "Segment", "Visits", "Spent", "Last visit", "Next visit", "Favourite", "Branch"],
      visible.map((g) => [g.name, g.phone, g.email ?? "", SEGMENT_STYLE[g.segment].label, g.visits, g.spent, g.lastVisit ?? "", g.nextVisit ?? "", g.favourite, BRANCHES[g.branch].city])
    );

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Guests", value: String(guests.length), icon: Users },
          { label: "VIP guests", value: String(counts.vip), icon: Crown },
          { label: "Lapsed regulars", value: String(counts.lapsed), icon: CalendarDays, warn: counts.lapsed > 0 },
          { label: "Lifetime value", value: rupees(lifetime), icon: Crown },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`${CARD} p-5`}>
              <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <span>{k.label}</span>
                <Icon className={`h-4 w-4 ${k.warn ? "text-amber-300" : "text-[#c5a880]"}`} />
              </div>
              <div className={`mt-2 font-serif text-3xl font-bold ${k.warn ? "text-amber-300" : "text-white"}`}>{k.value}</div>
            </div>
          );
        })}
      </section>

      {counts.lapsed > 0 && segment !== "lapsed" && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-amber-400/30 bg-amber-400/[0.06] p-5">
          <p className="text-sm text-amber-100">
            <strong>{counts.lapsed}</strong> regular {counts.lapsed === 1 ? "guest hasn't" : "guests haven't"} been back in over 30 days. A personal WhatsApp brings most of them back.
          </p>
          <button onClick={() => setSegment("lapsed")} className="cursor-pointer rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-[#07090b]">
            Show them
          </button>
        </section>
      )}

      <section className={`${CARD} flex flex-wrap items-center gap-3 p-3 sm:p-4`}>
        <div className="flex gap-2 overflow-x-auto">
          {([
            ["all", "All"],
            ["vip", "VIP"],
            ["regular", "Regular"],
            ["new", "New"],
            ["lapsed", "Lapsed"],
          ] as [Segment, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSegment(id)}
              className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                segment === id ? "border-[#c5a880] bg-[#c5a880]/15" : "border-white/10 text-[#e8ded2]/65 hover:border-white/25"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-px text-[10px] ${segment === id ? "bg-[#c5a880] text-[#07090b]" : "bg-white/10"}`}>{counts[id]}</span>
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e8ded2]/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guest name or phone…"
            className="w-full rounded-full border border-white/10 bg-black/30 py-2.5 pl-10 pr-9 text-sm placeholder:text-[#e8ded2]/35 focus:border-[#c5a880]/60 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#e8ded2]/50">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={exportGuests}
          disabled={visible.length === 0}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm hover:border-[#c5a880]/60 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Export
        </button>
      </section>

      {visible.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-white/15 p-10 text-center text-sm text-[#e8ded2]/60">
          {guests.length === 0 ? "Guests appear here as soon as bookings come in." : "No guests match."}
        </p>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((g) => (
            <article key={g.phone} className={`${CARD} flex flex-col p-5 transition-all hover:border-[#c5a880]/40`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c5a880]/40 to-[#c5a880]/10 font-serif text-lg text-[#f0dfc2]">
                    {g.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{g.name}</p>
                    <p className="font-mono text-xs text-neutral-400">+91 {g.phone}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEGMENT_STYLE[g.segment].className}`}>
                  {SEGMENT_STYLE[g.segment].label}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-white/[0.03] p-3 text-center">
                <div>
                  <span className="block font-serif text-xl">{g.visits}</span>
                  <span className="font-mono text-[10px] uppercase text-neutral-500">Visits</span>
                </div>
                <div>
                  <span className="block font-serif text-xl text-[#d9bb8e]">{rupees(g.spent)}</span>
                  <span className="font-mono text-[10px] uppercase text-neutral-500">Spent</span>
                </div>
                <div>
                  <span className="block font-serif text-xl">{g.cancelled}</span>
                  <span className="font-mono text-[10px] uppercase text-neutral-500">Cancelled</span>
                </div>
              </div>

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-400">Favourite</dt>
                  <dd className="truncate text-right">{g.favourite}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-400">Last visit</dt>
                  <dd>{g.lastVisit ? prettyDate(g.lastVisit) : "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-400">Next booking</dt>
                  <dd className={g.nextVisit ? "text-emerald-300" : ""}>{g.nextVisit ? dayLabel(g.nextVisit) : "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-400">Branch</dt>
                  <dd>{BRANCHES[g.branch].city}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                <a href={`tel:+91${g.phone}`} className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs hover:border-[#c5a880]/60">
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
                <a
                  href={g.segment === "lapsed" ? whatsappUrl(g.phone, winBackMessage(g)) : whatsappUrl(g.phone, `Hello ${g.name}, `)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-[#25D366]/15 px-3 py-1.5 text-xs text-[#5ee08f] hover:bg-[#25D366]/25"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> {g.segment === "lapsed" ? "Invite back" : "WhatsApp"}
                </a>
                <span className="flex-1" />
                <button onClick={() => onViewBookings(g.phone)} className="cursor-pointer rounded-full px-3 py-1.5 text-xs text-[#d9bb8e] underline underline-offset-4">
                  Bookings
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
