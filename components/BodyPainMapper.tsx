"use client";

import { useState } from "react";
import { Activity, Sparkles, Droplets, Zap } from "lucide-react";
import Model, { type IExerciseData, type IMuscleStats, type Muscle } from "react-body-highlighter";
import { COMPLETE_SPA_DATA } from "@/components/ServicesMenu";

interface BodyRegion {
  id: string;
  name: string;
  symptom: string;
  /** Must match an id in COMPLETE_SPA_DATA — the price and duration shown are
      read from there, so this panel can never quote a therapy the menu
      doesn't sell or a price the menu doesn't charge. */
  therapyId: string;
  recommendedOil: string;
  pressure: string;
  description: string;
}

const BODY_REGIONS: BodyRegion[] = [
  {
    id: "neck-shoulders",
    name: "Neck & Upper Shoulders",
    symptom: "Desk stiffness, computer neck strain, trap tightness",
    therapyId: "deep-tissue",
    recommendedOil: "Alpine Eucalyptus & Camphor Blend",
    pressure: "Firm to Deep Pressure",
    description:
      "Intense myofascial trigger point release focusing on cervical spine, trapezius, and shoulder rotator cuff to dissolve chronic desk tension.",
  },
  {
    id: "lower-back",
    name: "Lower Back & Spine",
    symptom: "Sitting fatigue, lumbar compression, sciatic soreness",
    therapyId: "deep-tissue",
    recommendedOil: "Warm Juniper & Wintergreen Camphor",
    pressure: "Deep Rhythmic Compression",
    description:
      "55°C volcanic basalt stones worked along the lumbar spine with firm compression to increase deep blood flow and release compressed nerves.",
  },
  {
    id: "head-scalp",
    name: "Head, Scalp & Temples",
    symptom: "Mental fatigue, screen headaches, chronic insomnia",
    therapyId: "kansa-head",
    recommendedOil: "Cooling Brahmi & Bhringraj Nectar",
    pressure: "Gentle Marma Acupressure",
    description:
      "Traditional Ayurvedic marma point head massage with a bronze Kansa bowl and cooling botanicals, calming overactive neural pathways.",
  },
  {
    id: "legs-feet",
    name: "Legs, Calves & Soles",
    symptom: "Standing exhaustion, calf tightness, swollen feet",
    therapyId: "foot-reflexology",
    recommendedOil: "Cooling Peppermint & Lemongrass Elixir",
    pressure: "Medium to Firm Acupressure",
    description:
      "Thai reflexology stick and thumb pressure across 60+ foot reflex zones, clearing lymphatic stagnation and restoring lightness to tired legs.",
  },
  {
    id: "full-body",
    name: "Full Body Exhaustion",
    symptom: "High mental stress, sensory overload, total burnout",
    therapyId: "balinese-aromatherapy",
    recommendedOil: "Thai Lemongrass & Sweet Ylang Ylang",
    pressure: "Long Smooth Flowing Strokes",
    description:
      "Continuous rhythmic palm pressure and skin rolling from scalp to toes with warm essential oils, melting systemic nervous fatigue.",
  },
];

/** Muscle groups the anatomical model lights up for each discomfort zone. */
const ZONE_MUSCLES: Record<string, Muscle[]> = {
  "neck-shoulders": ["neck", "trapezius", "front-deltoids", "back-deltoids", "upper-back"],
  "lower-back": ["lower-back", "obliques", "gluteal"],
  "head-scalp": ["head"],
  "legs-feet": ["quadriceps", "hamstring", "calves", "knees", "left-soleus", "right-soleus"],
  "full-body": [
    "head", "neck", "trapezius", "chest", "abs", "upper-back", "lower-back",
    "biceps", "triceps", "forearm", "front-deltoids", "back-deltoids",
    "obliques", "gluteal", "quadriceps", "hamstring", "calves",
  ],
};

/** Every muscle the model can report, routed to the zone that treats it — so
    a tap on a bicep or a chest still lands on a real prescription instead of
    doing nothing. */
const MUSCLE_TO_ZONE: Partial<Record<Muscle, string>> = {
  head: "head-scalp",
  neck: "neck-shoulders",
  trapezius: "neck-shoulders",
  "upper-back": "neck-shoulders",
  "front-deltoids": "neck-shoulders",
  "back-deltoids": "neck-shoulders",
  biceps: "neck-shoulders",
  triceps: "neck-shoulders",
  forearm: "neck-shoulders",
  "lower-back": "lower-back",
  obliques: "lower-back",
  gluteal: "lower-back",
  chest: "full-body",
  abs: "full-body",
  quadriceps: "legs-feet",
  hamstring: "legs-feet",
  calves: "legs-feet",
  knees: "legs-feet",
  adductor: "legs-feet",
  abductors: "legs-feet",
  "left-soleus": "legs-feet",
  "right-soleus": "legs-feet",
};

interface BodyPainMapperProps {
  onSelectTherapy: (therapyId: string) => void;
}

export default function BodyPainMapper({ onSelectTherapy }: BodyPainMapperProps) {
  const [activeRegion, setActiveRegion] = useState<BodyRegion>(BODY_REGIONS[0]);
  const [view, setView] = useState<"anterior" | "posterior">("anterior");

  const therapy = COMPLETE_SPA_DATA.find((t) => t.id === activeRegion.therapyId);

  /** Selecting a zone also turns the model to the side that zone is on. */
  const selectRegion = (region: BodyRegion) => {
    setActiveRegion(region);
    if (region.id === "lower-back") setView("posterior");
  };

  const handleMuscleClick = ({ muscle }: IMuscleStats) => {
    const zoneId = MUSCLE_TO_ZONE[muscle];
    const region = BODY_REGIONS.find((r) => r.id === zoneId);
    if (region) setActiveRegion(region);
  };

  const modelData: IExerciseData[] = [
    { name: activeRegion.name, muscles: ZONE_MUSCLES[activeRegion.id] },
  ];

  return (
    <div className="relative w-full max-w-[1600px] mx-auto py-4 text-[#f7f4ee] select-none my-10">
      {/* Header */}
      <div className="pool pool-center text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5a880]/15 border border-[#c5a880]/30 text-[11px] font-mono tracking-widest uppercase text-[#c5a880]">
          <Activity className="w-3.5 h-3.5" />
          <span>INTERACTIVE ANATOMY DIAGNOSTIC</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f7f4ee] uppercase tracking-wide text-shade-strong">
          WHERE DOES YOUR <span className="italic text-[#c5a880]">BODY NEED RELIEF?</span>
        </h2>
        <p className="text-base text-[#f0e9df]/85 max-w-xl mx-auto font-sans leading-relaxed">
          Tap the part of the body that hurts and read the prescription beside it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left: the figure */}
        <div className="lg:col-span-4 flex flex-col items-center gap-4">

          {/* Front / back. The lumbar zone only exists on the posterior view,
              so picking it flips the model for you. */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#0b0f12]/60 backdrop-blur-md border border-white/10">
            {(["anterior", "posterior"] as const).map((side) => (
              <button
                key={side}
                onClick={() => setView(side)}
                aria-pressed={view === side}
                className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer ${
                  view === side
                    ? "bg-[#c5a880] text-[#07090b] font-bold"
                    : "text-[#e8ded2]/60 hover:text-[#f7f4ee]"
                }`}
              >
                {side === "anterior" ? "Front" : "Back"}
              </button>
            ))}
          </div>

          {/* Height-capped, not width-capped. The whole panel has to sit inside
              one screen — otherwise picking a zone and reading its prescription
              are two different scroll positions. */}
          <div className="relative w-full flex justify-center">
            <div
              aria-hidden
              className="absolute inset-0 blur-3xl opacity-70 pointer-events-none"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 45%, rgba(197,168,128,0.16), transparent 70%)",
              }}
            />

            <Model
              type={view}
              data={modelData}
              bodyColor="#1b232c"
              highlightedColors={["#c5a880"]}
              onClick={handleMuscleClick}
              style={{ position: "relative", cursor: "pointer" }}
              svgStyle={{ height: "clamp(240px, 38vh, 380px)", width: "auto" }}
            />
          </div>

          {/* Zone list. Carries the symptom copy the figure can't, works on a
              phone, and gives "Full Body" somewhere to live. */}
          <div className="w-full flex flex-wrap justify-center gap-2">
            {BODY_REGIONS.map((region) => {
              const isActive = activeRegion.id === region.id;
              return (
                <button
                  key={region.id}
                  onClick={() => selectRegion(region)}
                  aria-pressed={isActive}
                  className={`px-4 py-2 rounded-full text-[12px] font-sans tracking-wide transition-all duration-300 cursor-pointer border ${
                    isActive
                      ? "bg-[#c5a880] border-[#c5a880] text-[#07090b] font-semibold"
                      : "bg-[#0b0f12]/50 backdrop-blur-md border-white/10 text-[#e8ded2]/70 hover:border-[#c5a880]/40 hover:text-[#f7f4ee]"
                  }`}
                >
                  {region.name}
                </button>
              );
            })}
          </div>

          <p className="text-[12px] font-sans text-[#e8ded2]/65 text-center leading-relaxed max-w-[280px]">
            {activeRegion.symptom}
          </p>
        </div>

        {/* Right: Prescribed Treatment Card */}
        {/* No panel: a shade pool holds the copy and hairlines do the dividing. */}
        <div className="pool lg:col-span-8 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.09] pb-5">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-[#c5a880] uppercase">
                PRESCRIBED THERAPY
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-light text-[#f7f4ee] text-shade-strong">
                {therapy?.title ?? activeRegion.name}
              </h3>
              <p className="text-[13px] text-[#e8ded2]/75 font-mono">
                Targeting:{" "}
                <span className="text-[#e4d3ba] font-medium">{activeRegion.name}</span>
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xl sm:text-2xl font-mono text-[#c5a880] font-bold block">
                {therapy?.price}
              </span>
              <span className="text-[11px] font-mono text-[#e8ded2]/60">
                {therapy?.duration}
              </span>
            </div>
          </div>

          <p className="text-base font-light text-[#f0e9df]/90 leading-relaxed font-sans text-shade max-w-[56ch]">
            {activeRegion.description}
          </p>

          {/* Prescribed Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-white/[0.09]">
            <div className="py-4 sm:pr-7 border-b border-white/[0.09] space-y-1.5">
              <span className="text-[11px] font-mono text-[#c5a880] uppercase flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5" /> Recommended oil
              </span>
              <span className="text-sm text-[#f7f4ee] font-sans font-medium block">
                {activeRegion.recommendedOil}
              </span>
            </div>

            <div className="py-4 sm:pl-7 sm:border-l border-b border-white/[0.09] space-y-1.5">
              <span className="text-[11px] font-mono text-[#c5a880] uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Pressure calibration
              </span>
              <span className="text-sm text-[#f7f4ee] font-sans font-medium block">
                {activeRegion.pressure}
              </span>
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5">
            <div className="flex items-center gap-2 text-[13px] text-[#e4d3ba]/90 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>Includes Private Steam Shower & Herbal Tea</span>
            </div>

            <button
              onClick={() => onSelectTherapy(activeRegion.therapyId)}
              className="w-full sm:w-auto shrink-0 px-7 py-3 rounded-full bg-[#c5a880] text-[#07090b] text-[13px] font-sans font-bold tracking-wider uppercase hover:brightness-110 shadow-lg shadow-[#c5a880]/20 hover:scale-105 transition-all cursor-pointer"
            >
              Book this therapy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
