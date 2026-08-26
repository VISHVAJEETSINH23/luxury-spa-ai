"use client";

import { useEffect, useState } from "react";
import { Sparkles, Clock, ShieldCheck, UserCheck, Flame } from "lucide-react";

const LIVE_UPDATES = [
  {
    icon: ShieldCheck,
    color: "#34d399",
    label: "SUITE READINESS",
    text: "Private Suites 01 & 02: Autoclaved & Hot Showers Pre-heated",
  },
  {
    icon: Clock,
    color: "#f59e0b",
    label: "TODAY'S SLOTS",
    text: "Upcoming Slots Today: 4:30 PM & 6:15 PM • Only 2 Private Suites Left",
  },
  {
    icon: Flame,
    color: "#fb7185",
    label: "VOLCANIC BASALT",
    text: "Basalt Thermal Stones pre-warmed to therapeutic 54°C in granite basin",
  },
  {
    icon: UserCheck,
    color: "#60a5fa",
    label: "THERAPISTS ON DUTY",
    text: "Senior Certified Therapists: Ananya (Swedish/Deep Tissue) & Rajesh (Balinese)",
  },
];

export default function FrontDeskLiveTicker() {
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % LIVE_UPDATES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const current = LIVE_UPDATES[index];
  const Icon = current.icon;

  return (
    <div className="w-full bg-[#080c10] border-y border-white/[0.08] py-3.5 px-4 sm:px-6 relative overflow-hidden select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Live Status Pulse */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">LIVE SANCTUARY STATUS</span>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Rotating Live Update Text */}
          <div className="flex items-center gap-2 overflow-hidden">
            <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: current.color }} />
            <span className="text-[10px] font-mono text-[#c5a880] shrink-0 uppercase tracking-wider hidden md:inline">
              [{current.label}]:
            </span>
            <span className="text-[#f0e9df] text-xs font-sans truncate font-light">
              {current.text}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Link */}
        <div className="flex items-center gap-4 text-[11px] font-mono shrink-0">
          <span className="text-white/40 hidden lg:inline">Open 7 Days (10 AM - 10 PM)</span>
          <a
            href="https://wa.me/919820012345?text=Hi%20Alexa%20Spa,%20I%20would%20like%20to%20check%20today%27s%20available%20slots."
            target="_blank"
            rel="noreferrer"
            className="text-[#c5a880] hover:text-white underline underline-offset-4 flex items-center gap-1 transition-colors"
          >
            <span>Check Instant WhatsApp Slots</span>
            <span>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
