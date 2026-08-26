"use client";

import { useState } from "react";
import { Sparkles, Droplet, ArrowRight, RotateCcw, Check, MessageCircle, ShieldCheck } from "lucide-react";

interface OilRecipe {
  name: string;
  subtitle: string;
  recommendedTherapyId: string;
  recommendedTherapyTitle: string;
  price: string;
  baseOil: string;
  activeEssences: string[];
  benefits: string[];
  promoCode: string;
  colorGradient: string;
}

const NEEDS = [
  { id: "desk-pain", label: "Desk Neck & Back Stiffness", icon: "⚡", desc: "Chronic knots from screen work" },
  { id: "mental-fatigue", label: "Deep Mental De-stress", icon: "🌙", desc: "Anxiety, insomnia & cognitive burnout" },
  { id: "energy-reset", label: "Vitality & Energy Reset", icon: "✨", desc: "Fatigue, low stamina & sluggishness" },
  { id: "skin-glow", label: "Lymphatic Flow & Glow", icon: "🌸", desc: "Fluid retention & skin dryness" },
];

const PRESSURES = [
  { id: "deep", label: "Deep Firm + Heated Basalt", desc: "Targeted knot dissolution" },
  { id: "medium", label: "Harmonic Rhythmic Flow", desc: "Balinese pressure point balance" },
  { id: "gentle", label: "Gentle Gliding & Acupressure", desc: "Swedish relaxation soothing strokes" },
];

const AROMAS = [
  { id: "lavender", name: "Kashmir High-Altitude Lavender", note: "Floral Calming", color: "from-purple-900/60 to-purple-600/30" },
  { id: "eucalyptus", name: "Australian Blue Gum Eucalyptus", note: "Crisp & Decongesting", color: "from-emerald-900/60 to-teal-600/30" },
  { id: "bergamot", name: "Cold-Pressed Italian Bergamot", note: "Zesty & Uplifting", color: "from-amber-900/60 to-yellow-600/30" },
  { id: "sandalwood", name: "Royal Mysore Sandalwood", note: "Warm Woody Meditative", color: "from-amber-950/80 to-amber-700/40" },
];

interface AromatherapyCustomizerProps {
  onOpenReservation: (experienceId?: string, promoCode?: string) => void;
}

export default function AromatherapyCustomizer({ onOpenReservation }: AromatherapyCustomizerProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedNeed, setSelectedNeed] = useState<string>("desk-pain");
  const [selectedPressure, setSelectedPressure] = useState<string>("deep");
  const [selectedAroma, setSelectedAroma] = useState<string>("lavender");
  const [isBlending, setIsBlending] = useState<boolean>(false);

  const calculateRecipe = (): OilRecipe => {
    const aromaObj = AROMAS.find((a) => a.id === selectedAroma) || AROMAS[0];

    if (selectedNeed === "desk-pain") {
      return {
        name: `Volcanic ${aromaObj.name.split(" ")[0]} Tension Melt`,
        subtitle: "Formulated for deep spinal decompression & desk stiffness",
        recommendedTherapyId: "deep-tissue",
        recommendedTherapyTitle: "Deep Tissue & Volcanic Knot Release",
        price: "₹2,499",
        baseOil: "Cold-Pressed Golden Jojoba & Sweet Almond (60%)",
        activeEssences: [aromaObj.name + " (25%)", "Wild Wintergreen Extract (10%)", "Pure Vitamin E (5%)"],
        benefits: ["Unbinds stubborn trapezius knots", "Stimulates local micro-circulation", "Deep warm tissue penetration"],
        promoCode: "AROMABLEND25",
        colorGradient: aromaObj.color,
      };
    }

    if (selectedNeed === "mental-fatigue") {
      return {
        name: `Nocturne ${aromaObj.name.split(" ")[0]} Serenity Blend`,
        subtitle: "Calibrated for parasympathetic nervous system reboot",
        recommendedTherapyId: "swedish",
        recommendedTherapyTitle: "Swedish Classical Serenity Ritual",
        price: "₹2,199",
        baseOil: "Virgin Cold-Pressed Sweet Almond & Grapeseed (65%)",
        activeEssences: [aromaObj.name + " (20%)", "Roman Chamomile Flower Oil (10%)", "Frankincense Resin (5%)"],
        benefits: ["Lowers cortisol & heart-rate variability", "Induces deep restorative alpha brainwaves", "Silky non-greasy absorption"],
        promoCode: "AROMABLEND25",
        colorGradient: aromaObj.color,
      };
    }

    return {
      name: `Vitality ${aromaObj.name.split(" ")[0]} Rejuvenator`,
      subtitle: "Full-body cellular invigorator with acupressure synergy",
      recommendedTherapyId: "balinese",
      recommendedTherapyTitle: "Balinese Royal Herbal Flow",
      price: "₹2,399",
      baseOil: "Hydrating Coconut & Virgin Macadamia Nut (60%)",
      activeEssences: [aromaObj.name + " (25%)", "Lemongrass & Ginger Root (10%)", "Argan Oil (5%)"],
      benefits: ["Drains lymphatic stagnation", "Restores physical stamina", "Awakens sensory alertness"],
      promoCode: "AROMABLEND25",
      colorGradient: aromaObj.color,
    };
  };

  const recipe = calculateRecipe();

  const handleFinishBlend = () => {
    setIsBlending(true);
    setTimeout(() => {
      setIsBlending(false);
      setStep(4);
    }, 1200);
  };

  const handleSendWhatsAppPass = () => {
    const text = `Hi Alexa Spa, I crafted my bespoke Aromatherapy Blend on your website: "${recipe.name}" (Base: ${recipe.baseOil}, Essence: ${recipe.activeEssences.join(", ")}). I would like to book the ${recipe.recommendedTherapyTitle} with promo code ${recipe.promoCode}. What slots are open?`;
    window.open(`https://wa.me/919820012345?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section id="blend-oil" className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto select-none">
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c5a880]/10 border border-[#c5a880]/25 text-[#c5a880] text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em]">
          <Droplet className="w-3.5 h-3.5 fill-[#c5a880]" />
          <span>Interactive Scent Atelier</span>
        </div>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-light text-[#f7f4ee] leading-tight">
          Blend your bespoke <span className="italic text-[#c5a880]">essential oil formula.</span>
        </h2>

        <p className="text-sm sm:text-base text-[#e8ded2]/75 font-sans leading-relaxed">
          Answer 3 quick sensory preferences to calibrate your custom cold-pressed botanical recipe,
          compounded fresh by our master therapists before your appointment.
        </p>
      </div>

      {/* Main Interactive Studio Box */}
      <div className="max-w-4xl mx-auto rounded-3xl bg-[#0b0f12]/90 border border-white/[0.12] p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">
        {/* Step Indicator Ticker */}
        {step <= 3 && (
          <div className="flex items-center justify-between pb-8 border-b border-white/10 mb-8">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#c5a880] text-[#07090b] text-xs font-mono font-bold flex items-center justify-center">
                0{step}
              </span>
              <div>
                <span className="text-[10px] font-mono text-[#c5a880] uppercase tracking-widest block">
                  STEP 0{step} OF 03
                </span>
                <h4 className="text-sm sm:text-base font-serif text-[#f7f4ee]">
                  {step === 1 && "Select Your Core Wellness Outcome"}
                  {step === 2 && "Preferred Pressure & Heat Intensity"}
                  {step === 3 && "Choose Your Signature Aromatic Note"}
                </h4>
              </div>
            </div>

            <span className="text-xs font-mono text-[#e8ded2]/40 hidden sm:block">
              {Math.round((step / 3) * 100)}% Calibrated
            </span>
          </div>
        )}

        {/* Step 1: Need */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid sm:grid-cols-2 gap-3.5">
              {NEEDS.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNeed(n.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                    selectedNeed === n.id
                      ? "border-[#c5a880] bg-[#c5a880]/10 shadow-lg shadow-[#c5a880]/15"
                      : "border-white/10 bg-[#10151a] hover:border-white/30"
                  }`}
                >
                  <span className="text-2xl">{n.icon}</span>
                  <div>
                    <h5 className="text-sm font-sans font-semibold text-[#f7f4ee]">{n.label}</h5>
                    <p className="text-xs text-[#e8ded2]/60 mt-0.5">{n.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-3.5 rounded-full bg-[#c5a880] hover:brightness-110 text-[#07090b] text-xs font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-[#c5a880]/20"
              >
                <span>Continue to Pressure</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Pressure */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid sm:grid-cols-3 gap-3.5">
              {PRESSURES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPressure(p.id)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                    selectedPressure === p.id
                      ? "border-[#c5a880] bg-[#c5a880]/10 shadow-lg shadow-[#c5a880]/15"
                      : "border-white/10 bg-[#10151a] hover:border-white/30"
                  }`}
                >
                  <span className="text-xs font-mono text-[#c5a880] tracking-wider uppercase block">
                    {p.id.toUpperCase()}
                  </span>
                  <h5 className="text-sm font-sans font-semibold text-[#f7f4ee]">{p.label}</h5>
                  <p className="text-xs text-[#e8ded2]/60">{p.desc}</p>
                </button>
              ))}
            </div>

            <div className="pt-6 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-[#e8ded2]/60 hover:text-white transition-colors cursor-pointer"
              >
                ← Back
              </button>

              <button
                onClick={() => setStep(3)}
                className="px-8 py-3.5 rounded-full bg-[#c5a880] hover:brightness-110 text-[#07090b] text-xs font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-[#c5a880]/20"
              >
                <span>Select Fragrance Note</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Aroma */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid sm:grid-cols-2 gap-3.5">
              {AROMAS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAroma(a.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    selectedAroma === a.id
                      ? "border-[#c5a880] bg-[#c5a880]/10 shadow-lg shadow-[#c5a880]/15"
                      : "border-white/10 bg-[#10151a] hover:border-white/30"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono text-[#c5a880] uppercase tracking-wider block">
                      {a.note}
                    </span>
                    <h5 className="text-sm font-sans font-semibold text-[#f7f4ee] mt-0.5">{a.name}</h5>
                  </div>
                  {selectedAroma === a.id && (
                    <div className="w-6 h-6 rounded-full bg-[#c5a880] text-[#07090b] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-6 flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-xs text-[#e8ded2]/60 hover:text-white transition-colors cursor-pointer"
              >
                ← Back
              </button>

              <button
                onClick={handleFinishBlend}
                disabled={isBlending}
                className="px-9 py-3.5 rounded-full bg-gradient-to-r from-[#c5a880] to-[#e4d3ba] text-[#07090b] text-xs font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-[#c5a880]/30 hover:scale-105"
              >
                {isBlending ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" /> Compounding Oil...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Compound My Custom Blend
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Final Bespoke Prescription Certificate Card */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#131a21] via-[#0d1217] to-[#07090b] border border-[#c5a880]/40 shadow-2xl relative overflow-hidden space-y-6">
              {/* Top Luxury Seal */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono tracking-[0.25em] text-[#c5a880] uppercase block">
                    ALEXA SPA APOTHECARY PRESCRIPTION
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif text-[#f7f4ee] font-light mt-0.5">
                    {recipe.name}
                  </h3>
                </div>

                <div className="px-3 py-1.5 rounded-full bg-[#c5a880]/15 border border-[#c5a880]/40 text-[#d9bb8e] text-xs font-mono">
                  PROMO CODE: <span className="font-bold text-white">{recipe.promoCode}</span> (25% OFF)
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Left: Ingredients Formulation */}
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] font-mono text-[#e8ded2]/50 uppercase tracking-wider block">
                      CARRIER BASE FORMULATION:
                    </span>
                    <p className="text-xs text-[#f7f4ee] font-sans font-medium mt-0.5">
                      {recipe.baseOil}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[#e8ded2]/50 uppercase tracking-wider block">
                      ACTIVE BOTANICAL ESSENCES:
                    </span>
                    <div className="space-y-1 mt-1">
                      {recipe.activeEssences.map((e, idx) => (
                        <span
                          key={idx}
                          className="inline-block mr-2 mb-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[#e4d3ba]"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[#e8ded2]/50 uppercase tracking-wider block">
                      KEY THERAPEUTIC OUTCOMES:
                    </span>
                    <ul className="space-y-1 mt-1 text-xs text-[#e8ded2]/80">
                      {recipe.benefits.map((b, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="text-[#c5a880]">✓</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right: Matched Treatment Box */}
                <div className="p-5 rounded-2xl bg-[#090d10] border border-white/10 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-[#c5a880] uppercase tracking-wider">
                      RECOMMENDED TREATMENT MATCH
                    </span>
                    <h4 className="text-base sm:text-lg font-serif text-white font-medium">
                      {recipe.recommendedTherapyTitle}
                    </h4>
                    <p className="text-xs text-[#e8ded2]/65 font-sans leading-relaxed">
                      {recipe.subtitle}
                    </p>
                    <span className="text-sm font-mono text-[#c5a880] block font-bold">
                      {recipe.price} • Includes Private Shower Suite
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Compounded fresh 15-min before your slot</span>
                  </div>
                </div>
              </div>

              {/* Actions Bottom Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-sans text-[#e8ded2]/60 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-calibrate Formula
                </button>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleSendWhatsAppPass}
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-[#07090b] text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#25D366]/20 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" /> Claim on WhatsApp
                  </button>

                  <button
                    onClick={() => onOpenReservation(recipe.recommendedTherapyId, recipe.promoCode)}
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-full bg-[#c5a880] hover:brightness-110 text-[#07090b] text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#c5a880]/20 transition-all"
                  >
                    <span>Book With This Blend</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
