"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Sparkles, X, ArrowRight, ShieldCheck, Eye, Compass } from "lucide-react";

interface Hotspot {
  id: string;
  title: string;
  subtitle: string;
  x: number; // percentage from left
  y: number; // percentage from top
  image: string;
  badge: string;
  description: string;
  specs: string[];
  hygieneNote: string;
}

const SUITE_HOTSPOTS: Hotspot[] = [
  {
    id: "hotspot-stones",
    title: "120°C Autoclaved Volcanic Basalt Stones",
    subtitle: "Organic Bali Basalt • Deep Knot Dissolution",
    x: 15,
    y: 69,
    image: "/images/suite-hotspot-stones.jpg",
    badge: "SIGNATURE AMENITY",
    description:
      "Hand-carved dark granite thermal warming basin maintaining authentic Indonesian volcanic basalt stones at an exact therapeutic 54°C to glide over chronic muscle stiffness.",
    specs: [
      "Natural heat retention for 45+ minutes",
      "Autoclave medical-grade sterilized after every guest",
      "Infused with warm lavender mineral bath",
    ],
    hygieneNote: "100% Autoclaved at 120°C • Zero Re-use without sterilization",
  },
  {
    id: "hotspot-oils",
    title: "Artisanal Pure Essential Oil Bar",
    subtitle: "First Cold-Pressed Distillates • Custom Blended",
    x: 7,
    y: 38,
    image: "/images/suite-hotspot-oils.jpg",
    badge: "100% ORGANIC",
    description:
      "Our apothecary shelf houses organic Himalayan Kashmir Lavender, Australian Blue Gum Eucalyptus, and cold-pressed Sweet Almond carrier oils, calibrated fresh for each treatment.",
    specs: [
      "Zero mineral oils, parabens or synthetic perfumes",
      "Hypoallergenic cold-pressed carrier bases",
      "Calibrated absorption rate for effortless gliding",
    ],
    hygieneNote: "Single-dispenser hygienic amber droppers • Fresh batch daily",
  },
  {
    id: "hotspot-bed",
    title: "Heated Ergonomic Contoured Therapy Bed",
    subtitle: "Contoured Memory Core • Pure Egyptian Cotton",
    x: 58,
    y: 56,
    image: "/images/suite-hotspot-bed.jpg",
    badge: "MAXIMUM COMFORT",
    description:
      "Engineered with 4-zone therapeutic density and integrated gentle surface warming to soothe spinal compression the moment you lie down.",
    specs: [
      "Plush 400-thread count sanitized Egyptian cotton linen",
      "Contoured cervical face cradle with zero nasal pressure",
      "Independent lumbar temperature calibration",
    ],
    hygieneNote: "Fresh sealed linen kit opened exclusively in your presence",
  },
  {
    id: "hotspot-shower",
    title: "Private En-Suite Hot Rain Shower",
    subtitle: "Brushed Brass • Botanical Steam & Wash",
    x: 87,
    y: 35,
    image: "/images/suite-hotspot-shower.jpg",
    badge: "ATTACHED TO EVERY ROOM",
    description:
      "Never walk down a shared corridor. Every private therapy suite at Alexa Spa features an attached hot rain shower with organic botanical wash and plush waffle towels.",
    specs: [
      "High-flow rainfall head with instant pressurized hot water",
      "Organic Bergamot & Eucalyptus body wash and shampoo",
      "Anti-slip slate thermal stone flooring",
    ],
    hygieneNote: "Deep chemical sterilization & steam wiped between every session",
  },
];

interface SanctuarySuiteTourProps {
  onOpenReservation: (experienceId?: string) => void;
}

export default function SanctuarySuiteTour({ onOpenReservation }: SanctuarySuiteTourProps) {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredHotspots =
    activeFilter === "all"
      ? SUITE_HOTSPOTS
      : SUITE_HOTSPOTS.filter((h) => h.id === activeFilter);

  return (
    <section id="sanctuary-tour" className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto select-none">
      {/* Editorial Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c5a880]/10 border border-[#c5a880]/25 text-[#c5a880] text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em]">
          <Compass className="w-3.5 h-3.5 animate-spin-slow" />
          <span>Interactive 360° Suite Explorer</span>
        </div>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-light text-[#f7f4ee] leading-tight">
          Inspect your private suite <span className="italic text-[#c5a880]">before you arrive.</span>
        </h2>

        <p className="text-sm sm:text-base text-[#e8ded2]/75 font-sans leading-relaxed">
          Tap the glowing golden pins on any amenity below to inspect our attached hot shower,
          medical-grade stone sterilization, and organic aromatherapy apothecary.
        </p>

        {/* Filter Quick Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-full text-xs font-sans font-medium transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-[#c5a880] text-[#07090b] shadow-lg shadow-[#c5a880]/20"
                : "bg-[#0b0f12]/80 border border-white/10 text-[#e8ded2]/70 hover:text-white hover:border-[#c5a880]/40"
            }`}
          >
            All Amenities ({SUITE_HOTSPOTS.length})
          </button>
          {SUITE_HOTSPOTS.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                setActiveFilter(h.id);
                setActiveHotspot(h);
              }}
              className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer ${
                activeFilter === h.id
                  ? "bg-[#c5a880] text-[#07090b] font-medium shadow-lg shadow-[#c5a880]/20"
                  : "bg-[#0b0f12]/80 border border-white/10 text-[#e8ded2]/70 hover:text-white hover:border-[#c5a880]/40"
              }`}
            >
              {h.title.split(" ")[0]} {h.title.split(" ")[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Panoramic Frame */}
      <div
        ref={containerRef}
        className="relative w-full rounded-3xl overflow-hidden border border-white/[0.14] bg-[#07090b] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] aspect-[16/10] sm:aspect-[16/9]"
      >
        {/* Panoramic Background Photo */}
        <Image
          src="/images/suite-panoramic-luxury.jpg"
          alt="Alexa Spa Luxury VIP Suite Interior"
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover object-center transform transition-transform duration-700 hover:scale-[1.02]"
        />

        {/* Ambient Vignette & Golden Light Reflections */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090b]/80 via-transparent to-[#07090b]/40 pointer-events-none" />

        {/* Top Floating Badge */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0b0f12]/85 border border-white/10 backdrop-blur-xl text-[10px] font-mono tracking-wider text-[#d9bb8e]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>VIP SUITE 01 • PRIVATE SANCTUARY</span>
        </div>

        {/* Interactive Golden Pulse Hotspot Pins */}
        {filteredHotspots.map((hotspot) => {
          const isActive = activeHotspot?.id === hotspot.id;
          return (
            <div
              key={hotspot.id}
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <button
                onClick={() => setActiveHotspot(hotspot)}
                className="group relative flex items-center justify-center cursor-pointer p-3"
                aria-label={`Inspect ${hotspot.title}`}
              >
                {/* Pulsing Ripple Wave */}
                <span className="absolute w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#c5a880]/40 animate-ping pointer-events-none" />
                <span className="absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#c5a880]/20 animate-pulse pointer-events-none" />

                {/* Core Pin Center */}
                <span
                  className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xl ${
                    isActive
                      ? "bg-[#f7f4ee] border-[#c5a880] text-[#07090b] scale-125 shadow-[#c5a880]/60"
                      : "bg-[#0b0f12] border-[#c5a880] text-[#c5a880] group-hover:bg-[#c5a880] group-hover:text-[#07090b] group-hover:scale-110"
                  }`}
                >
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </span>

                {/* Desktop Hover Quick Tooltip */}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-full bg-[#0b0f12]/95 border border-white/10 text-white text-[11px] font-sans font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-2xl backdrop-blur-md hidden sm:block">
                  {hotspot.title}
                </span>
              </button>
            </div>
          );
        })}

        {/* Bottom Instructions HUD */}
        <div className="absolute bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-6 z-20 flex items-center justify-between pointer-events-none">
          <span className="text-[10px] sm:text-xs font-mono text-[#e8ded2]/80 bg-[#0b0f12]/80 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
            Click any golden pin to inspect detail
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-[#c5a880] bg-[#0b0f12]/80 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md hidden sm:block">
            Attached Shower in 100% of Rooms
          </span>
        </div>
      </div>

      {/* Detail Macro Inspection Popover / Modal */}
      {activeHotspot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0b0f12] border border-[#c5a880]/30 shadow-2xl overflow-hidden text-[#f7f4ee]">
            {/* Close Button */}
            <button
              onClick={() => setActiveHotspot(null)}
              className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer"
              aria-label="Close detail modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid sm:grid-cols-2">
              {/* Macro Image */}
              <div className="relative h-64 sm:h-auto min-h-[260px] bg-black">
                <Image
                  src={activeHotspot.image}
                  alt={activeHotspot.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f12] via-transparent to-transparent sm:hidden" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-[#c5a880] text-[#07090b] text-[9px] font-mono font-bold tracking-wider uppercase">
                    {activeHotspot.badge}
                  </span>
                </div>
              </div>

              {/* Specifications & Narrative */}
              <div className="p-6 sm:p-7 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#c5a880] tracking-widest uppercase block">
                      {activeHotspot.subtitle}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif text-[#f7f4ee] font-light leading-snug">
                      {activeHotspot.title}
                    </h3>
                  </div>

                  <p className="text-xs text-[#e8ded2]/80 leading-relaxed font-sans">
                    {activeHotspot.description}
                  </p>

                  {/* Bullet Specs */}
                  <div className="space-y-1.5 pt-1">
                    {activeHotspot.specs.map((spec, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-[#e4d3ba]">
                        <span className="text-[#c5a880] mt-0.5">•</span>
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hygiene Seal */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/25 flex items-center gap-2.5 text-emerald-400 text-[10px] font-mono">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{activeHotspot.hygieneNote}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      setActiveHotspot(null);
                      onOpenReservation();
                    }}
                    className="flex-1 py-3 px-4 rounded-full bg-[#c5a880] hover:brightness-110 text-[#07090b] text-xs font-sans font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#c5a880]/20"
                  >
                    <span>Reserve this Suite</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setActiveHotspot(null)}
                    className="py-3 px-4 rounded-full border border-white/15 text-xs text-[#e8ded2]/70 hover:text-white hover:border-white/30 transition-all cursor-pointer"
                  >
                    Back to Tour
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
