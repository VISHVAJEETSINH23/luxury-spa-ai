"use client";

import { useState } from "react";
import { AlertTriangle, Bot, Loader2, Sparkles, Target } from "lucide-react";
import { CARD, rupees } from "./shared";

interface Insight {
  headline: string;
  actions: { title: string; detail: string; impact: "high" | "medium" | "low" }[];
  watch: string[];
}

interface Stats {
  bookings_total: number;
  upcoming_next_7_days: number;
  revenue_past_inr: number;
  revenue_upcoming_inr: number;
  avg_ticket_inr: number;
  cancellation_rate_pct: number;
  unique_guests: number;
  repeat_guests: number;
  lapsed_regulars_30_days: number;
}

const IMPACT: Record<Insight["actions"][number]["impact"], string> = {
  high: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  medium: "bg-[#c5a880]/15 text-[#d9bb8e] border-[#c5a880]/30",
  low: "bg-white/5 text-neutral-300 border-white/15",
};

export default function Insights() {
  const [language, setLanguage] = useState<"en" | "hinglish">("hinglish");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ source: "ai" | "rules"; stats: Stats; insight: Insight } | null>(null);

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      if (response.status === 401) {
        window.location.replace("/admin/login");
        return;
      }
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError((e as Error).message === "TOO_MANY_REQUESTS" ? "That's a lot of analysis for one hour — try again a bit later." : "Couldn't analyse right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-[#c5a880]/30 bg-gradient-to-br from-[#c5a880]/15 via-[#0c1015] to-[#0c1015] p-6 sm:p-8">
        <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#c5a880]/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-xl space-y-2">
            <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#d9bb8e]">
              <Bot className="h-4 w-4" /> AI Business Advisor
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl">What should I do this week?</h2>
            <p className="text-sm text-neutral-300">
              Reads your real bookings from the last 60 days and the next 14 — busy slots, quiet days, repeat guests, cancellations — and
              tells you where the next rupee is. Guest names and numbers never leave the server.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3">
            <div className="flex rounded-full border border-white/15 bg-black/30 p-1">
              {([
                ["hinglish", "Hinglish"],
                ["en", "English"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setLanguage(id)}
                  className={`flex-1 cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    language === id ? "bg-[#c5a880] text-[#07090b]" : "text-neutral-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => void run()}
              disabled={loading}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#c5a880] to-[#e4d3ba] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#07090b] shadow-xl shadow-[#c5a880]/25 transition-all hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {result ? "Analyse again" : "Analyse my business"}
            </button>
          </div>
        </div>
      </section>

      {error && <p className="rounded-2xl border border-[#e0785e]/30 bg-[#e0785e]/10 px-4 py-3 text-sm text-[#e0785e]">{error}</p>}

      {loading && !result && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl border border-white/5 bg-white/[0.03]" />
          ))}
        </div>
      )}

      {result && (
        <div className={`space-y-6 ${loading ? "opacity-60" : ""}`}>
          <section className={`${CARD} p-6`}>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${result.source === "ai" ? "bg-[#c5a880] text-[#07090b]" : "bg-white/10 text-neutral-300"}`}>
                {result.source === "ai" ? "Gemini AI" : "Quick rules"}
              </span>
            </div>
            <p className="mt-3 font-serif text-xl leading-snug sm:text-2xl">{result.insight.headline}</p>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Next 7 days", `${result.stats.upcoming_next_7_days} bookings`],
              ["Revenue, last 60 days", rupees(result.stats.revenue_past_inr)],
              ["Already booked ahead", rupees(result.stats.revenue_upcoming_inr)],
              ["Cancellation rate", `${result.stats.cancellation_rate_pct}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="block font-mono text-[10px] uppercase text-neutral-500">{label}</span>
                <span className="mt-1 block font-serif text-xl">{value}</span>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 font-serif text-xl">
              <Target className="h-5 w-5 text-[#c5a880]" /> Action plan
            </h3>
            {result.insight.actions.map((a, i) => (
              <article key={a.title} className={`${CARD} flex gap-4 p-5`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c5a880]/15 font-serif text-lg text-[#d9bb8e]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">{a.title}</h4>
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase ${IMPACT[a.impact] ?? IMPACT.low}`}>{a.impact} impact</span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-300">{a.detail}</p>
                </div>
              </article>
            ))}
          </section>

          {result.insight.watch.length > 0 && (
            <section className="rounded-3xl border border-amber-400/30 bg-amber-400/[0.06] p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                <AlertTriangle className="h-4 w-4" /> Keep an eye on
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100/90">
                {result.insight.watch.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
