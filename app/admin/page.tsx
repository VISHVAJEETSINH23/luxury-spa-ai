"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Bell, BellOff, Bot, CalendarDays, LogOut, RefreshCw, Sparkles, UserPlus, Users, X } from "lucide-react";
import { BRANCHES, formatSlot } from "@/lib/branches";
import { playLuxuryBookingChime } from "@/lib/sound";
import BookingsBoard, { type StatusFilter } from "./_parts/BookingsBoard";
import Customers from "./_parts/Customers";
import Insights from "./_parts/Insights";
import Pulse from "./_parts/Pulse";
import WalkInModal from "./_parts/WalkInModal";
import { addDays, dayLabel, indiaToday, needsAttention, type Booking, type BranchFilter, type Status } from "./_parts/shared";

type Tab = "pulse" | "bookings" | "customers" | "insights";

const SOUND_KEY = "alexa-admin-sound";
const TAB_KEY = "alexa-admin-tab";

/** Six months back and two ahead: enough for history, the guest list and the board. */
const HISTORY_DAYS = 180;
const AHEAD_DAYS = 60;

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("pulse");
  const [branch, setBranch] = useState<BranchFilter>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyRef, setBusyRef] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [boardQuery, setBoardQuery] = useState("");
  const [boardStatus, setBoardStatus] = useState<StatusFilter>("all");

  // References seen so far; a new one arriving on refresh means a new booking.
  const seenRef = useRef<Set<string> | null>(null);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  useEffect(() => {
    try {
      setSoundOn(localStorage.getItem(SOUND_KEY) !== "off");
      const savedTab = localStorage.getItem(TAB_KEY);
      if (savedTab === "pulse" || savedTab === "bookings" || savedTab === "customers" || savedTab === "insights") setTab(savedTab);
    } catch {
      // ignore
    }
    const timer = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(timer);
  }, []);

  const go = (next: Tab) => {
    setTab(next);
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0 });
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      // ignore
    }
    if (next) playLuxuryBookingChime();
  };

  const load = useCallback(async () => {
    const today = indiaToday();
    const params = new URLSearchParams({ branch, from: addDays(today, -HISTORY_DAYS), to: addDays(today, AHEAD_DAYS) });
    try {
      const response = await fetch(`/api/admin/bookings?${params}`, { cache: "no-store" });
      if (response.status === 401) {
        window.location.replace("/admin/login");
        return;
      }
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error();
      const list: Booking[] = data.bookings;

      // New booking alert: only on refreshes of the same view, never on first load.
      if (seenRef.current) {
        const arrived = list.filter((b) => !seenRef.current!.has(b.id));
        if (arrived.length > 0) {
          setFresh((prev) => new Set([...prev, ...arrived.map((b) => b.id)]));
          const first = arrived[0];
          setToast(
            arrived.length === 1
              ? `New booking: ${first.guest_name} · ${BRANCHES[first.branch].city} · ${dayLabel(first.booking_date)} ${formatSlot(first.slot_time.slice(0, 5))}`
              : `${arrived.length} new bookings`
          );
          if (soundOnRef.current) playLuxuryBookingChime();
        }
      }
      seenRef.current = new Set(list.map((b) => b.id));

      setBookings(list);
      setUpdatedAt(Date.now());
      setError("");
    } catch {
      setError("Couldn't load bookings. Retrying…");
    } finally {
      setLoading(false);
    }
  }, [branch]);

  useEffect(() => {
    seenRef.current = null;
    setLoading(true);
    void load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8_000);
    return () => clearTimeout(timer);
  }, [toast]);

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

  const attention = bookings.filter(needsAttention).length;
  const upcoming = bookings.filter((b) => b.booking_date >= indiaToday() && b.status !== "cancelled").length;
  const guests = new Set(bookings.map((b) => b.guest_phone)).size;
  const secondsAgo = updatedAt ? Math.round((Date.now() - updatedAt) / 1000) : null;

  const NAV: { id: Tab; label: string; short: string; icon: typeof BarChart3; badge?: string; alert?: boolean }[] = [
    { id: "pulse", label: "Business Pulse", short: "Pulse", icon: BarChart3 },
    { id: "bookings", label: "Bookings", short: "Bookings", icon: CalendarDays, badge: attention ? `${attention} new` : `${upcoming}`, alert: attention > 0 },
    { id: "customers", label: "Customers (CRM)", short: "Guests", icon: Users, badge: String(guests) },
    { id: "insights", label: "AI Insights", short: "AI", icon: Bot, badge: "AI" },
  ];

  const TITLES: Record<Tab, [string, string]> = {
    pulse: ["Business Pulse", "Revenue, occupancy and today's floor — live from your bookings"],
    bookings: ["Bookings", "Confirm, message and manage every booking"],
    customers: ["Customer CRM", "Every guest, their visits and spend — and who to invite back"],
    insights: ["AI Insights", "A weekly action plan from your own numbers"],
  };

  return (
    <div className="min-h-screen bg-[#07090b] text-[#f7f4ee]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c1218]/95 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-[#16202a] px-3.5 py-2 font-mono text-xs font-bold text-[#d9bb8e] transition-colors hover:text-white sm:flex"
            >
              <ArrowLeft className="h-4 w-4" /> WEBSITE
            </Link>
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-serif text-base font-bold tracking-widest sm:text-xl">ALEXA SPA BUSINESS OS</h1>
                <p className="font-mono text-[10px] text-neutral-400 sm:text-[11px]">
                  {secondsAgo === null ? "Connecting…" : secondsAgo < 10 ? "Live · updated just now" : `Live · updated ${secondsAgo}s ago`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-full border border-white/15 bg-[#121922] p-1 md:flex">
              {(["all", "sangli", "karad"] as BranchFilter[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setBranch(id)}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    branch === id ? "bg-[#c5a880] font-bold text-[#07090b] shadow-md" : "text-neutral-300 hover:text-white"
                  }`}
                >
                  {id === "all" ? "Both" : BRANCHES[id].city}
                </button>
              ))}
            </div>
            <button
              onClick={() => setWalkInOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-[#c5a880] to-[#e4d3ba] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#07090b] shadow-xl shadow-[#c5a880]/25 transition-all hover:brightness-110 sm:px-5"
            >
              <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">New booking</span>
            </button>
            <button
              onClick={toggleSound}
              aria-label={soundOn ? "Mute new-booking sound" : "Turn on new-booking sound"}
              title={soundOn ? "New-booking sound on" : "New-booking sound off"}
              className="cursor-pointer rounded-full border border-white/15 p-2.5 transition-colors hover:border-[#c5a880]/60"
            >
              {soundOn ? <Bell className="h-4 w-4 text-[#c5a880]" /> : <BellOff className="h-4 w-4 text-neutral-500" />}
            </button>
            <button onClick={() => void load()} aria-label="Refresh" className="hidden cursor-pointer rounded-full border border-white/15 p-2.5 transition-colors hover:border-[#c5a880]/60 sm:block">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={logout} aria-label="Logout" className="cursor-pointer rounded-full border border-white/15 p-2.5 transition-colors hover:border-[#e0785e]/60 hover:text-[#e0785e]">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Phone: tabs and branch under the header */}
        <div className="space-y-2 border-t border-white/[0.06] px-3 py-2 md:hidden">
          <nav className="grid grid-cols-4 gap-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => go(n.id)}
                  className={`relative flex cursor-pointer flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold ${
                    tab === n.id ? "bg-[#c5a880] text-[#07090b]" : "text-neutral-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {n.short}
                  {n.alert && <span className="absolute right-3 top-1.5 h-2 w-2 rounded-full bg-amber-400" />}
                </button>
              );
            })}
          </nav>
          <div className="flex rounded-full border border-white/10 bg-black/30 p-1">
            {(["all", "sangli", "karad"] as BranchFilter[]).map((id) => (
              <button
                key={id}
                onClick={() => setBranch(id)}
                className={`flex-1 cursor-pointer rounded-full py-1.5 text-xs font-semibold ${branch === id ? "bg-white/15 text-white" : "text-neutral-400"}`}
              >
                {id === "all" ? "Both branches" : BRANCHES[id].city}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-72 shrink-0 flex-col justify-between border-r border-white/10 bg-[#090e13] p-6 md:flex">
          <div className="space-y-2.5">
            <div className="px-3 pb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#d9bb8e]">{greeting()}</div>
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => go(n.id)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all ${
                    active ? "scale-[1.02] bg-[#c5a880] font-bold text-[#07090b] shadow-xl shadow-[#c5a880]/20" : "text-neutral-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <Icon className={`h-5 w-5 ${active ? "text-[#07090b]" : "text-[#c5a880]"}`} />
                    {n.label}
                  </span>
                  {n.badge && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                        active ? "bg-[#07090b] text-[#c5a880]" : n.alert ? "bg-amber-400 text-[#07090b]" : "bg-white/10 text-neutral-300"
                      }`}
                    >
                      {n.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-neutral-400">
            <p className="font-mono uppercase tracking-wider text-[#d9bb8e]">Branches</p>
            {(["sangli", "karad"] as const).map((id) => (
              <p key={id} className="flex justify-between">
                <span>{BRANCHES[id].city}</span>
                <span className="font-mono">till {formatSlot(BRANCHES[id].closesAt)}</span>
              </p>
            ))}
          </div>
        </aside>

        {/* Workspace */}
        <main className="min-w-0 flex-1 space-y-8 p-4 pb-24 sm:p-8 lg:p-10">
          <div className="flex flex-col justify-between gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-serif text-2xl font-bold tracking-wide sm:text-3xl">{TITLES[tab][0]}</h2>
              <p className="mt-1 font-mono text-xs text-neutral-400 sm:text-sm">{TITLES[tab][1]}</p>
            </div>
            <span className="font-mono text-xs text-neutral-500">
              {branch === "all" ? "Sangli + Karad" : `${BRANCHES[branch].city} branch`} ·{" "}
              {new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>

          {error && <p className="rounded-2xl border border-[#e0785e]/30 bg-[#e0785e]/10 px-4 py-3 text-sm text-[#e0785e]">{error}</p>}

          {loading && bookings.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-3xl border border-white/5 bg-white/[0.03]" />
              ))}
            </div>
          ) : tab === "pulse" ? (
            <Pulse
              bookings={bookings}
              branch={branch}
              busyRef={busyRef}
              onConfirm={(b) => void changeStatus(b, "confirmed")}
              onShowAttention={() => {
                setBoardStatus("attention");
                go("bookings");
              }}
            />
          ) : tab === "bookings" ? (
            <BookingsBoard
              bookings={bookings}
              fresh={fresh}
              busyRef={busyRef}
              onChangeStatus={(b, to) => void changeStatus(b, to)}
              query={boardQuery}
              onQuery={setBoardQuery}
              statusFilter={boardStatus}
              onStatusFilter={setBoardStatus}
            />
          ) : tab === "customers" ? (
            <Customers
              bookings={bookings}
              onViewBookings={(phone) => {
                setBoardQuery(phone);
                setBoardStatus("all");
                go("bookings");
              }}
            />
          ) : (
            <Insights />
          )}
        </main>
      </div>

      {walkInOpen && (
        <WalkInModal
          defaultBranch={branch === "all" ? "sangli" : branch}
          onClose={() => setWalkInOpen(false)}
          onCreated={(reference) => {
            setWalkInOpen(false);
            setToast(`Booking ${reference} saved`);
            void load();
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-fadeIn">
          <div className="flex items-center gap-3 rounded-2xl border border-[#c5a880]/50 bg-[#0b0f12]/95 p-4 shadow-2xl backdrop-blur">
            <Sparkles className="h-5 w-5 shrink-0 text-[#c5a880]" />
            <p className="flex-1 text-sm">{toast}</p>
            <button onClick={() => setToast(null)} aria-label="Dismiss" className="cursor-pointer text-neutral-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
