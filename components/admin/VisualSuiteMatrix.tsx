"use client";

import { useState } from "react";
import { Sparkles, ShieldCheck, UserCheck, Droplet, Clock } from "lucide-react";

interface SuiteState {
  id: string;
  name: string;
  type: string;
  status: "In Session" | "Available" | "Reserved";
  currentGuest?: string;
  therapy?: string;
  timeRemaining?: string;
  progressPercent?: number;
  therapist?: string;
  oil?: string;
  nextSlot?: string;
  amenities: string;
}

const INITIAL_SUITES: SuiteState[] = [
  {
    id: "suite-01",
    name: "Single En-Suite 01",
    type: "Attached Hot Rain Shower",
    status: "In Session",
    currentGuest: "Vikram Malhotra",
    therapy: "Deep Tissue & Volcanic Knot (60m)",
    timeRemaining: "28 Min Remaining",
    progressPercent: 55,
    therapist: "Pooja Sharma",
    oil: "Alpine Eucalyptus Oil",
    amenities: "Hot Rain Shower Pre-warmed",
  },
  {
    id: "suite-02",
    name: "Single En-Suite 02",
    type: "Volcanic Basalt Thermal Basin",
    status: "Available",
    nextSlot: "02:30 PM (Dr. Siddharth Verma)",
    amenities: "120°C Autoclaved Stones @ 54°C",
    therapist: "Pooja Sharma (Ready)",
    oil: "Kashmir Lavender",
  },
  {
    id: "suite-couple",
    name: "VIP Couple Sanctuary Suite",
    type: "Double Suite • Rose Petal Bath",
    status: "Reserved",
    currentGuest: "Ananya & Rohan Kapoor",
    therapy: "Royal Couple Rejuvenation (90m)",
    nextSlot: "01:00 PM Today",
    therapist: "Maya Devi & Deepak R.",
    oil: "French Lavender & Rose",
    amenities: "Rose Petal Mineral Bath & Tea Prepped",
  },
  {
    id: "suite-03",
    name: "Facial Suite 03",
    type: "24K Gold Cellular Renewal Station",
    status: "Reserved",
    currentGuest: "Meera Sen",
    therapy: "24K Gold Cellular Facial (60m)",
    nextSlot: "04:00 PM Today",
    therapist: "Sunita K.",
    oil: "White Rose Nectar",
    amenities: "Sterilized Ultrasonic Probe Ready",
  },
];

interface VisualSuiteMatrixProps {
  onFillSuiteWithAI?: (suiteName: string) => void;
}

export default function VisualSuiteMatrix({ onFillSuiteWithAI }: VisualSuiteMatrixProps) {
  const [suites, setSuites] = useState<SuiteState[]>(INITIAL_SUITES);

  const toggleStatus = (id: string) => {
    setSuites((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextStatus =
            s.status === "In Session"
              ? "Available"
              : s.status === "Available"
              ? "Reserved"
              : "In Session";
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <h3 className="text-base sm:text-lg font-serif font-bold tracking-wider text-white uppercase">
            LIVE THERAPY SUITES & OCCUPANCY HUD
          </h3>
          <span className="text-xs font-mono text-[#c5a880] bg-[#c5a880]/15 px-3 py-1 rounded-full font-bold">
            4 Suites Live
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-2 text-blue-400 font-bold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> In Session (1)
          </span>
          <span className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Available (1)
          </span>
          <span className="flex items-center gap-2 text-[#c5a880] font-bold bg-[#c5a880]/10 px-3 py-1 rounded-full border border-[#c5a880]/20">
            <span className="w-2 h-2 rounded-full bg-[#c5a880]" /> Reserved (2)
          </span>
        </div>
      </div>

      {/* Grid of 4 Suites */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {suites.map((suite) => {
          const isInSession = suite.status === "In Session";
          const isAvailable = suite.status === "Available";
          const isReserved = suite.status === "Reserved";

          return (
            <div
              key={suite.id}
              className={`p-6 rounded-3xl border transition-all space-y-5 flex flex-col justify-between shadow-xl ${
                isInSession
                  ? "bg-[#0b141d] border-blue-500/40 shadow-blue-950/30"
                  : isAvailable
                  ? "bg-[#091712] border-emerald-500/40 shadow-emerald-950/30"
                  : "bg-[#16140f] border-[#c5a880]/40 shadow-amber-950/30"
              }`}
            >
              <div className="space-y-3.5">
                {/* Header Tag */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block font-semibold">
                      {suite.type}
                    </span>
                    <h4 className="text-base sm:text-lg font-serif font-bold text-white leading-tight">
                      {suite.name}
                    </h4>
                  </div>

                  <button
                    onClick={() => toggleStatus(suite.id)}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider cursor-pointer transition-all ${
                      isInSession
                        ? "bg-blue-500/25 text-blue-300 border border-blue-400/50 shadow-sm"
                        : isAvailable
                        ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-sm"
                        : "bg-[#c5a880]/25 text-[#f7f4ee] border border-[#c5a880]/50 shadow-sm"
                    }`}
                  >
                    {suite.status.toUpperCase()}
                  </button>
                </div>

                {/* Session Progress / Upcoming Info */}
                {isInSession && (
                  <div className="space-y-2.5 p-4 rounded-2xl bg-black/60 border border-white/10">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-white text-sm">{suite.currentGuest}</span>
                      <span className="text-blue-300">{suite.timeRemaining}</span>
                    </div>
                    {/* Live Progress Bar */}
                    <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-300 rounded-full animate-pulse"
                        style={{ width: `${suite.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-sans text-neutral-300 block truncate font-medium">
                      {suite.therapy}
                    </span>
                  </div>
                )}

                {isAvailable && (
                  <div className="space-y-2 p-4 rounded-2xl bg-black/60 border border-white/10 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sanitized & Steam Ready</span>
                    </div>
                    <span className="text-xs font-mono text-neutral-300 block font-medium">
                      Next: {suite.nextSlot}
                    </span>
                  </div>
                )}

                {isReserved && (
                  <div className="space-y-1.5 p-4 rounded-2xl bg-black/60 border border-white/10 text-xs">
                    <span className="text-sm font-serif text-white font-bold block">
                      {suite.currentGuest}
                    </span>
                    <span className="text-xs font-mono text-[#c5a880] block font-medium">
                      {suite.nextSlot} • {suite.therapy}
                    </span>
                  </div>
                )}

                {/* Staff & Oil Note */}
                <div className="space-y-1.5 text-xs font-mono text-neutral-300 pt-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                    <span className="truncate font-semibold">{suite.therapist}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplet className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                    <span className="truncate">{suite.oil}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-3 border-t border-white/10">
                {isAvailable ? (
                  <button
                    onClick={() => onFillSuiteWithAI && onFillSuiteWithAI(suite.name)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#c5a880] hover:brightness-110 text-[#07090b] text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#c5a880]/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Fill Suite with AI Deal</span>
                  </button>
                ) : (
                  <span className="text-xs font-mono text-neutral-400 block text-center truncate">
                    {suite.amenities}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
