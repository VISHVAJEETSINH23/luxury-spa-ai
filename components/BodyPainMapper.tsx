"use client";

import { useState } from "react";
import { Activity, Sparkles, Clock, Zap } from "lucide-react";
import Model, { type IExerciseData, type IMuscleStats, type Muscle } from "react-body-highlighter";
import { COMPLETE_SPA_DATA, formatRupees } from "@/lib/treatments";
import { BODY_ZONES, type BodyZone } from "@/lib/bodyZones";
import { getTherapyDetail } from "@/lib/therapyDetails";
import { GUEST_LANGUAGES, useGuestLanguage, type GuestLanguage } from "@/lib/guestLanguage";

/** Muscle groups the anatomical model lights up for each discomfort zone. */
const ZONE_MUSCLES: Record<string, Muscle[]> = {
  "neck-shoulders": ["neck", "trapezius", "front-deltoids", "back-deltoids", "upper-back"],
  "lower-back": ["lower-back", "obliques", "gluteal"],
  "stress-sleep": ["head"],
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
  head: "stress-sleep",
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

const COPY: Record<
  GuestLanguage,
  {
    eyebrow: string;
    titleStart: string;
    titleAccent: string;
    intro: string;
    front: string;
    back: string;
    prescribed: string;
    targeting: string;
    length: string;
    pressure: string;
    bestFor: string;
    whatHappens: string;
    book: string;
    min: string;
    forTwo: string;
  }
> = {
  en: {
    eyebrow: "Interactive anatomy diagnostic",
    titleStart: "Where does your ",
    titleAccent: "body need relief?",
    intro: "Tap the part of the body that hurts and read the therapy we suggest beside it.",
    front: "Front",
    back: "Back",
    prescribed: "Suggested therapy",
    targeting: "Targeting",
    length: "Recommended length",
    pressure: "Pressure",
    bestFor: "Best for",
    whatHappens: "What happens in your session",
    book: "Book this therapy",
    min: "min",
    forTwo: "for 2",
  },
  hi: {
    eyebrow: "इंटरैक्टिव बॉडी मैप",
    titleStart: "आपके शरीर को ",
    titleAccent: "कहाँ आराम चाहिए?",
    intro: "जहाँ दर्द है, शरीर के उस हिस्से पर टैप करें — बगल में आपके लिए सही थेरेपी दिखेगी।",
    front: "आगे",
    back: "पीछे",
    prescribed: "सुझाई गई थेरेपी",
    targeting: "किस हिस्से के लिए",
    length: "सुझाया गया समय",
    pressure: "दबाव",
    bestFor: "किसके लिए अच्छा",
    whatHappens: "आपके सेशन में क्या होता है",
    book: "यह थेरेपी बुक करें",
    min: "मिनट",
    forTwo: "दो लोगों के लिए",
  },
  mr: {
    eyebrow: "इंटरॅक्टिव्ह बॉडी मॅप",
    titleStart: "तुमच्या शरीराला ",
    titleAccent: "कुठे आराम हवा आहे?",
    intro: "जिथे दुखतंय, शरीराच्या त्या भागावर टॅप करा — बाजूला तुमच्यासाठी योग्य थेरपी दिसेल.",
    front: "पुढे",
    back: "मागे",
    prescribed: "सुचवलेली थेरपी",
    targeting: "कोणत्या भागासाठी",
    length: "सुचवलेला वेळ",
    pressure: "दाब",
    bestFor: "कोणासाठी उत्तम",
    whatHappens: "तुमच्या सेशनमध्ये काय होतं",
    book: "ही थेरपी बुक करा",
    min: "मिनिटे",
    forTwo: "दोघांसाठी",
  },
};

interface BodyPainMapperProps {
  /** Opens booking with the therapy and the length this zone recommends. */
  onSelectTherapy: (therapyId: string, minutes: number) => void;
}

export default function BodyPainMapper({ onSelectTherapy }: BodyPainMapperProps) {
  const [activeZone, setActiveZone] = useState<BodyZone>(BODY_ZONES[0]);
  const [view, setView] = useState<"anterior" | "posterior">("anterior");
  const [language, setLanguage] = useGuestLanguage();

  const copy = COPY[language];
  const zoneText = activeZone.text[language];
  const therapy = COMPLETE_SPA_DATA.find((t) => t.id === activeZone.therapyId);
  const detail = getTherapyDetail(activeZone.therapyId, language);
  // The price for the length this zone recommends, straight from the menu.
  const option = therapy?.options.find((o) => o.minutes === activeZone.minutes) ?? therapy?.options[0];

  /** Selecting a zone also turns the model to the side that zone is on. */
  const selectZone = (zone: BodyZone) => {
    setActiveZone(zone);
    if (zone.id === "lower-back") setView("posterior");
  };

  const handleMuscleClick = ({ muscle }: IMuscleStats) => {
    const zoneId = MUSCLE_TO_ZONE[muscle];
    const zone = BODY_ZONES.find((z) => z.id === zoneId);
    if (zone) setActiveZone(zone);
  };

  const modelData: IExerciseData[] = [
    { name: activeZone.text.en.name, muscles: ZONE_MUSCLES[activeZone.id] },
  ];

  return (
    <div className="relative w-full max-w-[1600px] mx-auto py-4 text-[#f7f4ee] select-none my-10">
      {/* Header */}
      <div className="pool pool-center text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5a880]/15 border border-[#c5a880]/30 text-[11px] font-mono tracking-widest uppercase text-[#c5a880]">
          <Activity className="w-3.5 h-3.5" />
          <span>{copy.eyebrow}</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f7f4ee] uppercase tracking-wide text-shade-strong">
          {copy.titleStart}
          <span className="italic text-[#c5a880]">{copy.titleAccent}</span>
        </h2>
        <p className="text-base text-[#f0e9df]/85 max-w-xl mx-auto font-sans leading-relaxed">
          {copy.intro}
        </p>
        <div className="flex items-center justify-center gap-1.5 pt-1" role="group" aria-label="Language">
          {GUEST_LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              aria-pressed={language === lang.id}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 font-sans text-xs transition-all ${
                language === lang.id
                  ? "bg-[#c5a880] font-bold text-[#07090b]"
                  : "border border-white/10 bg-[#0b0f12]/50 text-[#e8ded2]/70 hover:border-[#c5a880]/50"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
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
                {side === "anterior" ? copy.front : copy.back}
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
            {BODY_ZONES.map((zone) => {
              const isActive = activeZone.id === zone.id;
              return (
                <button
                  key={zone.id}
                  onClick={() => selectZone(zone)}
                  aria-pressed={isActive}
                  className={`px-4 py-2 rounded-full text-[12px] font-sans tracking-wide transition-all duration-300 cursor-pointer border ${
                    isActive
                      ? "bg-[#c5a880] border-[#c5a880] text-[#07090b] font-semibold"
                      : "bg-[#0b0f12]/50 backdrop-blur-md border-white/10 text-[#e8ded2]/70 hover:border-[#c5a880]/40 hover:text-[#f7f4ee]"
                  }`}
                >
                  {zone.text[language].name}
                </button>
              );
            })}
          </div>

          <p className="text-[12px] font-sans text-[#e8ded2]/65 text-center leading-relaxed max-w-[280px]">
            {zoneText.symptom}
          </p>
        </div>

        {/* Right: Prescribed Treatment Card */}
        {/* No panel: a shade pool holds the copy and hairlines do the dividing. */}
        <div className="pool lg:col-span-8 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.09] pb-5">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-[#c5a880] uppercase">
                {copy.prescribed}
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-light text-[#f7f4ee] text-shade-strong">
                {therapy?.title ?? zoneText.name}
              </h3>
              <p className="text-[13px] text-[#e8ded2]/75 font-mono">
                {copy.targeting}:{" "}
                <span className="text-[#e4d3ba] font-medium">{zoneText.name}</span>
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xl sm:text-2xl font-mono text-[#c5a880] font-bold block">
                {option ? formatRupees(option.price) : therapy?.price}
              </span>
              <span className="text-[11px] font-mono text-[#e8ded2]/60">
                {option?.minutes} {copy.min}
                {therapy?.forTwo ? ` · ${copy.forTwo}` : ""}
              </span>
            </div>
          </div>

          <p className="text-base font-light text-[#f0e9df]/90 leading-relaxed font-sans text-shade max-w-[56ch]">
            {zoneText.description}
          </p>

          {detail && (
            <div className="space-y-3">
              <span className="block text-[11px] font-mono text-[#c5a880] uppercase tracking-wider">
                {copy.whatHappens}
              </span>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {detail.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm font-sans text-[#f7f4ee]/90 leading-relaxed">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#c5a880]/50 font-mono text-[10px] text-[#c5a880]">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Prescribed Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-white/[0.09]">
            <div className="py-4 sm:pr-7 border-b border-white/[0.09] space-y-1.5">
              <span className="text-[11px] font-mono text-[#c5a880] uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {copy.length}
              </span>
              <span className="text-sm text-[#f7f4ee] font-sans font-medium block">
                {activeZone.minutes} {copy.min}
              </span>
            </div>

            <div className="py-4 sm:pl-7 sm:border-l border-b border-white/[0.09] space-y-1.5">
              <span className="text-[11px] font-mono text-[#c5a880] uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> {copy.pressure}
              </span>
              <span className="text-sm text-[#f7f4ee] font-sans font-medium block">
                {detail?.pressure ?? therapy?.pressure}
              </span>
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5">
            <div className="flex items-center gap-2 text-[13px] text-[#e4d3ba]/90 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>
                {copy.bestFor}: {detail?.bestFor ?? therapy?.bestFor}
              </span>
            </div>

            <button
              onClick={() => onSelectTherapy(activeZone.therapyId, activeZone.minutes)}
              className="w-full sm:w-auto shrink-0 px-7 py-3 rounded-full bg-[#c5a880] text-[#07090b] text-[13px] font-sans font-bold tracking-wider uppercase hover:brightness-110 shadow-lg shadow-[#c5a880]/20 hover:scale-105 transition-all cursor-pointer"
            >
              {copy.book}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
