"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Droplets,
  Clock,
  ShieldCheck,
  Bot,
  X,
  Leaf,
  ShowerHead,
  Wind,
  MessageCircle,
  Check,
  Info,
} from "lucide-react";
import { CoverflowCarousel, CoverflowSlide } from "@/components/ui/coverflow-carousel";
import FallbackImage from "@/components/ui/FallbackImage";
// The catalogue lives in lib/treatments.ts so server code (the AI routes) can
// read it too; re-exported here because half the app already imports it from
// this module.
import { COMPLETE_SPA_DATA, formatRupees, type SpaTreatmentData } from "@/lib/treatments";
import { GENERAL_NOTES, getTherapyDetail } from "@/lib/therapyDetails";
import { GUEST_LANGUAGES, useGuestLanguage, type GuestLanguage } from "@/lib/guestLanguage";

export type { SpaTreatmentData };
export { COMPLETE_SPA_DATA };

interface ServicesMenuProps {
  onOpenReservation: (experienceId?: string) => void;
  onOpenAIDoctor?: () => void;
}

const CATEGORY_TABS: { id: SpaTreatmentData["category"]; label: string }[] = [
  { id: "all", label: "All Therapies" },
  { id: "massages", label: "Massages" },
  { id: "couple", label: "For Couples" },
  { id: "specials", label: "Four Hand & Scrub" },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, title: "PRIVATE ROOMS", desc: "No shared rooms" },
  { icon: ShowerHead, title: "ATTACHED HOT SHOWER", desc: "In every therapy room" },
  { icon: Droplets, title: "FRESH LINEN", desc: "For every guest" },
  { icon: MessageCircle, title: "BOOK ONLINE", desc: "Pay online or at the spa" },
];

const SHEET_COPY: Record<
  GuestLanguage,
  {
    about: string;
    session: string;
    benefits: string;
    goodToKnow: string;
    priceList: string;
    forTwo: string;
    min: string;
    pressure: string;
    bestFor: string;
    reserve: string;
    back: string;
  }
> = {
  en: {
    about: "What is it?",
    session: "What happens in your session",
    benefits: "Benefits",
    goodToKnow: "Good to know",
    priceList: "Price list",
    forTwo: " · for two guests",
    min: "min",
    pressure: "Pressure",
    bestFor: "Best for",
    reserve: "Reserve this therapy",
    back: "Back to collection",
  },
  hi: {
    about: "यह क्या है?",
    session: "आपके सेशन में क्या होता है",
    benefits: "फायदे",
    goodToKnow: "ज़रूरी बातें",
    priceList: "रेट लिस्ट",
    forTwo: " · दो लोगों के लिए",
    min: "मिनट",
    pressure: "दबाव",
    bestFor: "किसके लिए अच्छा",
    reserve: "यह थेरेपी बुक करें",
    back: "वापस जाएँ",
  },
  mr: {
    about: "हे काय आहे?",
    session: "तुमच्या सेशनमध्ये काय होतं",
    benefits: "फायदे",
    goodToKnow: "महत्त्वाच्या गोष्टी",
    priceList: "दरपत्रक",
    forTwo: " · दोघांसाठी",
    min: "मिनिटे",
    pressure: "दाब",
    bestFor: "कोणासाठी उत्तम",
    reserve: "ही थेरपी बुक करा",
    back: "मागे जा",
  },
};

export default function ServicesMenu({ onOpenReservation, onOpenAIDoctor }: ServicesMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedServiceModal, setSelectedServiceModal] = useState<SpaTreatmentData | null>(null);
  // document.body only exists after hydration — the portal waits for it.
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useGuestLanguage();
  const sheet = SHEET_COPY[language];

  useEffect(() => setMounted(true), []);

  const filteredData = useMemo(
    () =>
      COMPLETE_SPA_DATA.filter(
        (s) => activeCategory === "all" || s.category === activeCategory
      ),
    [activeCategory]
  );

  // Counts drive the tab pills, so adding a treatment above never leaves a
  // hardcoded "(10)" lying to the guest.
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: COMPLETE_SPA_DATA.length };
    for (const item of COMPLETE_SPA_DATA) {
      map[item.category] = (map[item.category] ?? 0) + 1;
    }
    return map;
  }, []);

  const entryPrice = useMemo(
    () => Math.min(...COMPLETE_SPA_DATA.flatMap((s) => s.options.map((o) => o.price))),
    []
  );

  // Convert SpaTreatmentData into CoverflowSlide format
  const slides: CoverflowSlide[] = filteredData.map((item) => ({
    id: item.id,
    src: item.image,
    alt: item.title,
    tag: item.tag,
    title: item.title,
    subtitle: item.subtitle,
    price: item.forTwo ? `${item.price} · for 2` : item.price,
    meta: [
      { label: "Duration", value: item.duration },
      { label: "Pressure", value: item.pressure },
      { label: "Best for", value: item.bestFor },
    ],
  }));

  const handleBookSlide = (slideId?: string) => {
    onOpenReservation(slideId || filteredData[0]?.id || COMPLETE_SPA_DATA[0].id);
  };

  const handleDetailsSlide = (slideId?: string) => {
    const match = COMPLETE_SPA_DATA.find((s) => s.id === slideId);
    if (match) setSelectedServiceModal(match);
  };

  // Escape closes the protocol sheet and the page stays put behind it.
  useEffect(() => {
    if (!selectedServiceModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedServiceModal(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [selectedServiceModal]);

  return (
    <div
      id="services-catalogue"
      className="relative w-full pt-6 pb-12 text-[#f7f4ee] select-none"
    >
      {/* Header: title, one line of copy, filters. */}
      <div className="text-center mb-7 max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12">
        <h2 className="text-3xl sm:text-5xl font-serif font-light tracking-wide uppercase">
          TREATMENT <span className="italic text-[#c5a880]">COLLECTION</span>
        </h2>

        <p className="mt-3 text-xs sm:text-sm text-[#e8ded2]/70 font-sans max-w-xl mx-auto leading-relaxed">
          Massages, couple experiences and body scrubs, priced exactly as on our
          menu card {` — from ${formatRupees(entryPrice)}.`}
        </p>

        {/* Category Filter Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            const count = counts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                aria-pressed={isActive}
                className={`group inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-[#c5a880] text-[#07090b] shadow-lg shadow-[#c5a880]/20 font-bold scale-105"
                    : "bg-[#0b0f12]/80 text-[#e8ded2]/70 hover:text-[#f7f4ee] hover:bg-white/10 border border-white/[0.08]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-mono text-[10px] leading-none px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-[#07090b]/20 text-[#07090b]" : "bg-white/[0.06] text-[#c5a880]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-bleed: no panel, no side padding — the deck floats on the page. */}
      <div className="relative w-full">
        <CoverflowCarousel
          // Remount per filter so the deck opens on the first card of the set.
          key={activeCategory}
          slides={slides}
          rotate={42}
          depth={0.65}
          perspective={3.2}
          falloff={0.58}
          fade={0.12}
          cardWidth="clamp(250px, 30vw, 420px)"
          gap={0.06}
          loop={true}
          autoplay
          cardsPerSecond={0.22}
          showCaption={true}
          showPagination={true}
          showNavigation={true}
          label="Treatment collection"
          onBookSlide={handleBookSlide}
          onDetailsSlide={handleDetailsSlide}
        />
      </div>

      {/* Undecided-guest rescue: hand them to the AI consultant instead of a dead end. */}
      {onOpenAIDoctor && (
        <div className="max-w-5xl mx-auto mt-8 px-5 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-center sm:text-left">
          <Bot className="w-6 h-6 text-[#c5a880] shrink-0" />
          <p className="text-xs sm:text-sm font-sans text-[#e8ded2]/75 leading-relaxed">
            Not sure which ritual suits your body?{" "}
            <span className="text-[#f7f4ee]">
              Our AI wellness consultant matches a therapy to your pain points in 30 seconds.
            </span>
          </p>
          <button
            onClick={onOpenAIDoctor}
            className="shrink-0 px-6 py-2.5 rounded-full border border-[#c5a880]/40 text-[#c5a880] text-[11px] font-sans font-bold tracking-widest uppercase hover:bg-[#c5a880] hover:text-[#07090b] transition-all cursor-pointer"
          >
            Ask The Consultant
          </button>
        </div>
      )}

      {/* Floating Trust Indicators */}
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8 mt-12 pt-10 border-t border-white/[0.08] text-center">
        {TRUST_POINTS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="group space-y-1.5"
            >
              <Icon className="w-4 h-4 mx-auto text-[#c5a880]/80 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-[11px] font-mono font-bold text-[#c5a880] block leading-tight">
                {item.title}
              </span>
              <span className="text-[10px] font-sans text-[#e8ded2]/60 block">{item.desc}</span>
            </div>
          );
        })}
      </div>
      {/*
        ========================================================================
        RITUAL PROTOCOL SHEET
        Portalled to <body>: this section sits inside a stacking context
        (z-20 + overflow-hidden), which trapped the sheet below the navbar and
        clipped it. Rendered on the body it owns the whole viewport.
        ========================================================================
      */}
      {mounted && selectedServiceModal && createPortal(
        <div
          data-lenis-prevent
      className="fixed inset-0 z-[150] bg-[#0b0f12]"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedServiceModal.title} ritual protocol`}
        >
          {/* Editorial spec sheet: the plate carries the name, the right column
              is pure specification. Splitting the two is what stops the detail
              side from reading as one long stack of boxes. */}
          <div className="h-full w-full flex flex-col lg:grid lg:grid-cols-[45%_1fr]">
            {/* Plate — image, tag and title */}
            <div className="relative h-52 sm:h-64 lg:h-full overflow-hidden">
              <FallbackImage
                src={selectedServiceModal.image}
                alt={selectedServiceModal.title}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                draggable={false}
                className="object-cover"
              />
              {/* Two washes: up from the base so the title holds on any photo,
                  and in from the right so the plate meets the panel. */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f12] via-[#0b0f12]/25 to-transparent" />
              <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0b0f12]" />

              <div className="absolute bottom-5 left-6 right-6 lg:bottom-10 lg:left-10 lg:right-12 flex flex-col items-start gap-3.5">
                <span className="px-3 py-1 rounded-full bg-[#07090b]/85 border border-[#c5a880]/40 text-[9px] font-mono tracking-widest text-[#c5a880] uppercase font-bold">
                  {selectedServiceModal.tag}
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-[2.6rem] font-serif font-light leading-[1.12] text-[#f7f4ee] text-balance drop-shadow-lg">
                  {selectedServiceModal.title}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setSelectedServiceModal(null)}
              aria-label="Close ritual protocol"
              className="absolute top-5 right-5 z-10 rounded-full bg-[#07090b]/80 border border-white/10 p-2.5 text-[#e8ded2] hover:text-[#07090b] hover:bg-[#c5a880] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Detail column — scrolls on its own only if a phone needs it. */}
            <div className="relative flex min-h-0 flex-1 flex-col">
            {/* `justify-center` is the fix for the dead band that opened up
                between the content and the booking dock on a tall screen. */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-10 lg:px-12 lg:py-10 flex flex-col gap-7">
              {(() => {
                const detail = getTherapyDetail(selectedServiceModal.id, language);
                const notes = [...(detail?.goodToKnow ?? []), ...GENERAL_NOTES[language]];
                return (
                  <>
                    {/* Language — the guest reads the whole sheet in theirs. */}
                    <div className="flex items-center gap-1.5" role="group" aria-label="Language">
                      {GUEST_LANGUAGES.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setLanguage(option.id)}
                          aria-pressed={language === option.id}
                          className={`cursor-pointer rounded-full px-3.5 py-1.5 font-sans text-xs transition-all ${
                            language === option.id
                              ? "bg-[#c5a880] font-bold text-[#07090b]"
                              : "border border-white/10 text-[#e8ded2]/70 hover:border-[#c5a880]/50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#c5a880]">
                        {sheet.about}
                      </h4>
                      <p className="text-sm sm:text-base font-sans text-[#e8ded2]/85 leading-relaxed max-w-[60ch]">
                        {detail?.about ?? selectedServiceModal.description}
                      </p>
                    </div>

                    {detail && (
                      <div className="flex flex-col gap-3">
                        <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#c5a880]">
                          {sheet.session}
                        </h4>
                        <ol className="flex flex-col gap-3">
                          {detail.steps.map((step, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#c5a880]/50 font-mono text-[11px] font-bold text-[#c5a880]">
                                {index + 1}
                              </span>
                              <span className="pt-0.5 text-sm font-sans text-[#f7f4ee]/90 leading-relaxed">
                                {step}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {detail && (
                      <div className="flex flex-col gap-3">
                        <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#c5a880]">
                          {sheet.benefits}
                        </h4>
                        <ul className="flex flex-wrap gap-2">
                          {detail.benefits.map((benefit) => (
                            <li
                              key={benefit}
                              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-sans text-[#f7f4ee]/90"
                            >
                              <Check className="h-3 w-3 text-[#c5a880]" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* The menu card's price list, one row per length. */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#c5a880]">
                        {sheet.priceList}{selectedServiceModal.forTwo ? sheet.forTwo : ""}
                      </h4>
                      <ul className="border-t border-white/[0.08]">
                        {selectedServiceModal.options.map((option) => (
                          <li
                            key={option.minutes}
                            className="flex items-baseline justify-between py-3.5 border-b border-white/[0.08]"
                          >
                            <span className="flex items-center gap-2 font-sans text-sm sm:text-base text-[#f7f4ee]">
                              <Clock className="w-3.5 h-3.5 text-[#c5a880]/70" />
                              {option.minutes} {sheet.min}
                            </span>
                            <span className="font-mono text-xl sm:text-2xl font-bold text-[#c5a880] tabular-nums">
                              {formatRupees(option.price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 border-t border-white/[0.08]">
                      {[
                        { icon: Wind, label: sheet.pressure, value: detail?.pressure ?? selectedServiceModal.pressure },
                        { icon: Leaf, label: sheet.bestFor, value: detail?.bestFor ?? selectedServiceModal.bestFor },
                      ].map((row, index) => {
                        const Icon = row.icon;
                        return (
                          <div
                            key={index}
                            className={`py-4 border-b border-white/[0.08] flex flex-col gap-1.5 ${
                              index % 2 === 0 ? "pr-6" : "pl-6 border-l border-white/[0.08]"
                            }`}
                          >
                            <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.22em] text-[#e8ded2]/40">
                              <Icon className="w-3 h-3" />
                              {row.label}
                            </span>
                            <span className="block text-xs sm:text-sm font-sans font-medium text-[#f7f4ee]">
                              {row.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
                      <h4 className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-[#c5a880]">
                        <Info className="h-3 w-3" />
                        {sheet.goodToKnow}
                      </h4>
                      <ul className="flex flex-col gap-2">
                        {notes.map((note) => (
                          <li key={note} className="flex items-start gap-2 text-xs sm:text-sm font-sans text-[#e8ded2]/80 leading-relaxed">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#c5a880]" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                );
              })()}
            </div>

              {/* Outside the scroll area: the booking row never leaves the
                  screen, whatever the content does. */}
              <div className="flex flex-col sm:flex-row gap-3 border-t border-white/[0.08] bg-[#0b0f12] px-6 sm:px-10 lg:px-12 py-4 sm:py-5">
                <button
                  onClick={() => {
                    const id = selectedServiceModal.id;
                    setSelectedServiceModal(null);
                    onOpenReservation(id);
                  }}
                  className="flex-1 px-7 py-3.5 rounded-full bg-[#c5a880] text-[#07090b] text-xs font-sans font-bold tracking-widest uppercase hover:brightness-110 shadow-xl shadow-[#c5a880]/20 transition-all cursor-pointer"
                >
                  {sheet.reserve}
                </button>
                <button
                  onClick={() => setSelectedServiceModal(null)}
                  className="px-7 py-3.5 rounded-full border border-white/[0.12] text-[#e8ded2]/70 text-xs font-sans font-semibold tracking-widest uppercase hover:text-[#f7f4ee] hover:border-white/25 transition-all cursor-pointer"
                >
                  {sheet.back}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
