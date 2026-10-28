"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { COMPLETE_SPA_DATA, formatRupees } from "@/lib/treatments";

const COUPLE = COMPLETE_SPA_DATA.find((t) => t.id === "couple-massage")!;
const COUPLE_FROM = COUPLE.options[0];

interface CoupleCustomizerProps {
  onBookCouple: (customSummary: string) => void;
}

interface Ambience {
  id: string;
  index: string;
  name: string;
  tagline: string;
  /** Shown over the footage. */
  overlay: string;
  /** Shown beside the section heading. */
  side: string;
  inclusions: string[];
  video: string;
  poster: string;
}

/**
 * Footage is licensed from Pexels (free for commercial use, no attribution
 * required). To swap in the spa's own film later, replace the three files in
 * /public/video — nothing in this component needs to change.
 */
const AMBIENCES: Ambience[] = [
  {
    id: "rose",
    index: "01",
    name: "Fresh Rose Petals",
    tagline: "Warm floral bath & candle glow",
    overlay:
      "A warm floral bath drawn before you arrive, petals on the water and candlelight kept low along the walls.",
    side: "Ninety minutes in a private suite for two — the room set the way you want it, two therapists working in time with each other, and nothing on the schedule afterwards.",
    inclusions: [
      "Private couple en-suite with steam shower",
      "Warm rose petal floral bath",
      "Synchronised 90-minute massages",
      "Hibiscus tea & dark chocolate truffles",
    ],
    video: "/video/couple-rose.mp4",
    poster: "/video/couple-rose.jpg",
  },
  {
    id: "candle",
    index: "02",
    name: "Golden Candlelight",
    tagline: "Low-light shadows & amber resin",
    overlay:
      "Amber resin burning, the room lit low and gold, and the bath drawn warm before either of you walks in.",
    side: "The quietest of the three rooms. Light comes only from candles, and the therapists work without a word unless you start one.",
    inclusions: [
      "Private couple en-suite with steam shower",
      "Candlelit room, amber resin burner",
      "Synchronised 90-minute massages",
      "Spiced chai & dark chocolate truffles",
    ],
    video: "/video/couple-candle.mp4",
    poster: "/video/couple-candle.jpg",
  },
  {
    id: "zen",
    index: "03",
    name: "Zen Forest Bamboo",
    tagline: "Smoked sandalwood & mist",
    overlay:
      "Sandalwood smoke through bamboo screens, mist off the steam shower, nothing above a whisper for ninety minutes.",
    side: "Built for people who came to stop thinking. Cool green light, sandalwood, and a steam shower running the whole session.",
    inclusions: [
      "Private couple en-suite with steam shower",
      "Sandalwood mist & bamboo screens",
      "Synchronised 90-minute massages",
      "Green tea & dark chocolate truffles",
    ],
    video: "/video/couple-zen.mp4",
    poster: "/video/couple-zen.jpg",
  },
];

const SOUNDSCAPES = ["432Hz sound bath", "Rain & flute", "Deep zen silence"];

const THERAPIES = [
  "Deep Tissue Muscle Knot Relief",
  "Signature Balinese Aromatherapy",
  "Classic Swedish Relaxation",
  "Traditional Thai Dry Bodywork",
];

export default function CoupleExperienceCustomizer({ onBookCouple }: CoupleCustomizerProps) {
  const [ambienceId, setAmbienceId] = useState(AMBIENCES[0].id);
  const [sound, setSound] = useState(SOUNDSCAPES[0]);
  const [therapyP1, setTherapyP1] = useState(THERAPIES[0]);
  const [therapyP2, setTherapyP2] = useState(THERAPIES[1]);

  const frameRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  const ambience = AMBIENCES.find((a) => a.id === ambienceId) ?? AMBIENCES[0];

  // Footage only runs while the section is actually being looked at. Three
  // autoplaying loops on a page that already drives a canvas would cost
  // battery for nothing.
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;

    node.querySelectorAll("video").forEach((video) => {
      const isActive = video.dataset.amb === ambienceId;
      if (isActive && onScreen) {
        video.preload = "auto";
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [ambienceId, onScreen]);

  return (
    <div className="relative w-full max-w-[1600px] mx-auto py-4 text-[#f7f4ee] select-none my-10">
      {/* Heading, and the line that changes with the room */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-8">
        <div className="pool">
          <span className="block text-[11px] font-mono tracking-[0.3em] uppercase text-[#c5a880]">
            Royal Couple Sanctuary Suite
          </span>
          <h2 className="mt-2.5 text-3xl sm:text-5xl font-serif font-light uppercase tracking-wide text-[#f7f4ee] text-shade-strong">
            Customize your <span className="italic text-[#c5a880]">couple escape</span>
          </h2>
        </div>

        <p
          key={ambience.id}
          className="max-w-[40ch] animate-fadeInFast font-sans text-sm sm:text-base leading-relaxed text-[#f0e9df]/85"
        >
          {ambience.side}
        </p>
      </div>

      {/* The strip */}
      <div ref={frameRef} className="relative overflow-hidden rounded-sm">
        <div className="relative aspect-[21/9] min-h-[320px]">
          {AMBIENCES.map((item) => (
            <video
              key={item.id}
              data-amb={item.id}
              src={item.video}
              poster={item.poster}
              muted
              loop
              playsInline
              preload={item.id === AMBIENCES[0].id ? "metadata" : "none"}
              className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1100ms] ease-out ${
                item.id === ambienceId ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"
              }`}
            />
          ))}

          {/* Two washes: one seats the chapter marks, one holds the edges. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(10,9,7,.96) 4%, rgba(10,9,7,.15) 46%, rgba(10,9,7,.55) 100%)," +
                "linear-gradient(to right, rgba(10,9,7,.7), transparent 34%, transparent 66%, rgba(10,9,7,.7))",
            }}
          />

          <div className="absolute left-5 top-5 z-10 flex items-center gap-2.5 font-mono text-[9.5px] uppercase tracking-[0.26em] text-[#f7f4ee]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c5a880] animate-pulse-subtle" />
            Inside the suite
          </div>

          <div className="absolute bottom-[132px] left-6 z-10 flex max-w-[34ch] flex-col gap-3 sm:left-12">
            <h3
              key={`${ambience.id}-name`}
              className="animate-fadeInFast font-serif text-2xl font-light leading-tight sm:text-4xl text-shade-strong"
            >
              {ambience.name}
            </h3>
            <p
              key={`${ambience.id}-copy`}
              className="animate-fadeInFast font-sans text-sm leading-relaxed text-[#f0e9df]/80 text-shade"
            >
              {ambience.overlay}
            </p>
          </div>

          {/* Chapter marks along the bottom of the footage */}
          <div className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-1 sm:grid-cols-3">
            {AMBIENCES.map((item) => {
              const isActive = item.id === ambienceId;
              return (
                <button
                  key={item.id}
                  onClick={() => setAmbienceId(item.id)}
                  aria-pressed={isActive}
                  className={`group relative cursor-pointer border-t border-white/[0.13] px-5 pb-5 pt-5 text-left transition-colors duration-300 sm:px-6 sm:[&+&]:border-l ${
                    isActive ? "text-[#f7f4ee]" : "text-[#e8ded2]/55 hover:text-[#f7f4ee]"
                  }`}
                  style={{
                    background: isActive
                      ? "linear-gradient(to top, rgba(10,9,7,.94), rgba(10,9,7,.35))"
                      : "linear-gradient(to top, rgba(10,9,7,.9), rgba(10,9,7,.2))",
                  }}
                >
                  <span
                    aria-hidden
                    className={`absolute -top-px left-0 right-0 h-px origin-left bg-[#c5a880] transition-transform duration-700 ease-out ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                  <span className="mb-1.5 block font-mono text-[9.5px] tracking-[0.22em] text-[#c5a880]">
                    {item.index}
                  </span>
                  <span className="block font-serif text-lg leading-tight sm:text-xl">
                    {item.name}
                  </span>
                  <span className="mt-1 block text-xs text-[#e8ded2]/55">{item.tagline}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Everything the strip can't hold */}
      {/* The row under the strip sits straight on the ambient ground, which is
          at its brightest here — so it gets the same depth-of-field pool the
          headings use. */}
      <div className="pool grid gap-8 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div className="space-y-7">
          <div>
            <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/50">
              Included in the suite
            </span>
            <ul className="space-y-2.5">
              {ambience.inclusions.map((line, index) => (
                <li
                  key={line}
                  className="flex animate-fadeInFast items-center gap-2.5 text-sm text-[#f0e9df]/85"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#c5a880]" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-7 sm:grid-cols-2">
            <div>
              <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/50">
                Soundscape
              </span>
              <div className="flex flex-wrap gap-2">
                {SOUNDSCAPES.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSound(option)}
                    aria-pressed={sound === option}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-[12px] transition-all duration-300 ${
                      sound === option
                        ? "border-[#c5a880] bg-[#c5a880] text-[#07090b]"
                        : "border-white/[0.12] text-[#e8ded2]/65 hover:border-[#c5a880]/50 hover:text-[#f7f4ee]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/50">
                  Partner 1 therapy
                </span>
                <select
                  value={therapyP1}
                  onChange={(event) => setTherapyP1(event.target.value)}
                  className="w-full border-b border-white/[0.14] bg-transparent py-2.5 text-sm text-[#f7f4ee] transition-colors focus:border-[#c5a880] focus:outline-none [color-scheme:dark]"
                >
                  {THERAPIES.map((option) => (
                    <option key={option} value={option} className="bg-[#0b0f12]">
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/50">
                  Partner 2 therapy
                </span>
                <select
                  value={therapyP2}
                  onChange={(event) => setTherapyP2(event.target.value)}
                  className="w-full border-b border-white/[0.14] bg-transparent py-2.5 text-sm text-[#f7f4ee] transition-colors focus:border-[#c5a880] focus:outline-none [color-scheme:dark]"
                >
                  {THERAPIES.map((option) => (
                    <option key={option} value={option} className="bg-[#0b0f12]">
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-end gap-5">
          <div className="flex items-baseline justify-between border-b border-white/[0.1] pb-4">
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8ded2]/50">
                {COUPLE.duration} · for two
              </span>
              <span className="text-[13px] text-[#e8ded2]/50">{COUPLE_FROM.minutes} min from</span>
            </span>
            <span className="font-mono text-3xl text-[#c5a880]">{formatRupees(COUPLE_FROM.price)}</span>
          </div>

          <button
            onClick={() => onBookCouple(COUPLE.id)}
            className="cursor-pointer self-start rounded-full bg-[#c5a880] px-9 py-4 font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-[#07090b] shadow-lg shadow-[#c5a880]/20 transition-all hover:brightness-110"
          >
            Reserve the couple suite
          </button>
        </div>
      </div>
    </div>
  );
}
