"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import { COMPLETE_SPA_DATA } from "@/components/ServicesMenu";
import { makeReference, saveBookingRequest } from "@/lib/bookings";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExperience?: string;
  initialPromoCode?: string;
}

const SPA_WHATSAPP = "919820012345";

type Step = "therapy" | "when" | "preferences" | "details";

const STEP_LABELS: Record<Step, string> = {
  therapy: "Therapy",
  when: "When",
  preferences: "Setup",
  details: "You",
};

const TIME_SLOTS = [
  { value: "10:30 AM", note: "" },
  { value: "12:00 PM", note: "Happy hour" },
  { value: "02:00 PM", note: "Happy hour" },
  { value: "03:30 PM", note: "Happy hour" },
  { value: "05:00 PM", note: "" },
  { value: "06:30 PM", note: "Peak" },
  { value: "08:00 PM", note: "" },
  { value: "09:15 PM", note: "Last slot" },
];

const OILS = [
  "French Lavender — deep relaxation",
  "Alpine Eucalyptus & Camphor — muscle relief",
  "Thai Lemongrass & Citrus — energy & uplift",
  "Jojoba & Almond — hypoallergenic",
];

const THERAPIST_PREFS = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "any", label: "No preference" },
];

const ROOM_TYPES = [
  { id: "single", label: "Private en-suite" },
  { id: "couple", label: "Couple VIP suite" },
];

/** Promo codes the site honours, and what each takes off. */
const PROMOS: Record<string, { percent: number; label: string }> = {
  FIRST20: { percent: 20, label: "First-visit privilege" },
  AIWELLNESS20: { percent: 20, label: "AI consultation offer" },
  HAPPYHOUR: { percent: 25, label: "Happy hour rate" },
  VIP30: { percent: 30, label: "VIP member rate" },
};

/** "₹2,499" → 2499. */
function toRupees(value: string): number {
  const digits = value.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

function formatRupees(value: number): string {
  return "₹" + value.toLocaleString("en-IN");
}

function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split("T")[0];
}

function prettyDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function ReservationModal({
  isOpen,
  onClose,
  initialExperience,
  initialPromoCode,
}: ReservationModalProps) {
  const [mounted, setMounted] = useState(false);

  const [therapyId, setTherapyId] = useState(COMPLETE_SPA_DATA[0].id);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(TIME_SLOTS[1].value);
  const [oil, setOil] = useState(OILS[0]);
  const [therapistPref, setTherapistPref] = useState("any");
  const [roomType, setRoomType] = useState("single");

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestNotes, setGuestNotes] = useState("");

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; percent: number; label: string } | null>(null);
  const [promoError, setPromoError] = useState("");

  /** One question per screen. A guest who arrived with a treatment already
      chosen never sees the "therapy" step at all. */
  const [step, setStep] = useState<Step>("when");

  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; date?: string }>({});
  const [saveWarning, setSaveWarning] = useState("");

  useEffect(() => setMounted(true), []);

  const therapy = useMemo(
    () => COMPLETE_SPA_DATA.find((t) => t.id === therapyId) ?? COMPLETE_SPA_DATA[0],
    [therapyId]
  );

  const listPrice = toRupees(therapy.price);
  const discount = promo ? Math.round((listPrice * promo.percent) / 100) : 0;
  const finalPrice = listPrice - discount;

  const applyPromo = (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    const match = PROMOS[code];
    if (match) {
      setPromo({ code, ...match });
      setPromoError("");
    } else {
      setPromo(null);
      setPromoError("That code isn't valid.");
    }
  };

  // Reopening the modal from a treatment card or the AI consultant carries the
  // therapy and any promo with it, and clears the previous booking's state.
  useEffect(() => {
    if (!isOpen) return;
    setStatus("idle");
    setSaveWarning("");
    setErrors({});
    const arrivedWithTherapy =
      !!initialExperience && COMPLETE_SPA_DATA.some((t) => t.id === initialExperience);
    if (arrivedWithTherapy) setTherapyId(initialExperience!);
    // Opened from the navbar with nothing chosen? Then "which therapy" is the
    // first question. Opened from a treatment? That question is already
    // answered, so the flow starts at the date.
    setStep(arrivedWithTherapy ? "when" : "therapy");
    if (initialPromoCode) {
      setPromoInput(initialPromoCode);
      applyPromo(initialPromoCode);
    }
    if (therapy.id === "couple-royal") setRoomType("couple");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialExperience, initialPromoCode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const whatsappText = (ref: string) =>
    `*ALEXA SPA — APPOINTMENT REQUEST*\n\n` +
    `*Reference:* ${ref}\n` +
    `*Guest:* ${guestName}\n` +
    `*Phone:* +91 ${guestPhone}\n` +
    `*Therapy:* ${therapy.title} (${therapy.duration})\n` +
    `*Date & Time:* ${prettyDate(date)} at ${time}\n` +
    `*Room:* ${roomType === "couple" ? "Couple VIP suite" : "Private en-suite"}\n` +
    `*Therapist:* ${THERAPIST_PREFS.find((p) => p.id === therapistPref)?.label}\n` +
    `*Aroma oil:* ${oil}\n` +
    (promo ? `*Promo:* ${promo.code} (−${promo.percent}%)\n` : "") +
    `*Payable at spa:* ${formatRupees(finalPrice)}\n` +
    `*Notes:* ${guestNotes || "None"}\n\n` +
    `Please confirm this slot.`;

  // The therapy step is dropped from the rail entirely when it was answered
  // before the modal opened — showing a step you can never reach is noise.
  const steps: Step[] = useMemo(() => {
    const arrivedWithTherapy =
      !!initialExperience && COMPLETE_SPA_DATA.some((t) => t.id === initialExperience);
    const all: Step[] = ["therapy", "when", "preferences", "details"];
    return arrivedWithTherapy ? all.slice(1) : all;
  }, [initialExperience]);

  const activeStepIndex = Math.max(0, steps.indexOf(step));
  const isLastStep = activeStepIndex === steps.length - 1;

  const validate = () => {
    const next: typeof errors = {};
    if (!guestName.trim()) next.name = "We need a name for the booking.";
    if (guestPhone.replace(/\D/g, "").length !== 10) {
      next.phone = "Enter a 10-digit mobile number.";
    }
    if (!date) next.date = "Pick a date.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goBack = () => {
    if (activeStepIndex > 0) setStep(steps[activeStepIndex - 1]);
  };

  const goNext = () => {
    if (!isLastStep) {
      // Only the date is worth blocking on before the last step; everything
      // else on the way has a sane default already selected.
      if (step === "when" && !date) {
        setErrors({ date: "Pick a date." });
        return;
      }
      setErrors({});
      setStep(steps[activeStepIndex + 1]);
      return;
    }
    void handleSubmit();
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (status === "saving") return;
    if (!validate()) {
      document.getElementById("booking-guest-name")?.focus();
      return;
    }

    setStatus("saving");
    const ref = makeReference();

    const result = await saveBookingRequest({
      reference: ref,
      therapy_slug: therapy.id,
      therapy_name: therapy.title,
      duration: therapy.duration,
      requested_date: date,
      requested_time: time,
      guest_name: guestName.trim(),
      guest_phone: guestPhone.replace(/\D/g, ""),
      guest_email: guestEmail.trim() || null,
      guest_notes: guestNotes.trim() || null,
      therapist_preference: therapistPref,
      room_type: roomType,
      aroma_oil: oil,
      list_price_inr: listPrice,
      discount_percent: promo?.percent ?? 0,
      final_price_inr: finalPrice,
      promo_code: promo?.code ?? null,
    });

    // A storage failure must not cost the booking — WhatsApp still carries
    // every detail, so the guest is told the request stands and staff get it.
    if (!result.ok) {
      setSaveWarning(
        "We couldn't reach our system, so please send the WhatsApp message below — it has your full booking."
      );
    }

    setReference(ref);
    setStatus("done");
  };

  const openWhatsApp = (ref: string) => {
    window.open(
      `https://wa.me/${SPA_WHATSAPP}?text=${encodeURIComponent(whatsappText(ref))}`,
      "_blank"
    );
  };

  if (!isOpen || !mounted) return null;

  // Underlines rather than boxes, matching the rest of the site: a field is a
  // line you write on, not a container.
  const fieldClass =
    "w-full bg-transparent border-b border-white/[0.16] px-0 py-4 text-lg text-[#f7f4ee] placeholder:text-[#e8ded2]/25 focus:outline-none focus:border-[#c5a880] transition-colors";
  const legendClass =
    "text-[11px] font-mono uppercase tracking-[0.26em] text-[#d9bb8e] mb-4 block";

  return createPortal(
    <div
      className="fixed inset-0 z-[115] bg-[#07090b]/92 backdrop-blur-2xl flex items-stretch sm:items-center justify-center sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Reserve an appointment"
    >
      <div className="relative w-full max-w-[1100px] h-full sm:h-auto sm:min-h-[640px] sm:max-h-[92vh] bg-[#0a0907] sm:rounded-[28px] border-0 sm:border border-white/[0.08] overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-[#07090b]/80 border border-white/12 flex items-center justify-center text-[#e8ded2] hover:bg-[#c5a880] hover:text-[#07090b] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {status === "done" ? (
          /* ---------------- confirmation ---------------- */
          <div className="lg:col-span-2 flex flex-col items-center justify-center text-center gap-6 p-8 sm:p-14 overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-[#c5a880]/15 border border-[#c5a880]/40 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-[#c5a880]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#f7f4ee] text-shade">
                Request <span className="italic text-[#c5a880]">received</span>
              </h2>
              <p className="text-base font-sans text-[#f0e9df]/80 max-w-md leading-relaxed">
                Send it on WhatsApp and our concierge will confirm your slot within
                a few minutes. Nothing is charged now — you pay at the spa.
              </p>
            </div>

            <div className="px-7 py-4 border-y border-[#c5a880]/25">
              <span className="block text-[9px] font-mono uppercase tracking-[0.24em] text-[#e8ded2]/45">
                Reference
              </span>
              <span className="block font-mono text-2xl font-medium text-[#c5a880] tracking-[0.16em]">
                {reference}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-10 gap-y-3 text-left text-sm">
              {[
                ["Therapy", therapy.title],
                ["When", `${prettyDate(date)} · ${time}`],
                ["Room", roomType === "couple" ? "Couple VIP suite" : "Private en-suite"],
                ["Payable at spa", formatRupees(finalPrice)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#e8ded2]/40">
                    {label}
                  </dt>
                  <dd className="font-sans text-[#f7f4ee]">{value}</dd>
                </div>
              ))}
            </dl>

            {saveWarning && (
              <p className="max-w-md text-[13px] font-sans text-[#e4d3ba] border-l border-[#c5a880]/50 pl-4 py-1 text-left">
                {saveWarning}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <button
                onClick={() => openWhatsApp(reference)}
                className="flex-1 flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#25D366] text-[#07090b] text-[11px] font-sans font-bold tracking-[0.2em] uppercase hover:brightness-110 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Send on WhatsApp
              </button>
              <button
                onClick={onClose}
                className="px-8 py-4 rounded-full border border-white/[0.14] text-[#e8ded2]/70 text-[11px] font-sans tracking-[0.22em] uppercase hover:text-[#c5a880] hover:border-[#c5a880]/60 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ---------------- turn-by-turn ----------------
             One question per screen, sized so the whole step fits without
             scrolling. The running total and the chosen therapy live in the
             footer, so nothing needs a summary column beside it. */
          <div className="flex h-full min-h-0 flex-col">
            {/* progress rail */}
            <header className="flex items-center justify-between gap-6 px-7 pb-6 pt-7 sm:px-14 sm:pt-9 lg:px-20">
              <div className="flex items-center gap-3">
                {steps.map((id, index) => {
                  const state =
                    index === activeStepIndex ? "on" : index < activeStepIndex ? "done" : "todo";
                  return (
                    <div key={id} className="flex items-center gap-3">
                      {index > 0 && <span className="hidden sm:block h-px w-6 bg-white/[0.14]" />}
                      <button
                        type="button"
                        onClick={() => index < activeStepIndex && setStep(steps[index])}
                        disabled={index >= activeStepIndex}
                        className={`flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors ${
                          state === "on"
                            ? "text-[#c5a880]"
                            : state === "done"
                              ? "text-[#e8ded2]/55 hover:text-[#c5a880] cursor-pointer"
                              : "text-[#e8ded2]/30"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            state === "todo" ? "bg-white/20" : "bg-[#c5a880]"
                          }`}
                        />
                        <span className="hidden sm:inline">{STEP_LABELS[id]}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/40">
                Step 0{activeStepIndex + 1} / 0{steps.length}
              </span>
            </header>

            {/* the step itself */}
            <div className="flex min-h-0 flex-1 flex-col justify-center gap-10 overflow-y-auto px-7 pb-8 sm:px-14 lg:px-20">
              {step === "therapy" && (
                <>
                  <h2 className="max-w-[20ch] text-[2.1rem] sm:text-[3.1rem] font-serif font-light leading-[1.06] text-[#f7f4ee]">
                    What are we <span className="italic text-[#c5a880]">treating</span> today?
                  </h2>

                  <div className="-mx-1 max-h-[48vh] max-w-4xl overflow-y-auto px-1">
                    {COMPLETE_SPA_DATA.map((item) => {
                      const isActive = item.id === therapy.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setTherapyId(item.id);
                            setStep("when");
                          }}
                          aria-pressed={isActive}
                          className={`group flex w-full cursor-pointer items-center gap-4 border-b border-white/[0.08] py-4 pr-2 text-left transition-all duration-500 ${
                            isActive ? "pl-3 bg-[#c5a880]/[0.06]" : "hover:pl-2 hover:bg-white/[0.02]"
                          }`}
                        >
                          <img
                            src={item.image}
                            alt=""
                            draggable={false}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/ritual-basalt.jpg";
                            }}
                            className={`h-14 w-14 shrink-0 rounded-lg object-cover transition-all duration-500 ${
                              isActive ? "" : "grayscale-[40%] group-hover:grayscale-0"
                            }`}
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block font-serif text-base leading-snug ${
                                isActive ? "text-[#c5a880]" : "text-[#f7f4ee]"
                              }`}
                            >
                              {item.title}
                            </span>
                            <span className="line-clamp-1 block font-sans text-[12px] text-[#e8ded2]/55">
                              {item.subtitle}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block font-mono text-base font-medium tabular-nums text-[#c5a880]">
                              {item.price}
                            </span>
                            <span className="block font-mono text-[10px] text-[#e8ded2]/40">
                              {item.duration}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {step === "when" && (
                <>
                  <h2 className="max-w-[20ch] text-[2.1rem] sm:text-[3.1rem] font-serif font-light leading-[1.06] text-[#f7f4ee]">
                    When suits <span className="italic text-[#c5a880]">you</span>?
                  </h2>

                  <label className="block max-w-sm">
                    <span className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/50">
                      <Calendar className="h-3.5 w-3.5 text-[#c5a880]" /> Date
                    </span>
                    <input
                      type="date"
                      value={date}
                      min={todayISO()}
                      onChange={(event) => setDate(event.target.value)}
                      className={`${fieldClass} [color-scheme:dark]`}
                    />
                    {errors.date && (
                      <span className="mt-1.5 block text-[11px] text-[#e0785e]">{errors.date}</span>
                    )}
                  </label>

                  <div>
                    <span className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/50">
                      <Clock className="h-3.5 w-3.5 text-[#c5a880]" /> Time slot
                    </span>
                    <div className="grid max-w-3xl grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                      {TIME_SLOTS.map((slot) => {
                        const isActive = slot.value === time;
                        return (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => setTime(slot.value)}
                            aria-pressed={isActive}
                            className={`cursor-pointer border-b py-4 text-center transition-all ${
                              isActive
                                ? "border-[#c5a880] text-[#f7f4ee]"
                                : "border-white/[0.1] text-[#e8ded2]/60 hover:text-[#f7f4ee]"
                            }`}
                          >
                            <span className="block font-mono text-base tabular-nums">{slot.value}</span>
                            {slot.note && (
                              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-[#c5a880]/70">
                                {slot.note}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {step === "preferences" && (
                <>
                  <h2 className="max-w-[20ch] text-[2.1rem] sm:text-[3.1rem] font-serif font-light leading-[1.06] text-[#f7f4ee]">
                    How would you like it <span className="italic text-[#c5a880]">set up</span>?
                  </h2>

                  <div className="grid max-w-4xl gap-10 sm:grid-cols-2">
                    <div>
                      <span className="mb-4 block font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/50">Therapist</span>
                      <div className="flex gap-4">
                        {THERAPIST_PREFS.map((pref) => (
                          <button
                            key={pref.id}
                            type="button"
                            onClick={() => setTherapistPref(pref.id)}
                            aria-pressed={therapistPref === pref.id}
                            className={`flex-1 cursor-pointer border-b py-4 font-sans text-[15px] transition-all ${
                              therapistPref === pref.id
                                ? "border-[#c5a880] text-[#f7f4ee]"
                                : "border-white/[0.1] text-[#e8ded2]/60 hover:text-[#f7f4ee]"
                            }`}
                          >
                            {pref.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="mb-4 block font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/50">Room</span>
                      <div className="flex gap-4">
                        {ROOM_TYPES.map((room) => (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() => setRoomType(room.id)}
                            aria-pressed={roomType === room.id}
                            className={`flex-1 cursor-pointer border-b py-4 font-sans text-[15px] transition-all ${
                              roomType === room.id
                                ? "border-[#c5a880] text-[#f7f4ee]"
                                : "border-white/[0.1] text-[#e8ded2]/60 hover:text-[#f7f4ee]"
                            }`}
                          >
                            {room.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="block max-w-xl">
                    <span className="mb-4 block font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/50">Aroma oil</span>
                    <select
                      value={oil}
                      onChange={(event) => setOil(event.target.value)}
                      className={`${fieldClass} [color-scheme:dark]`}
                    >
                      {OILS.map((option) => (
                        <option key={option} value={option} className="bg-[#0a0907]">
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              {step === "details" && (
                <>
                  <h2 className="max-w-[20ch] text-[2.1rem] sm:text-[3.1rem] font-serif font-light leading-[1.06] text-[#f7f4ee]">
                    Who should we keep the room <span className="italic text-[#c5a880]">for</span>?
                  </h2>

                  <div className="grid max-w-4xl gap-x-12 gap-y-8 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-4 block font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/50">Full name</span>
                      <input
                        id="booking-guest-name"
                        type="text"
                        value={guestName}
                        onChange={(event) => setGuestName(event.target.value)}
                        placeholder="Priya Sharma"
                        className={fieldClass}
                      />
                      {errors.name && (
                        <span className="mt-1.5 block text-[11px] text-[#e0785e]">{errors.name}</span>
                      )}
                    </label>

                    <label className="block">
                      <span className="mb-4 block font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/50">Mobile</span>
                      <div
                        className={`flex items-center border-b transition-colors focus-within:border-[#c5a880] ${
                          errors.phone ? "border-[#e0785e]/60" : "border-white/[0.14]"
                        }`}
                      >
                        <span className="pr-2.5 font-mono text-base text-[#e8ded2]/45">+91</span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={guestPhone}
                          onChange={(event) =>
                            setGuestPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
                          }
                          placeholder="98200 12345"
                          className="w-full bg-transparent py-3 text-base text-[#f7f4ee] placeholder:text-[#e8ded2]/25 focus:outline-none"
                        />
                      </div>
                      {errors.phone && (
                        <span className="mt-1.5 block text-[11px] text-[#e0785e]">{errors.phone}</span>
                      )}
                    </label>

                    <label className="block">
                      <span className="mb-4 block font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/50">
                        Email <span className="text-[#e8ded2]/30">(optional)</span>
                      </span>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(event) => setGuestEmail(event.target.value)}
                        placeholder="you@example.com"
                        className={fieldClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-4 block font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/50">
                        Promo code <span className="text-[#e8ded2]/30">(optional)</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(event) => {
                            setPromoInput(event.target.value.toUpperCase());
                            setPromoError("");
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              applyPromo(promoInput);
                            }
                          }}
                          placeholder="FIRST20"
                          className={`${fieldClass} font-mono uppercase tracking-wider`}
                        />
                        <button
                          type="button"
                          onClick={() => applyPromo(promoInput)}
                          className="shrink-0 border-b border-white/[0.14] pb-3 font-mono text-[11px] uppercase tracking-widest text-[#e8ded2]/60 transition-colors hover:border-[#c5a880] hover:text-[#c5a880] cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                      {promo && (
                        <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#c5a880]">
                          <Check className="h-3.5 w-3.5" />
                          {promo.label} — {promo.percent}% off
                        </span>
                      )}
                      {promoError && (
                        <span className="mt-1.5 block text-[11px] text-[#e0785e]">{promoError}</span>
                      )}
                    </label>

                    <label className="block sm:col-span-2">
                      <span className="mb-4 block font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8ded2]/50">
                        Anything we should know? <span className="text-[#e8ded2]/30">(optional)</span>
                      </span>
                      <input
                        type="text"
                        value={guestNotes}
                        onChange={(event) => setGuestNotes(event.target.value)}
                        placeholder="Injuries, allergies, pressure preference, occasion…"
                        className={fieldClass}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* footer: what you have so far, and the way forward */}
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-5 border-t border-white/[0.09] px-7 py-6 sm:px-14 lg:px-20">
              <div className="flex min-w-0 items-center gap-4">
                {activeStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-[#e8ded2]/50 transition-colors hover:text-[#c5a880] cursor-pointer"
                  >
                    ← Back
                  </button>
                )}
                <div className="min-w-0">
                  <span className="block truncate font-serif text-lg text-[#f7f4ee]">
                    {therapy.title}
                  </span>
                  <span className="block font-mono text-[11px] uppercase tracking-wider text-[#e8ded2]/45">
                    {prettyDate(date)} · {time} · {therapy.duration}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#e8ded2]/45">
                    Payable at spa
                  </span>
                  <span className="block font-mono text-2xl font-medium tabular-nums text-[#c5a880]">
                    {formatRupees(finalPrice)}
                    {discount > 0 && (
                      <span className="ml-2 font-mono text-[11px] text-[#e8ded2]/40 line-through">
                        {formatRupees(listPrice)}
                      </span>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={status === "saving"}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-[#c5a880] px-8 py-4 font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-[#07090b] transition-all hover:brightness-110 disabled:cursor-wait disabled:opacity-70 cursor-pointer"
                >
                  {status === "saving" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reserving…
                    </>
                  ) : isLastStep ? (
                    "Confirm reservation"
                  ) : (
                    "Continue →"
                  )}
                </button>
              </div>
            </footer>
          </div>
        )}
      </div>    </div>,
    document.body
  );
}
